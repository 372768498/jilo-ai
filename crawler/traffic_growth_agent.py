# crawler/traffic_growth_agent.py
#
# PV growth controller. It turns the business target (daily PV growth) into
# queue pressure: when the latest measured day misses target, it enqueues more
# high-intent SEO and comparison work from GSC demand.
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta

from supabase import create_client

import action_queue as aq
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_alert
from ops_logger import log_operation
from strategy_engine import parse_vs_query, route_to_hub


TARGET_GROWTH = float(os.getenv("PV_GROWTH_TARGET", "0.20"))
GSC_LOOKBACK_DAYS = int(os.getenv("PV_GROWTH_GSC_LOOKBACK_DAYS", "21"))
MIN_IMPRESSIONS = int(os.getenv("PV_GROWTH_MIN_IMPRESSIONS", "2"))
MAX_SEO_ACTIONS = int(os.getenv("PV_GROWTH_MAX_SEO_ACTIONS", "20"))
MAX_COMPARE_ACTIONS = int(os.getenv("PV_GROWTH_MAX_COMPARE_ACTIONS", "10"))
MAX_AEO_ACTIONS = int(os.getenv("PV_GROWTH_MAX_AEO_ACTIONS", "12"))

AEO_INTENT_TERMS = [
    'how ', 'how to', 'what ', 'what is', 'which ', 'should ', 'is ',
    'worth it', 'pricing', 'price', 'cost', 'free', 'best for',
    'beginner', 'beginners', 'alternative to', 'can i', 'do i need',
]


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _slugify(text):
    s = re.sub(r'[^a-z0-9\s-]', '', (text or '').lower())
    return re.sub(r'[\s-]+', '-', s).strip('-')


def _date_from_iso(value):
    return (value or '')[:10]


def latest_pv_pair(supabase):
    """Return latest two site-level PV days as (latest, previous)."""
    try:
        rows = supabase.table('analytics_site_daily').select(
            'date, total_pageviews'
        ).order('date', desc=True).limit(2).execute()
        data = rows.data or []
        if len(data) >= 2:
            return (
                {'date': _date_from_iso(data[0]['date']), 'pv': data[0].get('total_pageviews') or 0},
                {'date': _date_from_iso(data[1]['date']), 'pv': data[1].get('total_pageviews') or 0},
            )
    except Exception as e:
        print(f"analytics_site_daily unavailable, falling back to analytics_daily: {e}")

    rows = supabase.table('analytics_daily').select('date, pageviews').order(
        'date', desc=True
    ).limit(500).execute()
    by_date = defaultdict(int)
    for row in rows.data or []:
        by_date[_date_from_iso(row.get('date'))] += row.get('pageviews') or 0
    dates = sorted([d for d in by_date if d], reverse=True)
    if len(dates) < 2:
        return None, None
    return {'date': dates[0], 'pv': by_date[dates[0]]}, {'date': dates[1], 'pv': by_date[dates[1]]}


def _already_handled(supabase, dedup_key):
    rows = supabase.table('action_queue').select('id').eq(
        'dedup_key', dedup_key
    ).in_('status', ['pending', 'in_progress', 'done']).limit(1).execute()
    return bool(rows.data)


def _priority(impressions, position):
    if impressions >= 15 or position <= 25:
        return 'high'
    if impressions >= 6 or position <= 50:
        return 'medium'
    return 'low'


def is_aeo_query(query):
    q = f" {(query or '').lower().strip()} "
    if ' vs ' in q:
        return False
    return any(term in q for term in AEO_INTENT_TERMS)


def enqueue_gsc_growth_actions(supabase, deficit):
    since = (datetime.utcnow() - timedelta(days=GSC_LOOKBACK_DAYS)).strftime('%Y-%m-%d')
    rows = supabase.table('search_console_daily').select(
        'query, impressions, clicks, position'
    ).gte('date', since).execute()

    agg = defaultdict(lambda: {'impr': 0, 'clicks': 0, 'wpos': 0.0})
    for row in rows.data or []:
        query = (row.get('query') or '').strip()
        if not query:
            continue
        impressions = row.get('impressions') or 0
        agg[query]['impr'] += impressions
        agg[query]['clicks'] += row.get('clicks') or 0
        agg[query]['wpos'] += (row.get('position') or 0) * impressions

    seo_candidates = []
    aeo_candidates = []
    compare_candidates = []
    for query, data in agg.items():
        impressions = data['impr']
        if impressions < MIN_IMPRESSIONS:
            continue
        position = data['wpos'] / impressions if impressions else 999
        clicks = data['clicks']

        # Near-page-one zero-click queries are the fastest PV lever.
        if clicks > 0 and position > 15:
            continue
        if position > 100:
            continue

        pair = parse_vs_query(query)
        if pair:
            score = impressions * (2.0 if position <= 30 else 1.0)
            compare_candidates.append((score, query, pair, impressions, position, clicks))
            continue

        # Category queries are handled by hubs, not more standalone articles.
        if route_to_hub(query):
            continue
        score = impressions * (3.0 if position <= 20 and clicks == 0 else 1.0) / max(position, 1)
        if is_aeo_query(query):
            aeo_candidates.append((score * 1.4, query, impressions, position, clicks))
        else:
            seo_candidates.append((score, query, impressions, position, clicks))

    aeo_candidates.sort(reverse=True)
    seo_candidates.sort(reverse=True)
    compare_candidates.sort(reverse=True)

    opened = 0
    actions = []
    for _, query, impressions, position, clicks in aeo_candidates[:MAX_AEO_ACTIONS]:
        dedup_key = f"aeo:{_slugify(query)}"
        if _already_handled(supabase, dedup_key):
            continue
        priority = _priority(impressions, position)
        if aq.enqueue(
            supabase,
            action_type='generate_seo_content',
            payload={
                'mode': 'aeo',
                'keyword': query,
                'source': 'pv_growth',
                'target_growth': TARGET_GROWTH,
                'impressions': impressions,
                'clicks': clicks,
                'position': round(position, 1),
                'pv_deficit': deficit,
            },
            reason=f'PV growth miss: AEO answer for "{query}" has {impressions} impressions, pos {position:.1f}, {clicks} clicks',
            priority=priority,
            dedup_key=dedup_key,
        ):
            opened += 1
            actions.append({'type': 'aeo', 'query': query, 'impressions': impressions, 'position': round(position, 1)})

    for _, query, impressions, position, clicks in seo_candidates[:MAX_SEO_ACTIONS]:
        dedup_key = f"seo:{_slugify(query)}"
        if _already_handled(supabase, dedup_key):
            continue
        priority = _priority(impressions, position)
        if aq.enqueue(
            supabase,
            action_type='generate_seo_content',
            payload={
                'keyword': query,
                'source': 'pv_growth',
                'target_growth': TARGET_GROWTH,
                'impressions': impressions,
                'clicks': clicks,
                'position': round(position, 1),
                'pv_deficit': deficit,
            },
            reason=f'PV growth miss: "{query}" has {impressions} impressions, pos {position:.1f}, {clicks} clicks',
            priority=priority,
            dedup_key=dedup_key,
        ):
            opened += 1
            actions.append({'type': 'seo', 'query': query, 'impressions': impressions, 'position': round(position, 1)})

    for _, query, pair, impressions, position, clicks in compare_candidates[:MAX_COMPARE_ACTIONS]:
        tool_a, tool_b = pair
        a, b = sorted([_slugify(tool_a), _slugify(tool_b)])
        dedup_key = f"compare:{a}|{b}"
        if _already_handled(supabase, dedup_key):
            continue
        priority = _priority(impressions, position)
        if aq.enqueue(
            supabase,
            action_type='generate_comparison',
            payload={
                'tool_a': tool_a,
                'tool_b': tool_b,
                'source': 'pv_growth',
                'target_growth': TARGET_GROWTH,
                'query': query,
                'impressions': impressions,
                'clicks': clicks,
                'position': round(position, 1),
                'pv_deficit': deficit,
            },
            reason=f'PV growth miss: comparison query "{query}" has {impressions} impressions, pos {position:.1f}',
            priority=priority,
            dedup_key=dedup_key,
        ):
            opened += 1
            actions.append({'type': 'compare', 'query': query, 'impressions': impressions, 'position': round(position, 1)})

    return opened, actions


def run():
    supabase = get_supabase()
    latest, previous = latest_pv_pair(supabase)
    if not latest or not previous:
        return {'status': 'no_pv_baseline', 'opened': 0}

    target = int(round(previous['pv'] * (1 + TARGET_GROWTH)))
    deficit = max(target - latest['pv'], 0)
    growth = ((latest['pv'] - previous['pv']) / previous['pv']) if previous['pv'] else 0
    result = {
        'latest': latest,
        'previous': previous,
        'target_pv': target,
        'target_growth': TARGET_GROWTH,
        'growth': round(growth, 4),
        'deficit': deficit,
        'opened': 0,
    }
    if deficit <= 0:
        result['status'] = 'target_met'
        return result

    opened, actions = enqueue_gsc_growth_actions(supabase, deficit)
    result.update({'status': 'target_missed', 'opened': opened, 'actions': actions})
    return result


if __name__ == "__main__":
    print("Starting traffic growth agent...")
    try:
        result = run()
        print(result)
        log_operation(
            "traffic_growth_agent",
            "success",
            f"{result.get('status')} opened={result.get('opened', 0)}",
            result,
        )
    except Exception as e:
        log_operation("traffic_growth_agent", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "Traffic growth agent error", str(e), "error")
        raise

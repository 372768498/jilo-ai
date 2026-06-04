# crawler/traffic_growth_agent.py
#
# PV growth controller. It turns the business target (daily PV growth) into
# queue pressure: when the latest measured day misses target, it enqueues more
# high-intent SEO and comparison work from GSC demand.
import math
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta

from supabase import create_client

import action_queue as aq
import growth_state
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
MAX_REWRITE_ACTIONS = int(os.getenv("PV_GROWTH_MAX_REWRITE_ACTIONS", "8"))

# rank1 — gradient budget. The deficit decides HOW MUCH we produce, not just
# on/off (invariant I4). A bigger PV gap funds more pages across all modes, up
# to the per-mode caps above; a tiny gap still funds the floors so we never
# over-produce and dilute quality. estimate_pv_per_page grounds the conversion
# in real history; the static caps become upper bounds, never the fixed output.
EST_PV_PER_PAGE_FALLBACK = float(os.getenv("PV_GROWTH_EST_PV_PER_PAGE", "5"))
MODE_FLOORS = {'aeo': 2, 'seo': 3, 'compare': 1, 'rewrite': 1}
MODE_CAPS = {
    'aeo': MAX_AEO_ACTIONS,
    'seo': MAX_SEO_ACTIONS,
    'compare': MAX_COMPARE_ACTIONS,
    'rewrite': MAX_REWRITE_ACTIONS,
}
# Default split of the page budget across modes. AEO is favored: citeable
# zero-click answer pages are the fastest PV lever. rank3 replaces this static
# split with one derived from measured per-mode effectiveness.
MODE_WEIGHTS = {'aeo': 0.40, 'seo': 0.30, 'compare': 0.15, 'rewrite': 0.15}

AEO_INTENT_TERMS = [
    'how ', 'how to', 'what ', 'what is', 'which ', 'should ', 'is ',
    'worth it', 'pricing', 'price', 'cost', 'free', 'best for',
    'beginner', 'beginners', 'alternative to', 'can i', 'do i need',
]

# Chinese high-intent terms. The English list above is space-delimited and never
# matches CJK queries, so the site's single largest demand cluster (ChatGPT /
# Sora "怎么用 / 充值 / 国内怎么用 / plus 订阅") was silently routed to low-priority
# SEO instead of citeable AEO answer pages. These are substring matches (Chinese
# has no word spaces). Kept tight to access/how-to/pricing intent to avoid
# over-claiming generic queries as AEO.
AEO_INTENT_TERMS_ZH = [
    '怎么', '如何', '怎样', '教程', '能用', '可以用', '怎么用', '怎么开通', '开通',
    '充值', '订阅', '注册', '购买', '多少钱', '价格', '收费', '免费',
    '国内', '中国', '镜像', '入口', '官网', '会员', 'plus', '账号', '下载',
]


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def estimate_pv_per_page(supabase):
    """Average PV a generated page earns, from lookback history. Conservative
    fallback when we don't yet have enough snapshots — better to under-promise
    pages-per-PV (and thus over-produce slightly) than to starve the queue."""
    try:
        rows = supabase.table('page_performance_lookback').select(
            'pageviews'
        ).gt('pageviews', 0).limit(500).execute()
        pvs = [r['pageviews'] for r in (rows.data or []) if r.get('pageviews')]
        if len(pvs) >= 5:
            return max(sum(pvs) / len(pvs), 1.0)
    except Exception as e:
        print(f"estimate_pv_per_page fallback ({EST_PV_PER_PAGE_FALLBACK}): {e}")
    return EST_PV_PER_PAGE_FALLBACK


def effectiveness_to_weights(effectiveness):
    """rank3 consumer: turn measured per-mode PV into a budget split that tilts
    toward what earns PV (invariant I2 — this is what makes the EFFECTIVENESS_KEY
    write matter). A mode performing above the cross-mode mean is boosted, below
    is cut; modes with no data keep their base weight. Returns None (use static
    MODE_WEIGHTS) until there's enough signal to act on."""
    modes_data = (effectiveness or {}).get('modes') or {}
    measured = {m: (modes_data.get(m) or {}).get('avg_pv') for m in MODE_CAPS}
    vals = [v for v in measured.values() if v is not None]
    if len(vals) < 2 or sum(vals) <= 0:
        return None
    mean = sum(vals) / len(vals)
    if mean <= 0:
        return None
    weights = {}
    for mode in MODE_CAPS:
        v = measured[mode]
        if v is None:
            weights[mode] = MODE_WEIGHTS[mode]
        else:
            factor = max(0.3, min(v / mean, 2.5))
            weights[mode] = MODE_WEIGHTS[mode] * factor
    return weights


def apply_verdict_gate(budget, verdict, blockers):
    """rank4 consumer: the autonomy guardian's last health verdict gates this
    run's budget (invariant I2 — the VERDICT_KEY write changes behavior here).

    A degraded system freezes NEW content (aeo/seo/compare -> 0) and keeps only
    rewrites: improving existing pages doesn't grow an already-stuck backlog.
    A specific backlog blocker zeros just its own mode.
    """
    out = dict(budget)
    blockers = blockers or []
    if isinstance(verdict, str) and verdict.startswith('degraded'):
        for mode in ('aeo', 'seo', 'compare'):
            out[mode] = 0
    if 'seo_backlog' in blockers:
        out['seo'] = 0
    if 'compare_backlog' in blockers:
        out['compare'] = 0
    return out


def apply_suppress(budget, suppress):
    """rank3/rank9 disinvestment: force suppressed modes to zero, overriding the
    floor. A mode that has earned 0 PV across enough pages stops consuming budget
    entirely (the user's '降级无效动作')."""
    out = dict(budget)
    for mode in (suppress or []):
        if mode in out:
            out[mode] = 0
    return out


def compute_growth_budget(deficit, est_pv_per_page, weights=None):
    """Translate a PV deficit into a per-mode action budget (invariant I4).

    deficit <= 0      -> all zeros (target met, no pressure)
    small deficit     -> per-mode floors (minimum pressure, no dilution)
    large deficit     -> per-mode caps
    in between         -> monotonic non-decreasing in deficit

    `weights` lets rank3 inject an effectiveness-derived split; defaults to the
    static MODE_WEIGHTS.
    """
    if deficit <= 0:
        return {mode: 0 for mode in MODE_CAPS}
    weights = weights or MODE_WEIGHTS
    required_pages = math.ceil(deficit / max(est_pv_per_page, 1.0))
    budget = {}
    for mode, cap in MODE_CAPS.items():
        want = math.ceil(required_pages * weights.get(mode, 0.0))
        budget[mode] = max(MODE_FLOORS[mode], min(want, cap))
    return budget


def _slugify(text):
    s = re.sub(r'[^a-z0-9\s-]', '', (text or '').lower())
    return re.sub(r'[\s-]+', '-', s).strip('-')


def _date_from_iso(value):
    return (value or '')[:10]


def robust_baseline(pv_series):
    """rank9 (A9b): a noise-resistant 'previous' PV to target against.
    pv_series is newest-first. Uses max(yesterday, 7-day average) so a single
    weekend dip or dropped-collection day can't make a real decline look like it
    hit target. Returns (latest_pv, previous_pv) or (None, None)."""
    clean = [pv for pv in pv_series if pv]  # drop 0 / missing days
    if len(clean) < 2:
        return None, None
    latest = clean[0]
    window = clean[1:8]
    previous = max(clean[1], sum(window) / len(window))
    return latest, previous


def latest_pv_pair(supabase):
    """Return (latest, previous) site-level PV, with a noise-resistant baseline."""
    try:
        rows = supabase.table('analytics_site_daily').select(
            'date, total_pageviews'
        ).order('date', desc=True).limit(8).execute()
        data = [r for r in (rows.data or []) if (r.get('total_pageviews') or 0) > 0]
        if len(data) >= 2:
            latest_pv, previous_pv = robust_baseline(
                [r.get('total_pageviews') or 0 for r in data]
            )
            if latest_pv is not None:
                return (
                    {'date': _date_from_iso(data[0]['date']), 'pv': latest_pv},
                    {'date': _date_from_iso(data[1]['date']), 'pv': int(round(previous_pv))},
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
    if any(term in q for term in AEO_INTENT_TERMS):
        return True
    # CJK intent: match raw substrings (no surrounding spaces) on the original
    # query so Chinese access/how-to/pricing demand routes to AEO, not SEO.
    raw = (query or '').lower()
    return any(term in raw for term in AEO_INTENT_TERMS_ZH)


def enqueue_gsc_growth_actions(supabase, deficit, budget):
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
    for _, query, impressions, position, clicks in aeo_candidates[:budget['aeo']]:
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

    for _, query, impressions, position, clicks in seo_candidates[:budget['seo']]:
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

    for _, query, pair, impressions, position, clicks in compare_candidates[:budget['compare']]:
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


def enqueue_rewrite_actions(supabase, deficit, limit):
    """Pull underperforming pages into the SAME deficit-driven budget pool (A1b).

    Near-page-one pages (position 11-20) and high-impression zero-/low-CTR pages
    are the cheapest PV gains: Google already ranks them, they just need to win.
    Capped by `limit` (= budget['rewrite']), so a bigger gap drives more rewrites
    (invariant I4). dedup_key `rewrite:{slug}` is shared with strategy_engine, so
    the single queue never double-enqueues the same page (invariant I1).
    """
    if limit <= 0:
        return 0, []
    try:
        rows = supabase.table('page_performance_lookback').select(
            'content_type, slug, age_bucket, position, ctr, impressions'
        ).gte('age_bucket', 7).execute()
    except Exception as e:
        print(f"rewrite pool unavailable: {e}")
        return 0, []

    by_slug = {}
    for r in (rows.data or []):
        cur = by_slug.get(r['slug'])
        if not cur or (r.get('age_bucket') or 0) > (cur.get('age_bucket') or 0):
            by_slug[r['slug']] = r

    candidates = []
    for slug, snap in by_slug.items():
        impr = snap.get('impressions') or 0
        pos = snap.get('position')
        ctr = snap.get('ctr') or 0
        if impr < 5 or pos is None:
            continue
        if (11 <= pos <= 20) or ctr < 0.01:
            candidates.append((impr / max(pos, 1), slug, snap))
    candidates.sort(reverse=True)

    opened, actions = 0, []
    for _, slug, snap in candidates[:limit]:
        dedup_key = f"rewrite:{slug}"
        if _already_handled(supabase, dedup_key):
            continue
        if aq.enqueue(
            supabase,
            action_type='generate_seo_content',
            payload={
                'mode': 'rewrite',
                'slug': slug,
                'content_type': snap.get('content_type', 'seo_article'),
                'keyword': slug.replace('-', ' '),
                'source': 'pv_growth',
                'target_growth': TARGET_GROWTH,
                'pv_deficit': deficit,
            },
            reason=f'PV growth rewrite: {slug} pos {snap.get("position")}, ctr {(snap.get("ctr") or 0):.1%}, {snap.get("impressions")} impr',
            priority='medium',
            dedup_key=dedup_key,
        ):
            opened += 1
            actions.append({'type': 'rewrite', 'slug': slug, 'position': snap.get('position')})
    return opened, actions


def run():
    supabase = get_supabase()

    # Turn-head read of the shared decision state (G0 foundation). Surfaced into
    # the result for observability now; rank1 turns effectiveness into a scalable
    # budget and rank4 turns the verdict into quota gating.
    state = growth_state.get_verdict(supabase)
    effectiveness = growth_state.get_mode_effectiveness(supabase)
    suppress = growth_state.get_suppress(supabase)

    latest, previous = latest_pv_pair(supabase)
    if not latest or not previous:
        return {'status': 'no_pv_baseline', 'opened': 0,
                'autonomy_verdict': state['verdict']}

    target = int(round(previous['pv'] * (1 + TARGET_GROWTH)))
    deficit = max(target - latest['pv'], 0)
    growth = ((latest['pv'] - previous['pv']) / previous['pv']) if previous['pv'] else 0

    est_pv_per_page = estimate_pv_per_page(supabase)
    weights = effectiveness_to_weights(effectiveness)
    budget = compute_growth_budget(deficit, est_pv_per_page, weights=weights)
    budget = apply_suppress(budget, suppress)
    budget = apply_verdict_gate(budget, state['verdict'], state['blockers'])

    result = {
        'latest': latest,
        'previous': previous,
        'target_pv': target,
        'target_growth': TARGET_GROWTH,
        'growth': round(growth, 4),
        'deficit': deficit,
        'est_pv_per_page': round(est_pv_per_page, 2),
        'budget': budget,
        'weighting': 'effectiveness' if weights else 'static',
        'suppressed': [m for m in suppress if m in MODE_CAPS],
        'autonomy_verdict': state['verdict'],
        'opened': 0,
    }
    if deficit <= 0:
        result['status'] = 'target_met'
        return result

    opened, actions = enqueue_gsc_growth_actions(supabase, deficit, budget)
    r_opened, r_actions = enqueue_rewrite_actions(supabase, deficit, budget['rewrite'])
    result.update({
        'status': 'target_missed',
        'opened': opened + r_opened,
        'actions': actions + r_actions,
    })
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

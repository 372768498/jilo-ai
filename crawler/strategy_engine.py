# crawler/strategy_engine.py
import re
from collections import defaultdict
from datetime import datetime, timedelta
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _slugify(text):
    s = re.sub(r'[^a-z0-9\s-]', '', text.lower())
    return re.sub(r'[\s-]+', '-', s).strip('-')


def build_dedup_key(action):
    """Stable, normalized key so the same logical action is never enqueued twice."""
    t = action['type']
    if t == 'generate_seo_content':
        if action.get('mode') == 'rewrite':
            return f"rewrite:{action['slug']}"
        return f"seo:{_slugify(action['keyword'])}"
    if t == 'generate_comparison':
        a, b = sorted([_slugify(action['tool_a']), _slugify(action['tool_b'])])
        return f"compare:{a}|{b}"
    if t == 'flag_for_review':
        return f"flag:{_slugify(action['page'])}"
    raise ValueError(f"Unknown action type: {t}")


# Rewrite thresholds — a page that's had real search exposure but isn't winning.
# Tune once page_performance_lookback has accumulated real snapshots.
REWRITE_MIN_AGE = 7            # only judge pages that have had a fair chance
REWRITE_MIN_IMPRESSIONS = 30   # Google is showing it, so ranking is the issue
REWRITE_POSITION_FLOOR = 20    # ranking worse than ~page 2
REWRITE_CTR_FLOOR = 0.01       # shown a lot, almost nobody clicks
REWRITE_COOLDOWN_DAYS = 7      # don't re-rewrite the same page in a tight loop


def check_underperforming_pages():
    """
    Read page_performance_lookback and queue rewrites for pages that have had
    real search exposure but rank poorly or get no clicks. Pages with too few
    impressions are left alone — they haven't had a fair chance yet, and a
    rewrite wouldn't fix an indexing/age problem.
    """
    supabase = get_supabase()

    rows = supabase.table('page_performance_lookback').select(
        'content_type, slug, age_bucket, position, ctr, impressions'
    ).gte('age_bucket', REWRITE_MIN_AGE).execute()

    # Keep the most mature snapshot per slug.
    by_slug = {}
    for r in (rows.data or []):
        cur = by_slug.get(r['slug'])
        if not cur or r['age_bucket'] > cur['age_bucket']:
            by_slug[r['slug']] = r

    cutoff = (datetime.utcnow() - timedelta(days=REWRITE_COOLDOWN_DAYS)).isoformat()
    actions = []
    for slug, snap in by_slug.items():
        impr = snap.get('impressions') or 0
        if impr < REWRITE_MIN_IMPRESSIONS:
            continue
        pos = snap.get('position')
        ctr = snap.get('ctr') or 0
        underperforming = (pos is not None and pos > REWRITE_POSITION_FLOOR) or (ctr < REWRITE_CTR_FLOOR)
        if not underperforming:
            continue

        # Cooldown: skip if we already rewrote this page recently.
        recent = supabase.table('action_queue').select('id').eq(
            'dedup_key', f'rewrite:{slug}'
        ).eq('status', 'done').gte('completed_at', cutoff).execute()
        if recent.data:
            continue

        actions.append({
            'type': 'generate_seo_content',
            'mode': 'rewrite',
            'slug': slug,
            'content_type': snap['content_type'],
            'keyword': slug.replace('-', ' '),
            'reason': f"{snap['age_bucket']} 天龄表现不佳：排名 {pos}、点击率 {ctr:.1%}、曝光 {impr}，进队重写",
            'priority': 'medium',
        })

    return actions


# Keyword-opportunity thresholds. The old rule ("improved from 10+ into 5-10")
# never fires on a young site whose queries all sit at position 40-90, so the
# SEO generator starved. Instead: target queries with real demand that we
# already rank for — but too low — and don't yet have a dedicated page.
OPP_MIN_IMPRESSIONS = 5    # confirmed demand (top queries here have 6-27)
OPP_POS_MIN = 11           # not already top-10 (those are winning, leave them)
OPP_POS_MAX = 80           # ranking exists but poor; beyond this it's noise
OPP_MAX_PER_RUN = 10       # cap new evergreen targets per run


def _opp_priority(impressions):
    if impressions >= 20:
        return 'high'
    if impressions >= 10:
        return 'medium'
    return 'low'


def check_keyword_opportunities():
    """
    Find queries with real search demand that rank poorly and have no dedicated
    page yet — the highest-leverage evergreen targets. Google already surfaces
    us for them; we just rank too low. Pages we've already made are skipped
    here (improving those is the lookback-driven rewrite path's job).
    """
    supabase = get_supabase()
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    rows = supabase.table('search_console_daily').select(
        'query, impressions, clicks, position'
    ).gte('date', week_ago).execute()

    # Aggregate per query: total impressions/clicks, impression-weighted position.
    agg = defaultdict(lambda: {'impr': 0, 'clicks': 0, 'wpos': 0.0})
    for r in (rows.data or []):
        q = r['query']
        impr = r.get('impressions') or 0
        agg[q]['impr'] += impr
        agg[q]['clicks'] += r.get('clicks') or 0
        agg[q]['wpos'] += (r.get('position') or 0) * impr

    candidates = []
    for q, a in agg.items():
        # 'X vs Y' queries are the comparison generator's job — don't double up.
        if ' vs ' in q.lower():
            continue
        if a['impr'] < OPP_MIN_IMPRESSIONS:
            continue
        avg_pos = a['wpos'] / a['impr'] if a['impr'] else 999
        if not (OPP_POS_MIN <= avg_pos <= OPP_POS_MAX):
            continue
        candidates.append((q, a['impr'], avg_pos))

    # Strongest demand first.
    candidates.sort(key=lambda x: -x[1])

    actions = []
    for query, impr, avg_pos in candidates[:OPP_MAX_PER_RUN]:
        dedup_key = f"seo:{_slugify(query)}"
        # Skip if we already made (or are making) a page for this keyword.
        existing = supabase.table('action_queue').select('id').eq(
            'dedup_key', dedup_key
        ).in_('status', ['pending', 'in_progress', 'done']).execute()
        if existing.data:
            continue
        actions.append({
            'type': 'generate_seo_content',
            'reason': f'"{query}" 有 {impr} 次曝光但排名第 {avg_pos:.0f}，且无专属页 — 做深 evergreen',
            'keyword': query,
            'priority': _opp_priority(impr),
        })

    return actions


def check_vs_queries_without_articles():
    """Find 'vs' queries with no corresponding compare article."""
    supabase = get_supabase()
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    vs_queries = supabase.table('search_console_daily').select(
        'query, impressions'
    ).gte('date', week_ago).ilike('query', '%vs%').order(
        'impressions', desc=True
    ).limit(10).execute()

    # Aggregate impressions by query (deduplicate multi-day rows)
    query_impressions = defaultdict(int)
    for q in (vs_queries.data or []):
        q_lower = q['query'].lower()
        if ' vs ' in q_lower:
            query_impressions[q_lower] += q['impressions']

    actions = []
    for query, total_impressions in sorted(query_impressions.items(), key=lambda x: -x[1])[:10]:
        parts = query.split(' vs ')
        if len(parts) != 2:
            continue

        slug_guess = f"{parts[0].strip()}-vs-{parts[1].strip()}".replace(' ', '-')
        existing = supabase.table('compare_articles').select('id').ilike('slug', f'%{slug_guess}%').execute()

        if not existing.data:
            actions.append({
                'type': 'generate_comparison',
                'reason': f'搜索词 "{query}" 有 {total_impressions} 次曝光但还没有对比文章',
                'tool_a': parts[0].strip(),
                'tool_b': parts[1].strip(),
                'priority': 'medium',
            })

    return actions


def check_high_bounce_pages():
    """Find pages with bounce rate > 80% that need attention."""
    supabase = get_supabase()
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    # Fetch raw rows
    raw = supabase.table('analytics_daily').select(
        'page_path, bounce_rate, pageviews'
    ).gte('date', week_ago).execute()

    # Aggregate in Python
    page_bounce = defaultdict(list)
    page_views = defaultdict(int)
    for r in (raw.data or []):
        page_bounce[r['page_path']].append(r['bounce_rate'])
        page_views[r['page_path']] += r['pageviews']

    actions = []
    for page_path, bounce_rates in page_bounce.items():
        if page_views[page_path] < 10:
            continue
        avg_bounce = sum(bounce_rates) / len(bounce_rates)
        if avg_bounce > 0.8:
            actions.append({
                'type': 'flag_for_review',
                'reason': f'页面 {page_path} 跳出率高达 {avg_bounce:.0%}，需排查',
                'page': page_path,
                'priority': 'low',
            })

    return actions


def enqueue_action(supabase, action, source_report_id):
    """
    Upsert action into action_queue keyed by dedup_key.
    If an open row (pending|in_progress) already exists for the same logical
    action, the insert is a no-op so we never queue the same work twice.
    Returns True if a new row was created, False if already queued.
    """
    dedup_key = build_dedup_key(action)
    existing = supabase.table('action_queue').select('id, status').eq(
        'dedup_key', dedup_key
    ).in_('status', ['pending', 'in_progress']).execute()
    if existing.data:
        return False

    payload = {k: v for k, v in action.items() if k not in ('type', 'priority', 'reason')}
    supabase.table('action_queue').insert({
        'action_type': action['type'],
        'payload': payload,
        'reason': action.get('reason'),
        'priority': action.get('priority', 'medium'),
        'dedup_key': dedup_key,
        'source_report_id': source_report_id,
    }).execute()
    return True


def execute_actions(actions):
    """Persist strategy decisions: write history to strategy_reports AND emit to action_queue."""
    supabase = get_supabase()
    today = datetime.utcnow().strftime('%Y-%m-%d')

    # 1. Strategy report (audit trail, human-readable)
    existing = supabase.table('strategy_reports').select('id').eq(
        'report_date', today
    ).eq('report_type', 'daily').execute()

    if existing.data:
        report_id = existing.data[0]['id']
        supabase.table('strategy_reports').update({
            'actions_taken': actions,
            'content': {'action_count': len(actions)},
        }).eq('id', report_id).execute()
    else:
        ins = supabase.table('strategy_reports').insert({
            'report_date': today,
            'report_type': 'daily',
            'actions_taken': actions,
            'content': {'action_count': len(actions)},
        }).execute()
        report_id = ins.data[0]['id'] if ins.data else None

    # 2. Action queue (the bus that executors consume)
    enqueued = 0
    skipped = 0
    for action in actions:
        if enqueue_action(supabase, action, report_id):
            enqueued += 1
            print(f"  [ENQUEUE {action['priority'].upper()}] {action['type']}: {action['reason']}")
        else:
            skipped += 1
            print(f"  [DEDUP    {action['priority'].upper()}] {action['type']}: {action['reason']}")

    print(f"\n  Enqueued {enqueued}, deduped {skipped}")
    return enqueued


if __name__ == "__main__":
    print("Starting L2 strategy engine...")
    try:
        all_actions = []
        all_actions.extend(check_keyword_opportunities())
        all_actions.extend(check_vs_queries_without_articles())
        all_actions.extend(check_high_bounce_pages())
        all_actions.extend(check_underperforming_pages())

        print(f"\nFound {len(all_actions)} actions:")
        enqueued = execute_actions(all_actions)

        log_operation("strategy_engine", "success", f"Enqueued {enqueued} of {len(all_actions)} actions", {
            "found": len(all_actions),
            "enqueued": enqueued,
            "actions": all_actions,
        })
    except Exception as e:
        log_operation("strategy_engine", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "策略引擎出错", str(e), "error")
        raise

# crawler/strategy_engine.py
from collections import defaultdict
from datetime import datetime, timedelta
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def check_keyword_opportunities():
    """Find keywords ranking 5-10 that improved from 10+."""
    supabase = get_supabase()
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')
    two_weeks_ago = (datetime.utcnow() - timedelta(days=14)).strftime('%Y-%m-%d')

    # Fetch raw rows for current week
    current_rows = supabase.table('search_console_daily').select(
        'query, position'
    ).gte('date', week_ago).execute()

    # Fetch raw rows for previous week
    previous_rows = supabase.table('search_console_daily').select(
        'query, position'
    ).gte('date', two_weeks_ago).lt('date', week_ago).execute()

    # Aggregate in Python
    curr_positions = defaultdict(list)
    for r in (current_rows.data or []):
        curr_positions[r['query']].append(r['position'])
    curr_avg = {q: sum(v)/len(v) for q, v in curr_positions.items()}

    prev_positions = defaultdict(list)
    for r in (previous_rows.data or []):
        prev_positions[r['query']].append(r['position'])
    prev_avg = {q: sum(v)/len(v) for q, v in prev_positions.items()}

    actions = []
    for query, curr_pos in curr_avg.items():
        prev_pos = prev_avg.get(query, 100)

        # Keyword improved from 10+ to 5-10 → create more content
        if prev_pos > 10 and 5 <= curr_pos <= 10:
            actions.append({
                'type': 'generate_seo_content',
                'reason': f'Keyword "{query}" improved from position {prev_pos:.0f} to {curr_pos:.0f}',
                'keyword': query,
                'priority': 'high',
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
                'reason': f'Search query "{query}" has {total_impressions} impressions but no compare article',
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
                'reason': f'Page {page_path} has {avg_bounce:.0%} bounce rate',
                'page': page_path,
                'priority': 'low',
            })

    return actions


def execute_actions(actions):
    """Execute or queue the strategy actions."""
    supabase = get_supabase()

    # Save actions to strategy_reports.
    # NOTE: upsert requires a unique constraint on (report_date, report_type).
    # If that constraint doesn't exist in your DB, this falls back to a safe
    # select-then-insert pattern to avoid duplicates.
    today = datetime.utcnow().strftime('%Y-%m-%d')
    existing = supabase.table('strategy_reports').select('id').eq(
        'report_date', today
    ).eq('report_type', 'daily').execute()

    if existing.data:
        supabase.table('strategy_reports').update({
            'actions_taken': actions,
            'content': {'action_count': len(actions)},
        }).eq('id', existing.data[0]['id']).execute()
    else:
        supabase.table('strategy_reports').insert({
            'report_date': today,
            'report_type': 'daily',
            'actions_taken': actions,
            'content': {'action_count': len(actions)},
        }).execute()

    # For now, just log the actions. Actual execution (calling seo/compare generators)
    # would be done by separate scheduled jobs that read from strategy_reports.
    for action in actions:
        print(f"  [{action['priority'].upper()}] {action['type']}: {action['reason']}")

    return len(actions)


if __name__ == "__main__":
    print("Starting L2 strategy engine...")
    try:
        all_actions = []
        all_actions.extend(check_keyword_opportunities())
        all_actions.extend(check_vs_queries_without_articles())
        all_actions.extend(check_high_bounce_pages())

        print(f"\nFound {len(all_actions)} actions:")
        action_count = execute_actions(all_actions)

        log_operation("strategy_engine", "success", f"Found {action_count} actions", {
            "action_count": action_count,
            "actions": all_actions,
        })
    except Exception as e:
        log_operation("strategy_engine", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "Strategy Engine Error", str(e), "error")
        raise

# crawler/strategy_engine.py
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

    # Current week avg positions
    current = supabase.table('search_console_daily').select(
        'query, position.avg(), impressions.sum()'
    ).gte('date', week_ago).execute()

    # Previous week avg positions
    previous = supabase.table('search_console_daily').select(
        'query, position.avg()'
    ).gte('date', two_weeks_ago).lt('date', week_ago).execute()

    # Build lookup
    prev_positions = {r['query']: r['avg'] for r in (previous.data or [])}
    actions = []

    for row in (current.data or []):
        query = row['query']
        curr_pos = row.get('avg', 100)
        prev_pos = prev_positions.get(query, 100)

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

    actions = []
    for q in (vs_queries.data or []):
        query = q['query'].lower()
        if ' vs ' not in query:
            continue

        parts = query.split(' vs ')
        if len(parts) != 2:
            continue

        slug_guess = f"{parts[0].strip()}-vs-{parts[1].strip()}".replace(' ', '-')
        existing = supabase.table('compare_articles').select('id').ilike('slug', f'%{slug_guess}%').execute()

        if not existing.data:
            actions.append({
                'type': 'generate_comparison',
                'reason': f'Search query "{query}" has {q["impressions"]} impressions but no compare article',
                'tool_a': parts[0].strip(),
                'tool_b': parts[1].strip(),
                'priority': 'medium',
            })

    return actions


def check_high_bounce_pages():
    """Find pages with bounce rate > 80% that need attention."""
    supabase = get_supabase()
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    high_bounce = supabase.table('analytics_daily').select(
        'page_path, bounce_rate.avg(), pageviews.sum()'
    ).gte('date', week_ago).gte('pageviews', 10).execute()

    actions = []
    for row in (high_bounce.data or []):
        if row.get('avg', 0) > 0.8:
            actions.append({
                'type': 'flag_for_review',
                'reason': f'Page {row["page_path"]} has {row["avg"]:.0%} bounce rate',
                'page': row['page_path'],
                'priority': 'low',
            })

    return actions


def execute_actions(actions):
    """Execute or queue the strategy actions."""
    supabase = get_supabase()

    # Save actions to strategy_reports for tracking
    today = datetime.utcnow().strftime('%Y-%m-%d')
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

# crawler/daily_report.py
from datetime import datetime, timedelta
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_card
from ops_logger import log_operation


def get_today_stats():
    """Get today's content + analytics stats."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    today = datetime.utcnow().strftime('%Y-%m-%d')
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')
    two_days_ago = (datetime.utcnow() - timedelta(days=2)).strftime('%Y-%m-%d')

    # Content stats from ops_logs
    logs = supabase.table('ops_logs').select('*').gte('created_at', f'{today}T00:00:00Z').execute()
    stats = {'news_saved': 0, 'news_skipped': 0, 'tools_saved': 0, 'seo_articles': 0, 'compare_articles': 0, 'errors': []}
    for log in (logs.data or []):
        details = log.get('details', {})
        if log['status'] == 'error':
            stats['errors'].append(f"{log['job_name']}: {log['message']}")
        elif log['job_name'] == 'news_crawler':
            stats['news_saved'] += details.get('saved', 0)
            stats['news_skipped'] += details.get('skipped', 0)
        elif log['job_name'] == 'tool_discovery':
            stats['tools_saved'] += details.get('saved', 0)
        elif log['job_name'] == 'seo_articles':
            stats['seo_articles'] += details.get('saved', 0)
        elif log['job_name'] == 'compare_articles':
            stats['compare_articles'] += details.get('saved', 0)

    # Analytics: yesterday's totals (aggregate raw rows in Python)
    ga_yesterday = supabase.table('analytics_daily').select(
        'pageviews, unique_pageviews'
    ).eq('date', yesterday).execute()

    ga_prev = supabase.table('analytics_daily').select(
        'pageviews, unique_pageviews'
    ).eq('date', two_days_ago).execute()

    stats['pv'] = sum(r['pageviews'] for r in (ga_yesterday.data or []))
    stats['uv'] = sum(r['unique_pageviews'] for r in (ga_yesterday.data or []))
    stats['pv_prev'] = sum(r['pageviews'] for r in (ga_prev.data or []))

    # Top keywords from yesterday
    gsc_data = supabase.table('search_console_daily').select(
        'query, position, clicks, impressions'
    ).eq('date', yesterday).order('impressions', desc=True).limit(5).execute()
    stats['top_keywords'] = gsc_data.data or []

    # Strategy actions today
    strategy = supabase.table('strategy_reports').select('actions_taken').eq(
        'report_date', today
    ).eq('report_type', 'daily').execute()
    stats['strategy_actions'] = []
    for r in (strategy.data or []):
        stats['strategy_actions'].extend(r.get('actions_taken', []))

    return stats


def format_daily_report(stats):
    today = datetime.utcnow().strftime('%Y-%m-%d')

    # PV change
    pv_change = ""
    if stats.get('pv_prev') and stats.get('pv'):
        diff = ((stats['pv'] - stats['pv_prev']) / max(stats['pv_prev'], 1)) * 100
        arrow = "↑" if diff >= 0 else "↓"
        pv_change = f" ({arrow}{abs(diff):.0f}%)"

    # Keywords section
    kw_lines = []
    for kw in stats.get('top_keywords', [])[:5]:
        kw_lines.append(f"  - \"{kw['query']}\" pos:{kw['position']:.0f} clicks:{kw['clicks']}")
    kw_text = '\n'.join(kw_lines) if kw_lines else '  No data yet'

    # Strategy actions
    action_lines = []
    for a in stats.get('strategy_actions', [])[:5]:
        action_lines.append(f"  - [{a.get('priority', '?').upper()}] {a.get('reason', '')[:60]}")
    action_text = '\n'.join(action_lines) if action_lines else '  No actions today'

    errors_text = '\n'.join(f"  - {e}" for e in stats['errors']) if stats['errors'] else '  None'

    return f"""**jilo.ai Daily Report - {today}**

**Traffic (Yesterday)**
  PV: {stats.get('pv', 'N/A')}{pv_change}  UV: {stats.get('uv', 'N/A')}

**Content Created Today**
  News: {stats['news_saved']} | Tools: {stats['tools_saved']} | SEO: {stats['seo_articles']} | Compare: {stats['compare_articles']}

**Top Keywords**
{kw_text}

**L2 Strategy Actions**
{action_text}

**Errors**
{errors_text}"""


def send_daily_report():
    """Generate and send daily report to Feishu."""
    if not FEISHU_WEBHOOK_URL:
        print("FEISHU_WEBHOOK_URL not configured, skipping report")
        return

    stats = get_today_stats()
    content = format_daily_report(stats)
    today = datetime.utcnow().strftime('%Y-%m-%d')

    success = send_feishu_card(
        FEISHU_WEBHOOK_URL,
        f"jilo.ai Daily Report - {today}",
        content,
        color="blue"
    )

    status = "success" if success else "error"
    log_operation("daily_report", status, f"Report sent: {success}")
    print(f"Daily report sent: {success}")


if __name__ == "__main__":
    send_daily_report()

# crawler/daily_report.py
from datetime import datetime
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_card
from ops_logger import log_operation


def get_today_stats():
    """Get today's content creation stats from ops_logs."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    today = datetime.utcnow().strftime('%Y-%m-%d')

    logs = supabase.table('ops_logs').select('*').gte(
        'created_at', f'{today}T00:00:00Z'
    ).execute()

    stats = {'news_saved': 0, 'news_skipped': 0, 'tools_saved': 0, 'errors': []}
    for log in (logs.data or []):
        details = log.get('details', {})
        if log['job_name'] == 'news_crawler' and log['status'] == 'success':
            stats['news_saved'] += details.get('saved', 0)
            stats['news_skipped'] += details.get('skipped', 0)
        elif log['job_name'] == 'tool_discovery' and log['status'] == 'success':
            stats['tools_saved'] += details.get('saved', 0)
        elif log['status'] == 'error':
            stats['errors'].append(f"{log['job_name']}: {log['message']}")

    return stats


def format_daily_report(stats):
    """Format stats into a Feishu markdown card."""
    today = datetime.utcnow().strftime('%Y-%m-%d')
    errors_text = '\n'.join(f"- {e}" for e in stats['errors']) if stats['errors'] else 'None'

    return f"""**jilo.ai Daily Ops Report - {today}**

**Content Created Today**
- News: {stats['news_saved']} saved, {stats['news_skipped']} skipped (duplicates)
- Tools: {stats['tools_saved']} new tools

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

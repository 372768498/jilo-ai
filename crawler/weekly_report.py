# crawler/weekly_report.py
from collections import defaultdict
from datetime import datetime, timedelta
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_card
from ops_logger import log_operation


def _get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    return OpenAI(api_key=OPENAI_API_KEY)


def collect_weekly_data():
    """Gather the past week's analytics and content data."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    total_pv = 0
    total_uv = 0

    # GA summary: prefer site-level table for correct PV/UV (no double-count).
    try:
        site_rows = supabase.table('analytics_site_daily').select(
            'total_pageviews, total_users'
        ).gte('date', week_ago).execute()
        total_pv = sum(r['total_pageviews'] for r in (site_rows.data or []))
        # UV is summed across days (same user on different days counts multiple times,
        # which is standard "weekly UV" reporting behaviour)
        total_uv = sum(r['total_users'] for r in (site_rows.data or []))
    except Exception as e:
        print(f"analytics_site_daily unavailable, using analytics_daily fallback: {e}")

    # Top pages (aggregate in Python)
    page_rows = supabase.table('analytics_daily').select(
        'page_path, pageviews, unique_pageviews'
    ).gte('date', week_ago).execute()
    if not total_pv and not total_uv:
        total_pv = sum(r.get('pageviews', 0) for r in (page_rows.data or []))
        total_uv = sum(r.get('unique_pageviews', 0) for r in (page_rows.data or []))
    page_views = defaultdict(int)
    for r in (page_rows.data or []):
        page_views[r['page_path']] += r['pageviews']
    top_pages = [
        {'page_path': p, 'pageviews': v}
        for p, v in sorted(page_views.items(), key=lambda x: -x[1])[:10]
    ]

    # Top search queries (aggregate in Python)
    query_rows = supabase.table('search_console_daily').select(
        'query, impressions, clicks, position'
    ).gte('date', week_ago).execute()
    query_impressions = defaultdict(int)
    query_clicks = defaultdict(int)
    query_positions = defaultdict(list)
    for r in (query_rows.data or []):
        query_impressions[r['query']] += r['impressions']
        query_clicks[r['query']] += r['clicks']
        query_positions[r['query']].append(r['position'])
    top_queries = [
        {
            'query': q,
            'impressions': query_impressions[q],
            'clicks': query_clicks[q],
            'avg_position': sum(query_positions[q]) / len(query_positions[q]),
        }
        for q in sorted(query_impressions, key=lambda x: -query_impressions[x])[:20]
    ]

    # Content created this week
    content_logs = supabase.table('ops_logs').select(
        'job_name, details'
    ).gte('created_at', f'{week_ago}T00:00:00Z').eq('status', 'success').execute()

    # Strategy actions this week
    actions = supabase.table('strategy_reports').select(
        'actions_taken'
    ).gte('report_date', week_ago).execute()

    return {
        'total_pv': total_pv,
        'total_uv': total_uv,
        'top_pages': top_pages,
        'top_queries': top_queries,
        'content_logs': content_logs.data or [],
        'strategy_actions': actions.data or [],
    }


def generate_ai_strategy(weekly_data):
    """Use GPT-4o to analyze weekly data and suggest strategies."""
    top_pages_text = '\n'.join(
        f"  {p['page_path']}: {p['pageviews']} PV" for p in weekly_data['top_pages'][:10]
    )
    top_queries_text = '\n'.join(
        f"  \"{q['query']}\": {q['impressions']} impressions, pos {q['avg_position']:.0f}"
        for q in weekly_data['top_queries'][:15]
    )

    prompt = f"""Analyze this week's data for jilo.ai (AI tool discovery platform) and provide strategic recommendations.

Weekly Traffic: PV {weekly_data['total_pv']}, UV {weekly_data['total_uv']}

Top Pages by Pageviews:
{top_pages_text}

Top Search Queries (by impressions):
{top_queries_text}

Based on this data, provide:
1. **Performance Summary** (3-4 sentences)
2. **Content Recommendations** (3-5 specific actionable items)
3. **Keyword Opportunities** (top 3 keywords to target next week, with reasoning)
4. **Risks & Warnings** (anything concerning in the data)

Be specific and actionable. Reference actual data points."""

    try:
        response = _get_openai_client().chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a senior SEO and content strategist for an AI tool discovery platform. Provide data-driven, actionable recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=1500
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"GPT-4o strategy error: {e}")
        return f"AI strategy generation failed: {e}"


def send_weekly_report():
    """Generate and send weekly strategy report."""
    if not FEISHU_WEBHOOK_URL:
        print("FEISHU_WEBHOOK_URL not configured")
        return

    weekly_data = collect_weekly_data()
    strategy_text = generate_ai_strategy(weekly_data)

    today = datetime.utcnow().strftime('%Y-%m-%d')

    # Save to strategy_reports (upsert to avoid duplicates on re-runs)
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    supabase.table('strategy_reports').upsert({
        'report_date': today,
        'report_type': 'weekly',
        'content': {'strategy': strategy_text, 'data_summary': {
            'total_pv': weekly_data['total_pv'],
            'total_uv': weekly_data['total_uv'],
        }},
        'suggestions': [strategy_text],
    }, on_conflict='report_date,report_type').execute()

    # Send to Feishu
    content = f"""**jilo.ai Weekly Strategy Report - {today}**

**Traffic Summary**
  Weekly PV: {weekly_data['total_pv']}  UV: {weekly_data['total_uv']}

---

{strategy_text}"""

    success = send_feishu_card(FEISHU_WEBHOOK_URL, f"Weekly Strategy - {today}", content, color="purple")
    status = "success" if success else "error"
    log_operation("weekly_report", status, f"Report sent: {success}")
    print(f"Weekly report sent: {success}")


if __name__ == "__main__":
    send_weekly_report()

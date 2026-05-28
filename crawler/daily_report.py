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
    stats = {
        'news_saved': 0,
        'news_skipped': 0,
        'tools_saved': 0,
        'seo_articles': 0,
        'compare_articles': 0,
        'outbound_clicks': 0,
        'affiliate_clicks': 0,
        'errors': [],
    }
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
        elif log['job_name'] == 'outbound_click':
            stats['outbound_clicks'] += 1
            if details.get('has_affiliate'):
                stats['affiliate_clicks'] += 1

    tools = supabase.table('tools').select('id, affiliate_url').eq('status', 'published').execute()
    stats['affiliate_tools'] = sum(1 for t in (tools.data or []) if t.get('affiliate_url'))

    # Analytics: prefer site-level totals; fall back to page rows if the totals
    # table has not been created yet.
    try:
        site_yesterday = supabase.table('analytics_site_daily').select(
            'total_pageviews, total_users'
        ).eq('date', yesterday).execute()
        site_prev = supabase.table('analytics_site_daily').select(
            'total_pageviews'
        ).eq('date', two_days_ago).execute()

        if site_yesterday.data:
            stats['pv'] = site_yesterday.data[0]['total_pageviews']
            stats['uv'] = site_yesterday.data[0]['total_users']
        else:
            stats['pv'] = 0
            stats['uv'] = 0
        stats['pv_prev'] = site_prev.data[0]['total_pageviews'] if site_prev.data else 0
    except Exception as e:
        print(f"analytics_site_daily unavailable, using analytics_daily fallback: {e}")
        page_yesterday = supabase.table('analytics_daily').select(
            'pageviews, unique_pageviews'
        ).eq('date', yesterday).execute()
        page_prev = supabase.table('analytics_daily').select(
            'pageviews'
        ).eq('date', two_days_ago).execute()
        stats['pv'] = sum(r.get('pageviews', 0) for r in (page_yesterday.data or []))
        stats['uv'] = sum(r.get('unique_pageviews', 0) for r in (page_yesterday.data or []))
        stats['pv_prev'] = sum(r.get('pageviews', 0) for r in (page_prev.data or []))

    # Top keywords: GSC has a 2-3 day lag, so find the most recent date with data
    # Look back up to 5 days to find the latest available date
    stats['top_keywords'] = []
    stats['keywords_date'] = None
    stats['pages_to_update'] = []
    for days_back in range(1, 6):
        check_date = (datetime.utcnow() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        gsc_data = supabase.table('search_console_daily').select(
            'query, position, clicks, impressions'
        ).eq('date', check_date).order('impressions', desc=True).limit(5).execute()
        if gsc_data.data:
            stats['top_keywords'] = gsc_data.data
            stats['keywords_date'] = check_date
            try:
                opportunities = supabase.table('search_console_daily').select(
                    'query, page_path, position, clicks, impressions'
                ).eq('date', check_date).lte('position', 30).order('impressions', desc=True).limit(20).execute()
                stats['pages_to_update'] = [
                    row for row in (opportunities.data or [])
                    if row.get('impressions', 0) > 0 and row.get('clicks', 0) == 0
                ][:5]
            except Exception as e:
                print(f"Unable to load page update opportunities: {e}")
            break

    clicked_tools = supabase.table('tools').select(
        'slug, name_en, click_count, affiliate_url'
    ).eq('status', 'published').order('click_count', desc=True).limit(10).execute()
    stats['clicked_tools_without_affiliate'] = [
        t for t in (clicked_tools.data or [])
        if (t.get('click_count') or 0) > 0 and not t.get('affiliate_url')
    ][:5]

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

    # Keywords section (GSC lags 2-3 days; show most recent available date)
    kw_lines = []
    for kw in stats.get('top_keywords', [])[:5]:
        kw_lines.append(f"  - \"{kw['query']}\" pos:{kw['position']:.0f} clicks:{kw['clicks']}")
    kw_date_label = f" (数据日期: {stats.get('keywords_date', '?')})" if stats.get('keywords_date') else ""
    kw_text = '\n'.join(kw_lines) if kw_lines else '  暂无数据（GSC 通常延迟 2~3 天）'

    # Strategy actions
    action_lines = []
    for a in stats.get('strategy_actions', [])[:5]:
        action_lines.append(f"  - [{a.get('priority', '?').upper()}] {a.get('reason', '')[:60]}")
    action_text = '\n'.join(action_lines) if action_lines else '  今日无策略动作'

    page_lines = []
    for page in stats.get('pages_to_update', [])[:5]:
        page_lines.append(
            f"  - {page.get('page_path', '?')} | \"{page.get('query', '')}\" pos:{page.get('position', 0):.0f} imp:{page.get('impressions', 0)}"
        )
    pages_text = '\n'.join(page_lines) if page_lines else '  无'

    tool_lines = []
    for tool in stats.get('clicked_tools_without_affiliate', [])[:5]:
        tool_lines.append(f"  - {tool.get('name_en') or tool.get('slug')} ({tool.get('slug')}): {tool.get('click_count', 0)} 次点击")
    tools_text = '\n'.join(tool_lines) if tool_lines else '  无'

    tasks = []
    if stats.get('pages_to_update'):
        first_page = stats['pages_to_update'][0]
        tasks.append(f"优化 GEO 页面：{first_page.get('page_path', '?')}（关键词 \"{first_page.get('query', '')}\"）")
    else:
        tasks.append("从优先级清单里新建或优化一个 GEO 答案页")

    if stats.get('clicked_tools_without_affiliate'):
        first_tool = stats['clicked_tools_without_affiliate'][0]
        tasks.append(f"申请/跟进 {first_tool.get('name_en') or first_tool.get('slug')} 的联盟项目")
    else:
        tasks.append("申请/跟进一个优先级联盟项目")

    if stats.get('outbound_clicks', 0) == 0:
        tasks.append("优化一条 CTA 路径以产生出站点击")
    else:
        tasks.append("复盘出站点击来源，优化意图最强的页面")
    tasks_text = '\n'.join(f"  {idx + 1}. {task}" for idx, task in enumerate(tasks[:3]))

    errors_text = '\n'.join(f"  - {e}" for e in stats['errors']) if stats['errors'] else '  无'

    return f"""**jilo.ai 日报 - {today}**

**流量（昨日）**
  PV: {stats.get('pv', 'N/A')}{pv_change}  UV: {stats.get('uv', 'N/A')}

**今日新增内容**
  新闻: {stats['news_saved']} | 工具: {stats['tools_saved']} | SEO文章: {stats['seo_articles']} | 对比文章: {stats['compare_articles']}

**今日变现**
  出站点击: {stats['outbound_clicks']} | 联盟点击: {stats['affiliate_clicks']} | 已挂联盟工具: {stats.get('affiliate_tools', 0)}

**待优化页面**
{pages_text}

**有点击但无联盟链接的工具**
{tools_text}

**今日 3 件事**
{tasks_text}

**热门关键词**{kw_date_label}
{kw_text}

**策略动作**
{action_text}

**错误**
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
        f"jilo.ai 日报 - {today}",
        content,
        color="blue"
    )

    status = "success" if success else "error"
    log_operation("daily_report", status, f"Report sent: {success}")
    print(f"Daily report sent: {success}")


if __name__ == "__main__":
    send_daily_report()

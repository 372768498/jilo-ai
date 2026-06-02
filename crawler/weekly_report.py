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
    outbound_logs = [
        log for log in (content_logs.data or [])
        if log.get('job_name') == 'outbound_click'
    ]
    affiliate_clicks = sum(
        1 for log in outbound_logs
        if (log.get('details') or {}).get('has_affiliate')
    )
    tools = supabase.table('tools').select(
        'id, affiliate_url'
    ).eq('status', 'published').execute()
    affiliate_tools = sum(1 for t in (tools.data or []) if t.get('affiliate_url'))

    # Strategy actions this week
    actions = supabase.table('strategy_reports').select(
        'actions_taken'
    ).gte('report_date', week_ago).execute()

    # Content produced this week (from ops_logs success rows)
    produced = {'news': 0, 'tools': 0, 'seo': 0, 'compare': 0}
    for log in (content_logs.data or []):
        j = log.get('job_name')
        d = log.get('details') or {}
        if j == 'news_crawler':
            produced['news'] += d.get('saved', 0)
        elif j == 'tool_discovery':
            produced['tools'] += d.get('saved', 0)
        elif j == 'seo_articles':
            produced['seo'] += d.get('saved', 0)
        elif j == 'compare_articles':
            produced['compare'] += d.get('saved', 0)

    # Agent self-driving activity this week (from action_queue + lookback)
    week_start = f'{week_ago}T00:00:00Z'
    try:
        queue = (supabase.table('action_queue').select(
            'action_type, status, payload, dedup_key, created_at, completed_at'
        ).execute().data) or []
    except Exception as e:
        print(f"action_queue unavailable: {e}")
        queue = []

    agent = {
        'trend_enqueued': sum(
            1 for r in queue
            if r['action_type'] == 'generate_seo_content'
            and (r.get('payload') or {}).get('source') in ('trend', 'trend_fallback')
            and (r.get('created_at') or '') >= week_start
        ),
        'rewrites_done': sum(
            1 for r in queue
            if (r.get('dedup_key') or '').startswith('rewrite:')
            and r['status'] == 'done'
            and (r.get('completed_at') or '') >= week_start
        ),
        'monetization_resolved': sum(
            1 for r in queue
            if r['action_type'] == 'flag_for_review'
            and (r.get('payload') or {}).get('subtype') == 'monetization_gap'
            and r['status'] == 'done'
            and (r.get('completed_at') or '') >= week_start
        ),
        'monetization_open': sum(
            1 for r in queue
            if r['action_type'] == 'flag_for_review'
            and (r.get('payload') or {}).get('subtype') == 'monetization_gap'
            and r['status'] == 'pending'
        ),
    }
    try:
        lb = supabase.table('page_performance_lookback').select('id').gte(
            'captured_at', week_start
        ).execute()
        agent['lookback_snapshots'] = len(lb.data or [])
    except Exception:
        agent['lookback_snapshots'] = 0

    return {
        'total_pv': total_pv,
        'total_uv': total_uv,
        'top_pages': top_pages,
        'top_queries': top_queries,
        'content_logs': content_logs.data or [],
        'produced': produced,
        'agent': agent,
        'outbound_clicks': len(outbound_logs),
        'affiliate_clicks': affiliate_clicks,
        'affiliate_tools': affiliate_tools,
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

    prompt = f"""分析 jilo.ai（一个 AI 工具发现平台）本周数据，并给出策略建议。

本周流量：PV {weekly_data['total_pv']}，UV {weekly_data['total_uv']}
变现：出站点击 {weekly_data.get('outbound_clicks', 0)}，联盟点击 {weekly_data.get('affiliate_clicks', 0)}，已挂联盟的工具 {weekly_data.get('affiliate_tools', 0)} 个

按浏览量排名的页面：
{top_pages_text}

按曝光量排名的搜索词：
{top_queries_text}

基于这些数据，请输出以下四节（必须用简体中文，markdown 二级标题）：
1. **表现总结**（3–4 句）
2. **内容建议**（3–5 条具体可执行项）
3. **关键词机会**（下周值得攻的 3 个关键词，附理由）
4. **风险与警示**（数据里值得警惕的地方）

要具体、可执行，引用真实数据点。"""

    try:
        response = _get_openai_client().chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "你是一个 AI 工具发现平台的资深 SEO 与内容策略师，用简体中文输出数据驱动、可执行的建议。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=1500
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"GPT-4o strategy error: {e}")
        return f"AI 策略生成失败：{e}"


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

    # Build report sections
    p = weekly_data.get('produced', {})
    a = weekly_data.get('agent', {})

    top_pages_lines = '\n'.join(
        f"  - {pg['page_path']}: {pg['pageviews']} PV" for pg in weekly_data['top_pages'][:5]
    ) or '  无'
    top_queries_lines = '\n'.join(
        f"  - \"{q['query']}\" 曝光 {q['impressions']} · 排名 {q['avg_position']:.0f}"
        for q in weekly_data['top_queries'][:5]
    ) or '  无'

    # Send to Feishu
    content = f"""**jilo.ai 周策略报告 - {today}**

**流量汇总**
  本周 PV: {weekly_data['total_pv']}  UV: {weekly_data['total_uv']}

**变现**
  出站点击: {weekly_data.get('outbound_clicks', 0)}  联盟点击: {weekly_data.get('affiliate_clicks', 0)}  已挂联盟工具: {weekly_data.get('affiliate_tools', 0)}

**内容产出（本周）**
  新闻: {p.get('news', 0)} | 工具: {p.get('tools', 0)} | SEO文章: {p.get('seo', 0)} | 对比文章: {p.get('compare', 0)}

**🤖 Agent 自驱动（本周战绩）**
  • 趋势探测入队: {a.get('trend_enqueued', 0)} 条热点
  • 排名差页重写: {a.get('rewrites_done', 0)} 个
  • 漏钱 flag 自动销: {a.get('monetization_resolved', 0)} 个（当前仍 {a.get('monetization_open', 0)} 个待你认领）
  • 页面表现快照: {a.get('lookback_snapshots', 0)} 个

**本周 Top 页面**
{top_pages_lines}

**本周 Top 搜索词**
{top_queries_lines}

---

{strategy_text}"""

    success = send_feishu_card(FEISHU_WEBHOOK_URL, f"周策略报告 - {today}", content, color="purple")
    status = "success" if success else "error"
    log_operation("weekly_report", status, f"Report sent: {success}")
    print(f"Weekly report sent: {success}")


if __name__ == "__main__":
    send_weekly_report()

# crawler/daily_report.py
import os
from datetime import datetime, timedelta, timezone
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_card
from ops_logger import log_operation
import affiliate_registry as ar


CN_TZ = timezone(timedelta(hours=8))

# rank8: the +20% target is the system's north star, so it must be visible in the
# one place a human reads daily. Reported as target/actual/gap, not a bare delta.
TARGET_GROWTH = float(os.getenv("PV_GROWTH_TARGET", "0.20"))
MISS_STREAK_ESCALATE = int(os.getenv("PV_MISS_STREAK_ESCALATE", "3"))


def display_date():
    return datetime.now(CN_TZ).strftime('%Y-%m-%d')


def pv_growth_status(pv, pv_prev, target_growth=TARGET_GROWTH):
    """Translate yesterday's PV vs the day before into a target/actual/gap line.
    `met` is None when there's no baseline to judge against."""
    target_pct = target_growth * 100
    if not pv_prev:
        return {'met': None, 'target_pct': target_pct, 'actual_pct': None,
                'line': f"目标 +{target_pct:.0f}% / 实际 N/A（无前日基线）"}
    actual = (pv - pv_prev) / pv_prev
    actual_pct = actual * 100
    met = actual >= target_growth
    if met:
        line = f"目标 +{target_pct:.0f}% / 实际 +{actual_pct:.0f}% ✅ 达标"
    else:
        target_pv = pv_prev * (1 + target_growth)
        gap_pct = (target_growth - actual) * 100
        gap_pv = max(int(round(target_pv - pv)), 0)
        line = f"目标 +{target_pct:.0f}% / 实际 {actual_pct:+.0f}% ❌ 缺口 {gap_pct:.0f}%（~{gap_pv} PV）"
    return {'met': met, 'target_pct': target_pct, 'actual_pct': actual_pct, 'line': line}


def count_consecutive_misses(daily_rows, target_growth=TARGET_GROWTH):
    """Streak of most-recent consecutive days whose PV growth missed target.
    Walks back from the latest day; stops at the first day that met target."""
    rows = sorted([r for r in daily_rows if r.get('date')], key=lambda r: r['date'])
    pvs = [r.get('total_pageviews') or 0 for r in rows]
    streak = 0
    for i in range(len(pvs) - 1, 0, -1):
        prev, cur = pvs[i - 1], pvs[i]
        if not prev:
            break
        if (cur - prev) / prev < target_growth:
            streak += 1
        else:
            break
    return streak


def unresolved_errors(logs):
    """Return only errors that have not been followed by a success for the same job today."""
    latest_by_job = {}
    for log in sorted(logs, key=lambda r: r.get('created_at') or ''):
        latest_by_job[log.get('job_name') or 'unknown'] = log

    errors = []
    for job_name, log in latest_by_job.items():
        if log.get('status') == 'error':
            errors.append(f"{job_name}: {log.get('message')}")
    return errors


def get_today_stats():
    """Get today's content + analytics stats."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    today = datetime.utcnow().strftime('%Y-%m-%d')
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')
    two_days_ago = (datetime.utcnow() - timedelta(days=2)).strftime('%Y-%m-%d')

    # Content stats from ops_logs
    logs = supabase.table('ops_logs').select('*').gte('created_at', f'{today}T00:00:00Z').execute()
    log_rows = logs.data or []
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
    for log in log_rows:
        details = log.get('details', {})
        if log['status'] == 'error':
            continue
        if log['job_name'] == 'news_crawler':
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
    stats['errors'] = unresolved_errors(log_rows)

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
        recent = supabase.table('analytics_site_daily').select(
            'date, total_pageviews'
        ).order('date', desc=True).limit(10).execute()
        stats['pv_recent_days'] = recent.data or []
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
        stats['pv_recent_days'] = []

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
                    'query, page, position, clicks, impressions'
                ).eq('date', check_date).lte('position', 30).order('impressions', desc=True).limit(20).execute()
                stats['pages_to_update'] = [
                    row for row in (opportunities.data or [])
                    if row.get('impressions', 0) > 0 and row.get('clicks', 0) == 0
                ][:5]
            except Exception as e:
                print(f"Unable to load page update opportunities: {e}")
            break

    # Revenue leaks the user can ACT on: published, clicked, no affiliate link,
    # and (critically) NOT a no_program tool. Without the registry filter the
    # report kept naming closed/nonexistent programs (Leonardo.AI closed,
    # Craiyon/DALL-E none) as the "biggest leak" — dead-end busywork. Enrich each
    # with the verified signup_url/commission so the task is directly actionable.
    clicked_tools = supabase.table('tools').select(
        'slug, name_en, click_count, affiliate_url'
    ).eq('status', 'published').order('click_count', desc=True).limit(25).execute()
    registry = ar.load_registry()
    no_program = ar.no_program_slugs(registry)
    leaks = []
    for t in (clicked_tools.data or []):
        if (t.get('click_count') or 0) <= 0 or t.get('affiliate_url'):
            continue
        if t['slug'] in no_program:
            continue
        prog = ar.program_for(t['slug'], registry) or {}
        t['signup_url'] = prog.get('signup_url')
        t['commission'] = prog.get('commission')
        t['network'] = prog.get('network')
        leaks.append(t)
        if len(leaks) >= 5:
            break
    stats['clicked_tools_without_affiliate'] = leaks

    # Strategy actions today
    strategy = supabase.table('strategy_reports').select('actions_taken').eq(
        'report_date', today
    ).eq('report_type', 'daily').execute()
    stats['strategy_actions'] = []
    for r in (strategy.data or []):
        stats['strategy_actions'].extend(r.get('actions_taken', []))

    # ==== Agent self-driving activity (queue + lookback) ====
    today_start = f'{today}T00:00:00Z'
    try:
        queue = (supabase.table('action_queue').select(
            'action_type, status, payload, dedup_key, created_at, completed_at'
        ).execute().data) or []
    except Exception as e:
        print(f"action_queue unavailable: {e}")
        queue = []

    stats['trend_enqueued_today'] = [
        r for r in queue
        if r['action_type'] == 'generate_seo_content'
        and (r.get('payload') or {}).get('source') in ('trend', 'trend_fallback')
        and (r.get('created_at') or '') >= today_start
    ]
    stats['rewrites_pending'] = sum(
        1 for r in queue
        if (r.get('dedup_key') or '').startswith('rewrite:')
        and r['status'] in ('pending', 'in_progress')
    )
    stats['rewrites_done_today'] = sum(
        1 for r in queue
        if (r.get('dedup_key') or '').startswith('rewrite:')
        and r['status'] == 'done'
        and (r.get('completed_at') or '') >= today_start
    )
    monetization_flags = [
        r for r in queue
        if r['action_type'] == 'flag_for_review'
        and (r.get('payload') or {}).get('subtype') == 'monetization_gap'
    ]
    stats['monetization_open'] = sum(1 for r in monetization_flags if r['status'] == 'pending')
    stats['monetization_resolved_today'] = sum(
        1 for r in monetization_flags
        if r['status'] == 'done'
        and (r.get('completed_at') or '') >= today_start
    )

    try:
        lb = supabase.table('page_performance_lookback').select('id').gte(
            'captured_at', today_start
        ).execute()
        stats['lookback_today'] = len(lb.data or [])
    except Exception as e:
        print(f"page_performance_lookback unavailable: {e}")
        stats['lookback_today'] = 0

    return stats


def format_daily_report(stats):
    today = display_date()

    # rank8: target/actual/gap against the +20% north star, plus a miss-streak note.
    status = pv_growth_status(stats.get('pv') or 0, stats.get('pv_prev') or 0)
    streak = count_consecutive_misses(stats.get('pv_recent_days', []))
    streak_note = f"\n  ⚠️ 已连续 {streak} 天未达标" if streak >= MISS_STREAK_ESCALATE else ""

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
            f"  - {page.get('page', '?')} | \"{page.get('query', '')}\" pos:{page.get('position', 0):.0f} imp:{page.get('impressions', 0)}"
        )
    pages_text = '\n'.join(page_lines) if page_lines else '  无'

    tool_lines = []
    for tool in stats.get('clicked_tools_without_affiliate', [])[:5]:
        line = f"  - {tool.get('name_en') or tool.get('slug')} ({tool.get('slug')}): {tool.get('click_count', 0)} 次点击"
        if tool.get('signup_url'):
            net = f" · {tool['network']}" if tool.get('network') else ""
            line += f" → 申请 {tool['signup_url']}{net}"
        tool_lines.append(line)
    tools_text = '\n'.join(tool_lines) if tool_lines else '  无'

    # ==== Owned tasks: every item explicitly assigned to 你 or an Agent ====
    candidates = []  # list of (owner, text), prioritized

    # Joel — highest revenue lever first, with the verified application entry so
    # it's one click from done (no_program tools already filtered upstream).
    if stats.get('clicked_tools_without_affiliate'):
        top = stats['clicked_tools_without_affiliate'][0]
        name = top.get('name_en') or top.get('slug')
        entry = ''
        if top.get('signup_url'):
            comm = f" · {top['commission']}" if top.get('commission') else ""
            entry = f" → 申请入口 {top['signup_url']}{comm}"
        candidates.append(('你', f"申请 {name} 联盟链接（{top.get('click_count', 0)} 次出站点击，最大漏钱口）{entry}"))

    # Joel — high-intent page needing manual content fix
    if stats.get('pages_to_update'):
        p = stats['pages_to_update'][0]
        candidates.append((
            '你',
            f"改 {p.get('page', '?')} 让 \"{p.get('query', '')}\" 真正吃下点击（曝光 {p.get('impressions', 0)} 但 0 点击）",
        ))

    # Agent — trend
    if stats.get('trend_enqueued_today'):
        candidates.append(('Agent · trend', f"今日已捕获 {len(stats['trend_enqueued_today'])} 个高优先级热点，SEO 生成器会自动消费"))
    else:
        candidates.append(('Agent · trend', "下次 00:45 / 08:45 / 16:45 UTC 扫 HN+Reddit 找新热点"))

    # Agent — strategy rewrites (only if there's work queued or done today)
    if stats.get('rewrites_pending', 0) > 0:
        candidates.append(('Agent · strategy', f"队列里 {stats['rewrites_pending']} 条排名差页待自动重写"))
    elif stats.get('rewrites_done_today', 0) > 0:
        candidates.append(('Agent · strategy', f"今日已自动重写 {stats['rewrites_done_today']} 个排名差页"))

    # Agent — monitor (only if it auto-resolved something today, shows the loop closing)
    if stats.get('monetization_resolved_today', 0) > 0:
        candidates.append(('Agent · monitor', f"今日自动销了 {stats['monetization_resolved_today']} 个漏钱 flag（你加好的联盟链接）"))

    # If no Joel task surfaced, give a fallback so 你 always has something to do
    if not any(o == '你' for o, _ in candidates):
        candidates.insert(0, ('你', "去 /admin/queue 挑一个漏钱工具申请联盟链接"))

    # Backfill with standing Agent activities so there are always 3 assigned items.
    standing = [
        ('Agent · strategy', "今晚 20:30 UTC 复审 GSC + lookback，自动决定新增/重写"),
        ('Agent · lookback', "页面到 1/3/7 天龄自动拍快照，喂回策略层"),
        ('Agent · monitor', f"持续监控 {stats.get('monetization_open', 0)} 个漏钱工具，你接一个它销一个"),
    ]
    for item in standing:
        if len(candidates) >= 3:
            break
        if item not in candidates:
            candidates.append(item)

    owned_tasks = candidates[:3]
    tasks_text = '\n'.join(
        f"{i + 1}. [{owner}] {text}" for i, (owner, text) in enumerate(owned_tasks)
    )

    # ==== Agent self-driving status block ====
    agent_lines = [
        f"  • 趋势探测: 今日入队 {len(stats.get('trend_enqueued_today', []))} 条热点动作",
        f"  • 监控/自愈: {stats.get('monetization_open', 0)} 个漏钱 flag 在 pending，今日自动销 {stats.get('monetization_resolved_today', 0)} 个",
        f"  • 排名重写: 待执行 {stats.get('rewrites_pending', 0)} 条，今日完成 {stats.get('rewrites_done_today', 0)} 条",
        f"  • 表现回看: 今日捕获 {stats.get('lookback_today', 0)} 个页面快照",
    ]
    agent_text = '\n'.join(agent_lines)

    errors_text = '\n'.join(f"  - {e}" for e in stats['errors']) if stats['errors'] else '  无'

    return f"""**jilo.ai 日报 - {today}**

**流量（昨日）**
  PV: {stats.get('pv', 'N/A')}  UV: {stats.get('uv', 'N/A')}
  {status['line']}{streak_note}

**今日新增内容**
  新闻: {stats['news_saved']} | 工具: {stats['tools_saved']} | SEO文章: {stats['seo_articles']} | 对比文章: {stats['compare_articles']} | 重写: {stats.get('rewrites_done_today', 0)}

**今日变现**
  出站点击: {stats['outbound_clicks']} | 联盟点击: {stats['affiliate_clicks']} | 已挂联盟工具: {stats.get('affiliate_tools', 0)}

**🤖 Agent 自驱动状态（今日）**
{agent_text}

**🧑 今日 3 件事（已指派）**
{tasks_text}

**待优化页面**
{pages_text}

**有点击但无联盟链接的工具**
{tools_text}

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
    today = display_date()

    # rank8: card color reflects whether we hit the +20% target — green met,
    # yellow missed, blue when there's no baseline to judge.
    pv_status = pv_growth_status(stats.get('pv') or 0, stats.get('pv_prev') or 0)
    streak = count_consecutive_misses(stats.get('pv_recent_days', []))
    color = {True: 'green', False: 'yellow', None: 'blue'}[pv_status['met']]

    success = send_feishu_card(
        FEISHU_WEBHOOK_URL,
        f"jilo.ai 日报 - {today}",
        content,
        color=color,
    )

    # rank8: a sustained miss is a business-result change — escalate as its own
    # card (one of the three notification classes that I6 permits).
    if streak >= MISS_STREAK_ESCALATE:
        send_feishu_card(
            FEISHU_WEBHOOK_URL,
            f"jilo.ai 业务结果变化：连续 {streak} 天未达 +{TARGET_GROWTH * 100:.0f}% PV 目标",
            (f"PV 增长已连续 {streak} 天低于目标。系统已自动加压（梯度预算随缺口放大、"
             f"低收益动作降级），但仍未追上。建议人工介入最高杠杆项：联盟变现缺口与高曝光零点击页。"),
            color='red',
        )

    status = "success" if success else "error"
    log_operation("daily_report", status, f"Report sent: {success}", {
        'pv_target_met': pv_status['met'],
        'miss_streak': streak,
    })
    print(f"Daily report sent: {success} (met={pv_status['met']} streak={streak})")


def pv_growth_status(pv, pv_prev, target_growth=TARGET_GROWTH):
    target_pct = target_growth * 100
    if not pv_prev:
        return {
            'met': None,
            'target_pct': target_pct,
            'actual_pct': None,
            'line': f"目标 +{target_pct:.0f}% / 实际 N/A（无前日基线）",
        }
    actual = (pv - pv_prev) / pv_prev
    actual_pct = actual * 100
    met = actual >= target_growth
    if met:
        line = f"目标 +{target_pct:.0f}% / 实际 +{actual_pct:.0f}%，达标"
    else:
        target_pv = pv_prev * (1 + target_growth)
        gap_pct = (target_growth - actual) * 100
        gap_pv = max(int(round(target_pv - pv)), 0)
        line = f"目标 +{target_pct:.0f}% / 实际 {actual_pct:+.0f}%，缺口 {gap_pct:.0f}%（约 {gap_pv} PV）"
    return {'met': met, 'target_pct': target_pct, 'actual_pct': actual_pct, 'line': line}


def format_daily_report(stats):
    today = display_date()
    status = pv_growth_status(stats.get('pv') or 0, stats.get('pv_prev') or 0)
    streak = count_consecutive_misses(stats.get('pv_recent_days', []))
    streak_note = f"\n  注意：已连续 {streak} 天未达标" if streak >= MISS_STREAK_ESCALATE else ""

    kw_lines = [
        f"  - \"{kw['query']}\" pos:{kw['position']:.0f} clicks:{kw['clicks']}"
        for kw in stats.get('top_keywords', [])[:5]
    ]
    kw_date_label = f"（数据日期: {stats.get('keywords_date', '?')}）" if stats.get('keywords_date') else ""
    kw_text = '\n'.join(kw_lines) if kw_lines else '  暂无数据（GSC 通常延迟 2-3 天）'

    action_lines = [
        f"  - [{a.get('priority', '?').upper()}] {a.get('reason', '')[:60]}"
        for a in stats.get('strategy_actions', [])[:5]
    ]
    action_text = '\n'.join(action_lines) if action_lines else '  今日无策略动作'

    page_lines = [
        f"  - {page.get('page', '?')} | \"{page.get('query', '')}\" pos:{page.get('position', 0):.0f} imp:{page.get('impressions', 0)}"
        for page in stats.get('pages_to_update', [])[:5]
    ]
    pages_text = '\n'.join(page_lines) if page_lines else '  无'

    tool_lines = []
    for tool in stats.get('clicked_tools_without_affiliate', [])[:5]:
        line = f"  - {tool.get('name_en') or tool.get('slug')} ({tool.get('slug')}): {tool.get('click_count', 0)} 次点击"
        if tool.get('signup_url'):
            net = f" · {tool['network']}" if tool.get('network') else ""
            line += f" -> 申请 {tool['signup_url']}{net}"
        tool_lines.append(line)
    tools_text = '\n'.join(tool_lines) if tool_lines else '  无'

    candidates = []
    if stats.get('clicked_tools_without_affiliate'):
        top = stats['clicked_tools_without_affiliate'][0]
        name = top.get('name_en') or top.get('slug')
        entry = ''
        if top.get('signup_url'):
            comm = f" · {top['commission']}" if top.get('commission') else ""
            entry = f" -> 申请入口 {top['signup_url']}{comm}"
        candidates.append(('你', f"申请 {name} 联盟链接（{top.get('click_count', 0)} 次出站点击，最大漏钱口）{entry}"))

    if stats.get('pages_to_update'):
        p = stats['pages_to_update'][0]
        candidates.append((
            '你',
            f"改 {p.get('page', '?')}，让 \"{p.get('query', '')}\" 真正吃下点击（曝光 {p.get('impressions', 0)}、0 点击）",
        ))

    if stats.get('trend_enqueued_today'):
        candidates.append(('Agent · trend', f"今日已捕获 {len(stats['trend_enqueued_today'])} 个高优先级热点，SEO 生成器会自动消费"))
    else:
        candidates.append(('Agent · trend', "下次 00:45 / 08:45 / 16:45 UTC 扫 HN+Reddit 找新热点"))

    if stats.get('rewrites_pending', 0) > 0:
        candidates.append(('Agent · strategy', f"队列里 {stats['rewrites_pending']} 条排名差页面待自动重写"))
    elif stats.get('rewrites_done_today', 0) > 0:
        candidates.append(('Agent · strategy', f"今日已自动重写 {stats['rewrites_done_today']} 个排名差页面"))

    if stats.get('monetization_resolved_today', 0) > 0:
        candidates.append(('Agent · monitor', f"今日自动销账 {stats['monetization_resolved_today']} 个漏钱 flag"))

    if not any(owner == '你' for owner, _ in candidates):
        candidates.insert(0, ('你', "去 /admin/queue 挑一个漏钱工具申请联盟链接"))

    standing = [
        ('Agent · strategy', "今晚 20:30 UTC 复盘 GSC + lookback，自动决定新增/重写"),
        ('Agent · lookback', "页面到 1/3/7 天龄自动拍快照，喂回策略层"),
        ('Agent · monitor', f"持续监控 {stats.get('monetization_open', 0)} 个漏钱工具，你接一个它销一个"),
    ]
    for item in standing:
        if len(candidates) >= 3:
            break
        if item not in candidates:
            candidates.append(item)

    tasks_text = '\n'.join(
        f"{i + 1}. [{owner}] {text}" for i, (owner, text) in enumerate(candidates[:3])
    )

    agent_text = '\n'.join([
        f"  - 趋势探测: 今日入队 {len(stats.get('trend_enqueued_today', []))} 条热点动作",
        f"  - 监控/自愈: {stats.get('monetization_open', 0)} 个漏钱 flag 在 pending，今日自动销 {stats.get('monetization_resolved_today', 0)} 个",
        f"  - 排名重写: 待执行 {stats.get('rewrites_pending', 0)} 条，今日完成 {stats.get('rewrites_done_today', 0)} 条",
        f"  - 表现回看: 今日捕获 {stats.get('lookback_today', 0)} 个页面快照",
    ])
    errors_text = '\n'.join(f"  - {e}" for e in stats['errors']) if stats['errors'] else '  无'

    return f"""**jilo.ai 日报 - {today}**

**流量（昨日）**
  PV: {stats.get('pv', 'N/A')}  UV: {stats.get('uv', 'N/A')}
  {status['line']}{streak_note}

**今日新增内容**
  新闻: {stats['news_saved']} | 工具: {stats['tools_saved']} | SEO文章: {stats['seo_articles']} | 对比文章: {stats['compare_articles']} | 重写: {stats.get('rewrites_done_today', 0)}

**今日变现**
  出站点击: {stats['outbound_clicks']} | 联盟点击: {stats['affiliate_clicks']} | 已挂联盟工具: {stats.get('affiliate_tools', 0)}

**Agent 自驱动状态（今日）**
{agent_text}

**今日 3 件事（已指派）**
{tasks_text}

**待优化页面**
{pages_text}

**有点击但无联盟链接的工具**
{tools_text}

**热门关键词**{kw_date_label}
{kw_text}

**策略动作**
{action_text}

**错误**
{errors_text}"""


def send_daily_report():
    if not FEISHU_WEBHOOK_URL:
        print("FEISHU_WEBHOOK_URL not configured, skipping report")
        return

    stats = get_today_stats()
    content = format_daily_report(stats)
    today = display_date()
    pv_status = pv_growth_status(stats.get('pv') or 0, stats.get('pv_prev') or 0)
    streak = count_consecutive_misses(stats.get('pv_recent_days', []))
    color = {True: 'green', False: 'yellow', None: 'blue'}[pv_status['met']]

    success = send_feishu_card(
        FEISHU_WEBHOOK_URL,
        f"jilo.ai 日报 - {today}",
        content,
        color=color,
    )

    if streak >= MISS_STREAK_ESCALATE:
        send_feishu_card(
            FEISHU_WEBHOOK_URL,
            f"jilo.ai 业务结果变化：连续 {streak} 天未达 +{TARGET_GROWTH * 100:.0f}% PV 目标",
            (
                f"PV 增长已连续 {streak} 天低于目标。系统已自动加压（斜率预算随缺口放大、"
                "低收益动作降级），但仍未追上。建议人工介入最高杠杆项：联盟变现缺口与高曝光零点击页。"
            ),
            color='red',
        )

    status = "success" if success else "error"
    log_operation("daily_report", status, f"Report sent: {success}", {
        'pv_target_met': pv_status['met'],
        'miss_streak': streak,
    })
    print(f"Daily report sent: {success} (met={pv_status['met']} streak={streak})")


if __name__ == "__main__":
    send_daily_report()

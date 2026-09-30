# crawler/daily_report.py
import os
from datetime import datetime, timedelta, timezone
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_card
from ops_logger import log_operation
import affiliate_registry as ar
from reporting_data import fetch_all, latest_job_logs, job_succeeded
from llm_client import safe_model_error


CN_TZ = timezone(timedelta(hours=8))

# rank8: the +20% target is the system's north star, so it must be visible in the
# one place a human reads daily. Reported as target/actual/gap, not a bare delta.
TARGET_GROWTH = float(os.getenv("PV_GROWTH_TARGET", "0.20"))
MISS_STREAK_ESCALATE = int(os.getenv("PV_MISS_STREAK_ESCALATE", "3"))


def display_date():
    return datetime.now(CN_TZ).strftime('%Y-%m-%d')


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


def smoothed_growth(daily_rows, window=7, target_growth=TARGET_GROWTH):
    """Week-over-week PV growth: mean(last `window` days) vs mean(prior `window`).

    At 60-140 PV/day, day-over-day swings are statistical noise that flip the
    +20% verdict constantly. Averaging two weeks of PV cancels that noise so the
    target/actual/gap line and the red-card escalation only react to a real,
    sustained shift. `met` is None when there isn't enough history (need 2 full
    windows) to judge against."""
    rows = sorted([r for r in daily_rows if r.get('date')], key=lambda r: r['date'])
    rows = rows[-2 * window:]
    complete = all(r.get('total_pageviews') is not None for r in rows)
    consecutive = all((datetime.fromisoformat(b['date']) - datetime.fromisoformat(a['date'])).days == 1
                      for a, b in zip(rows, rows[1:]))
    pvs = [r.get('total_pageviews') or 0 for r in rows]
    target_pct = target_growth * 100
    if len(pvs) < 2 * window or not complete or not consecutive:
        return {'met': None, 'target_pct': target_pct, 'actual_pct': None,
                'recent_mean': None, 'prior_mean': None,
                'line': f"目标 +{target_pct:.0f}% / 7日均值 N/A（需要连续完整 {2 * window} 天）"}
    recent = pvs[-window:]
    prior = pvs[-2 * window:-window]
    recent_mean = sum(recent) / window
    prior_mean = sum(prior) / window
    if not prior_mean:
        return {'met': None, 'target_pct': target_pct, 'actual_pct': None,
                'recent_mean': recent_mean, 'prior_mean': prior_mean,
                'line': f"目标 +{target_pct:.0f}% / 7日均值 N/A（无前周基线）"}
    actual = (recent_mean - prior_mean) / prior_mean
    actual_pct = actual * 100
    met = actual >= target_growth
    if met:
        line = (f"目标 +{target_pct:.0f}% / 7日均值 {actual_pct:+.0f}%，达标"
                f"（{prior_mean:.0f}→{recent_mean:.0f} PV/日）")
    else:
        gap_pct = (target_growth - actual) * 100
        line = (f"目标 +{target_pct:.0f}% / 7日均值 {actual_pct:+.0f}%，缺口 {gap_pct:.0f}%"
                f"（{prior_mean:.0f}→{recent_mean:.0f} PV/日）")
    return {'met': met, 'target_pct': target_pct, 'actual_pct': actual_pct,
            'recent_mean': recent_mean, 'prior_mean': prior_mean, 'line': line}


def unresolved_errors(logs):
    """Return only errors that have not been followed by a success for the same job, independent of the report day."""
    latest_by_job = {}
    for log in sorted(logs, key=lambda r: r.get('created_at') or ''):
        latest_by_job[log.get('job_name') or 'unknown'] = log

    errors = []
    for job_name, log in latest_by_job.items():
        if not job_succeeded(log):
            errors.append(f"{job_name}: {safe_model_error(log.get('message'))}")
    return errors


def get_today_stats():
    """Get today's content + analytics stats."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    now = datetime.utcnow()
    today = now.strftime('%Y-%m-%d')
    yesterday = (now - timedelta(days=1)).strftime('%Y-%m-%d')
    two_days_ago = (now - timedelta(days=2)).strftime('%Y-%m-%d')

    # Content stats from ops_logs
    # 完整 UTC 日口径，避免延迟调度跨零点后只统计几分钟。
    log_rows = fetch_all(supabase.table('ops_logs').select('*').neq('job_name', 'outbound_click')
                         .gte('created_at', f'{yesterday}T00:00:00Z')
                         .lt('created_at', f'{today}T00:00:00Z').order('id'))
    latest = latest_job_logs(supabase)
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
        # 部分失败批次的 saved 仍是真实产出。
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
    stats['errors'] = unresolved_errors(latest)
    stats['report_window'] = f'{yesterday} UTC'
    growth = next((r for r in latest if r['job_name'] == 'traffic_growth_agent'), {})
    stats['growth_execution'] = growth.get('details') or {}
    stats['growth_execution_at'] = growth.get('created_at')

    # Monetization aligns with the YESTERDAY PV/UV window, not today's partial day.
    # The today `logs` loop above only sees clicks since 00:00 UTC today, so pairing
    # it with yesterday's PV compared apples (today's clicks) to oranges (yesterday's
    # traffic). Re-count outbound/affiliate clicks over yesterday's full UTC day
    # [yesterday 00:00Z, today 00:00Z) so the 变现 block lines up with PV/UV.
    yest_logs = fetch_all(supabase.table('ops_logs').select('job_name, status, details').eq(
        'job_name', 'outbound_click'
    ).gte('created_at', f'{yesterday}T00:00:00Z').lt('created_at', f'{today}T00:00:00Z').order('id'))
    stats['outbound_clicks_yesterday'] = 0
    stats['affiliate_clicks_yesterday'] = 0
    for log in yest_logs:
        if log['status'] == 'error':
            continue
        stats['outbound_clicks_yesterday'] += 1
        if (log.get('details') or {}).get('has_affiliate'):
            stats['affiliate_clicks_yesterday'] += 1

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
            stats['pv'] = None
            stats['uv'] = None
        stats['pv_prev'] = site_prev.data[0]['total_pageviews'] if site_prev.data else None
        # 14 days = two 7-day windows so smoothed_growth() can compare
        # week-over-week instead of reacting to daily noise.
        recent = supabase.table('analytics_site_daily').select(
            'date, total_pageviews'
        ).order('date', desc=True).limit(14).execute()
        stats['pv_recent_days'] = recent.data or []
        stats['latest_ga_date'] = (recent.data or [{}])[0].get('date')
    except Exception:
        # 页面 UV 不可相加冒充全站 UV；查询失败也不代表真实零值。
        stats.update(pv=None, uv=None, pv_prev=None, pv_recent_days=[], latest_ga_date=None)
        stats['errors'].append('analytics_site_daily: 读取失败，流量不可用')

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
        if not ar.application_ready(prog):
            continue
        t['signup_url'] = prog.get('signup_url')
        t['commission'] = prog.get('commission')
        t['network'] = prog.get('network')
        leaks.append(t)
        if len(leaks) >= 5:
            break
    stats['clicked_tools_without_affiliate'] = leaks

    # Strategy actions today
    strategy = supabase.table('strategy_reports').select('actions_taken').eq(
        'report_date', yesterday
    ).eq('report_type', 'daily').execute()
    stats['strategy_actions'] = []
    for r in (strategy.data or []):
        stats['strategy_actions'].extend(r.get('actions_taken', []))

    # ==== Agent self-driving activity (queue + lookback) ====
    today_start = f'{yesterday}T00:00:00Z'
    window_end = f'{today}T00:00:00Z'
    stats['queue_available'] = True
    try:
        queue = fetch_all(supabase.table('action_queue').select(
            'action_type, status, payload, dedup_key, created_at, completed_at'
        ).order('id'))
    except Exception as e:
        stats['queue_available'] = False
        stats['errors'].append('队列读取失败：计数未知')
        queue = []

    stats['trend_enqueued_today'] = [
        r for r in queue
        if r['action_type'] == 'generate_seo_content'
        and (r.get('payload') or {}).get('source') in ('trend', 'trend_fallback')
        and today_start <= (r.get('created_at') or '') < window_end
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
        and today_start <= (r.get('completed_at') or '') < window_end
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
        and today_start <= (r.get('completed_at') or '') < window_end
    )

    try:
        lb = fetch_all(supabase.table('page_performance_lookback').select('id').gte(
            'captured_at', today_start
        ).lt('captured_at', window_end).order('id'))
        stats['lookback_today'] = len(lb)
    except Exception as e:
        stats['errors'].append('回看读取失败：快照计数未知')
        stats['lookback_today'] = None

    return stats


def pv_growth_status(pv, pv_prev, target_growth=TARGET_GROWTH):
    target_pct = target_growth * 100
    if pv is None or not pv_prev:
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


def growth_execution_text(stats):
    detail = stats.get('growth_execution') or {}
    if not detail:
        return '增长执行：暂无可验证的执行记录'
    budget = detail.get('budget') or {}
    opened = detail.get('opened', len(detail.get('actions') or []))
    return (f"最近增长执行（{stats.get('growth_execution_at') or '时间未知'}）：实际入队 {opened} 条；"
            f"预算 AEO={budget.get('aeo', '?')} SEO={budget.get('seo', '?')} "
            f"Compare={budget.get('compare', '?')} Rewrite={budget.get('rewrite', '?')}")


def format_daily_report(stats):
    today = display_date()
    # Base the target/actual/gap verdict on the SMOOTHED (week-over-week) metric so
    # the +20% line doesn't whipsaw on daily noise at 60-140 PV/day. Raw daily
    # PV/UV are still shown verbatim below.
    status = smoothed_growth(stats.get('pv_recent_days', []))
    streak_note = (
        "\n  注意：本次7日均值比较未达目标"
        if status['met'] is False else ""
    )

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
    action_text = '\n'.join(action_lines) if action_lines else '  统计日无策略动作'

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
        if top.get('signup_url'):
            candidates.append(('你', f"审核并申请 {name} 联盟链接（累计 {top.get('click_count', 0)} 次出站点击）{entry}"))

    if stats.get('pages_to_update'):
        p = stats['pages_to_update'][0]
        candidates.append((
            'Agent · strategy（待入队）',
            f"优化 {p.get('page', '?')}，让 \"{p.get('query', '')}\" 真正吃下点击（曝光 {p.get('impressions', 0)}、0 点击）",
        ))

    if stats.get('trend_enqueued_today'):
        candidates.append(('Agent · trend', f"统计日已捕获 {len(stats['trend_enqueued_today'])} 个高优先级热点，SEO 生成器会自动消费"))
    else:
        candidates.append(('Agent · trend', "下次 00:45 / 08:45 / 16:45 UTC 扫 HN+Reddit 找新热点"))

    if stats.get('rewrites_pending', 0) > 0:
        candidates.append(('Agent · strategy', f"队列里 {stats['rewrites_pending']} 条排名差页面待自动重写"))
    elif stats.get('rewrites_done_today', 0) > 0:
        candidates.append(('Agent · strategy', f"统计日已自动重写 {stats['rewrites_done_today']} 个排名差页面"))

    if stats.get('monetization_resolved_today', 0) > 0:
        candidates.append(('Agent · monitor', f"统计日自动销账 {stats['monetization_resolved_today']} 个漏钱 flag"))


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
        f"  - 趋势探测: 统计日入队 {len(stats.get('trend_enqueued_today', []))} 条热点动作",
        f"  - 监控/自愈: {stats.get('monetization_open', 0)} 个漏钱 flag 在 pending，统计日自动销 {stats.get('monetization_resolved_today', 0)} 个",
        f"  - 排名重写: 待执行 {stats.get('rewrites_pending', 0)} 条，统计日完成 {stats.get('rewrites_done_today', 0)} 条",
        f"  - 表现回看: 统计日捕获 {stats.get('lookback_today') if stats.get('lookback_today') is not None else '缺测'} 个页面快照",
    ])
    if stats.get('queue_available') is False:
        agent_text = '  队列读取失败：热点、重写及销账数量未知。'
    errors_text = '\n'.join(f"  - {e}" for e in stats['errors']) if stats['errors'] else '  无'

    pv_text = '缺测' if stats.get('pv') is None else stats['pv']
    uv_text = '缺测' if stats.get('uv') is None else stats['uv']
    window = stats.get('report_window', '昨日 UTC')
    data_date = stats.get('latest_ga_date') or '未知'
    return f"""**jilo.ai 日报 - {today}**

**流量（昨日；{window}）**
  PV: {pv_text}  UV: {uv_text}
  最近可用 GA 日期：{data_date}；缺测不等于零流量
  {status['line']}{streak_note}（周比较截至 {data_date}）
  {growth_execution_text(stats)}

**新增内容（{window}）**
  新闻: {stats['news_saved']} | 工具: {stats['tools_saved']} | SEO文章: {stats['seo_articles']} | 对比文章: {stats['compare_articles']} | 重写: {stats.get('rewrites_done_today', 0) if stats.get('queue_available') is not False else '未知'}

**变现（昨日；{window}；仅流量完整时可同窗口比较）**
  出站点击: {stats.get('outbound_clicks_yesterday', 0)} | 联盟点击: {stats.get('affiliate_clicks_yesterday', 0)} | 已挂联盟工具: {stats.get('affiliate_tools', 0)}

**Agent 自驱动状态（{window}）**
{agent_text}

**待办与执行状态（计划不等于已完成）**
{tasks_text}

**待优化页面**
{pages_text}

**有点击但无联盟链接的工具**
{tools_text}

**热门关键词**{kw_date_label}
{kw_text}

**策略动作**
{action_text}

**尚未恢复的任务错误（跨日保留）**
{errors_text}"""


def send_daily_report():
    if not FEISHU_WEBHOOK_URL:
        print("FEISHU_WEBHOOK_URL not configured, skipping report")
        return

    stats = get_today_stats()
    content = format_daily_report(stats)
    today = display_date()
    # Color + escalation track the SMOOTHED (week-over-week) verdict, so a single
    # noisy day can't flip the card red. green = smoothed met, yellow = smoothed
    # miss, blue = not enough history to judge.
    pv_status = smoothed_growth(stats.get('pv_recent_days', []))
    color = {True: 'green', False: 'yellow', None: 'blue'}[pv_status['met']]

    success = send_feishu_card(
        FEISHU_WEBHOOK_URL,
        f"jilo.ai 日报 - {today}",
        content,
        color=color,
    )

    status = "success" if success else "error"
    log_operation("daily_report", status, f"Report sent: {success}", {
        'pv_target_met': pv_status['met'],
        'smoothed_actual_pct': pv_status['actual_pct'],
    })
    if not success:
        raise RuntimeError("Daily report rejected by Feishu")
    print(f"Daily report sent: {success} (met={pv_status['met']})")


if __name__ == "__main__":
    send_daily_report()

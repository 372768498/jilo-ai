from collections import Counter
from datetime import datetime, timedelta

from supabase import create_client

import monitor_agent
import self_iteration_agent
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_card
from ops_logger import log_operation


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _latest_job_statuses(supabase):
    since = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    rows = supabase.table('ops_logs').select(
        'job_name, status, message, created_at'
    ).gte('created_at', since).order('created_at', desc=True).limit(500).execute()

    latest = {}
    for row in rows.data or []:
        job = row.get('job_name')
        if job and job not in latest:
            latest[job] = row
    return latest


def _queue_snapshot(supabase):
    rows = supabase.table('action_queue').select(
        'action_type, status, priority, payload, dedup_key, created_at'
    ).in_('status', ['pending', 'in_progress']).limit(500).execute()
    open_rows = rows.data or []
    counts = Counter((r.get('action_type'), r.get('status')) for r in open_rows)
    flag_subtypes = Counter(
        (r.get('payload') or {}).get('subtype') or 'manual_review'
        for r in open_rows
        if r.get('action_type') == 'flag_for_review'
    )
    top_monetization = []
    schema_flags = []
    for row in open_rows:
        payload = row.get('payload') or {}
        subtype = payload.get('subtype')
        if subtype == 'monetization_gap':
            top_monetization.append({
                'name': payload.get('name') or payload.get('slug') or 'unknown',
                'slug': payload.get('slug') or '',
                'click_count': payload.get('click_count') or 0,
                'priority': row.get('priority') or 'medium',
            })
        elif subtype == 'system_schema_missing':
            schema_flags.append({
                'table_name': payload.get('table_name') or 'unknown',
                'migration_script': payload.get('migration_script') or 'unknown',
            })
    top_monetization.sort(key=lambda x: x['click_count'], reverse=True)
    return {
        'counts': counts,
        'flag_subtypes': flag_subtypes,
        'top_monetization': top_monetization,
        'schema_flags': schema_flags,
    }


def _required_table_status(supabase):
    missing = []
    ok = []
    for table_name, migration_script in self_iteration_agent.REQUIRED_TABLES:
        try:
            supabase.table(table_name).select('*').limit(1).execute()
            ok.append(table_name)
        except Exception:
            missing.append({'table_name': table_name, 'migration_script': migration_script})
    return ok, missing


def evaluate_autonomy(supabase):
    self_results = self_iteration_agent.run()
    monitor_opened, monitor_resolved = monitor_agent.check_monetization_gaps(supabase)
    queue = _queue_snapshot(supabase)
    latest_jobs = _latest_job_statuses(supabase)
    _, missing_tables = _required_table_status(supabase)

    failed_jobs = [
        row for row in latest_jobs.values()
        if row.get('status') == 'error'
        and row.get('job_name') in self_iteration_agent.ACTIVE_OPS_JOBS
    ]

    seo_open = sum(
        count for (action_type, status), count in queue['counts'].items()
        if action_type == 'generate_seo_content' and status in ('pending', 'in_progress')
    )
    compare_open = sum(
        count for (action_type, status), count in queue['counts'].items()
        if action_type == 'generate_comparison' and status in ('pending', 'in_progress')
    )
    flag_open = sum(
        count for (action_type, status), count in queue['counts'].items()
        if action_type == 'flag_for_review' and status in ('pending', 'in_progress')
    )

    blockers = []
    if missing_tables:
        blockers.append('database_schema')
    if failed_jobs:
        blockers.append('active_job_failure')
    if seo_open > self_iteration_agent.BACKLOG_LIMITS['generate_seo_content']:
        blockers.append('seo_backlog')
    if compare_open > self_iteration_agent.BACKLOG_LIMITS['generate_comparison']:
        blockers.append('compare_backlog')
    if flag_open > self_iteration_agent.BACKLOG_LIMITS['flag_for_review']:
        blockers.append('review_backlog')

    if not blockers:
        verdict = 'healthy'
    elif blockers == ['database_schema']:
        verdict = 'degraded_manual_blocker'
    else:
        verdict = 'degraded_needs_attention'

    return {
        'verdict': verdict,
        'blockers': blockers,
        'self_results': self_results,
        'monitor': {'opened': monitor_opened, 'resolved': monitor_resolved},
        'queue': queue,
        'missing_tables': missing_tables,
        'failed_jobs': failed_jobs,
    }


def _format_counter(counter):
    if not counter:
        return '- 无'
    lines = []
    for key, count in sorted(counter.items(), key=lambda x: str(x[0])):
        lines.append(f'- {key}: {count}')
    return '\n'.join(lines)


def format_report(result):
    verdict_map = {
        'healthy': '健康：系统可以自驱动运行',
        'degraded_manual_blocker': '降级但可运行：有人工权限事项，其它增长闭环继续跑',
        'degraded_needs_attention': '降级：存在会影响闭环的问题',
    }
    lines = [
        f"**结论：** {verdict_map.get(result['verdict'], result['verdict'])}",
        f"**阻塞类型：** {', '.join(result['blockers']) if result['blockers'] else '无'}",
        '',
        '**自动处理结果**',
        f"- self-iteration: {result['self_results']}",
        f"- monitor: opened={result['monitor']['opened']} resolved={result['monitor']['resolved']}",
        '',
        '**队列状态**',
        _format_counter(result['queue']['counts']),
        '',
        '**人工事项**',
    ]

    if result['missing_tables']:
        lines.append('- 数据库 migration:')
        for item in result['missing_tables']:
            lines.append(f"  - 缺表 `{item['table_name']}`，执行 `{item['migration_script']}`")
    else:
        lines.append('- 数据库 migration: 无')

    monetization = result['queue']['top_monetization']
    if monetization:
        lines.append('- 联盟链接优先处理:')
        for item in monetization[:5]:
            lines.append(
                f"  - {item['name']} (`{item['slug']}`): {item['click_count']} 次出站点击，优先级 {item['priority']}"
            )
    else:
        lines.append('- 联盟链接: 无待处理')

    if result['failed_jobs']:
        lines.append('')
        lines.append('**仍未恢复的失败 job**')
        for job in result['failed_jobs'][:8]:
            lines.append(f"- {job.get('job_name')}: {job.get('message')}")

    lines.append('')
    lines.append('系统会继续自动消费 SEO/AEO/Compare 队列；人工项只通过飞书提醒，不再要求你在对话里补。')
    return '\n'.join(lines)


def run():
    supabase = get_supabase()
    result = evaluate_autonomy(supabase)
    if FEISHU_WEBHOOK_URL:
        color = 'green' if result['verdict'] == 'healthy' else 'yellow'
        send_feishu_card(
            FEISHU_WEBHOOK_URL,
            f"jilo.ai 自驱动总控检查 - {datetime.utcnow().strftime('%Y-%m-%d')}",
            format_report(result),
            color=color,
        )
    log_operation('autonomy_guardian_agent', 'success', result['verdict'], {
        'blockers': result['blockers'],
        'self_results': result['self_results'],
        'monitor': result['monitor'],
        'queue_counts': {str(k): v for k, v in result['queue']['counts'].items()},
        'missing_tables': result['missing_tables'],
        'failed_jobs': [
            {'job_name': j.get('job_name'), 'message': j.get('message')}
            for j in result['failed_jobs']
        ],
    })
    print(result)
    return result


if __name__ == '__main__':
    run()

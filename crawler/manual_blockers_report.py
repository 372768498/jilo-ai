from datetime import datetime, timedelta, timezone

from supabase import create_client

from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_card
from ops_logger import log_operation


CN_TZ = timezone(timedelta(hours=8))


def display_date():
    return datetime.now(CN_TZ).strftime('%Y-%m-%d')


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def load_manual_blockers():
    supabase = get_supabase()
    rows = supabase.table('action_queue').select(
        'action_type, status, priority, payload, reason, created_at'
    ).eq('action_type', 'flag_for_review').eq(
        'status', 'pending'
    ).order('created_at', desc=True).limit(200).execute()

    schema_flags = []
    monetization_flags = []
    for row in rows.data or []:
        payload = row.get('payload') or {}
        subtype = payload.get('subtype')
        if subtype == 'system_schema_missing':
            schema_flags.append({
                'table_name': payload.get('table_name') or 'unknown table',
                'migration_script': payload.get('migration_script') or 'unknown migration',
                'reason': row.get('reason') or payload.get('repair_hint') or '',
                'priority': row.get('priority') or 'high',
            })
        elif subtype == 'monetization_gap':
            monetization_flags.append({
                'name': payload.get('name') or payload.get('slug') or 'unknown tool',
                'slug': payload.get('slug') or '',
                'click_count': payload.get('click_count') or 0,
                'priority': row.get('priority') or 'medium',
            })

    monetization_flags.sort(key=lambda x: x['click_count'], reverse=True)
    return {
        'schema_flags': schema_flags,
        'monetization_flags': monetization_flags,
    }


def format_message(data):
    schema_flags = data.get('schema_flags') or []
    monetization_flags = data.get('monetization_flags') or []

    lines = [
        '**这两类事项需要人工处理，系统会继续自动跑其它增长闭环。**',
        '',
    ]

    if schema_flags:
        lines.append('**1. 数据库 migration**')
        for item in schema_flags[:5]:
            lines.append(
                f"- 缺表 `{item['table_name']}`：请在 Supabase SQL editor 执行 `{item['migration_script']}`"
            )
        lines.append('')
    else:
        lines.append('**1. 数据库 migration**')
        lines.append('- 当前没有待处理缺表。')
        lines.append('')

    if monetization_flags:
        lines.append('**2. 联盟链接申请/补充**')
        for item in monetization_flags[:10]:
            lines.append(
                f"- {item['name']} (`{item['slug']}`)：{item['click_count']} 次出站点击，优先级 {item['priority']}"
            )
        if len(monetization_flags) > 10:
            lines.append(f"- 其余 {len(monetization_flags) - 10} 个低优先级机会继续由系统排队监控。")
        lines.append('')
    else:
        lines.append('**2. 联盟链接申请/补充**')
        lines.append('- 当前没有待处理联盟缺口。')
        lines.append('')

    lines.append('系统会自动检测这些事项是否解决：表建好或 affiliate_url 补上后，对应 flag 会自动销账。')
    return '\n'.join(lines)


def send_manual_blockers_report():
    if not FEISHU_WEBHOOK_URL:
        print('FEISHU_WEBHOOK_URL not configured, skipping manual blockers report')
        return False

    data = load_manual_blockers()

    # rank11 (A11b / I6): don't send an empty "nothing to do" card every day —
    # only notify when there's an actual manual blocker. Mirrors the heartbeat's
    # success-suppression so the three notification classes stay signal-only.
    if not data.get('schema_flags') and not data.get('monetization_flags'):
        log_operation('manual_blockers_report', 'success', 'no manual blockers; report suppressed', {
            'schema_flags': 0, 'monetization_flags': 0, 'suppressed': True,
        })
        print('No manual blockers; report suppressed.')
        return False

    content = format_message(data)
    today = display_date()
    ok = send_feishu_card(
        FEISHU_WEBHOOK_URL,
        f'jilo.ai 人工阻塞项 - {today}',
        content,
        color='yellow',
    )
    log_operation('manual_blockers_report', 'success' if ok else 'error', f'Report sent: {ok}', {
        'schema_flags': len(data.get('schema_flags') or []),
        'monetization_flags': len(data.get('monetization_flags') or []),
    })
    print(f'Manual blockers report sent: {ok}')
    return ok


if __name__ == '__main__':
    send_manual_blockers_report()

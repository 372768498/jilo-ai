from datetime import datetime, timedelta, timezone

from supabase import create_client

from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_card
from ops_logger import log_operation
import affiliate_registry as ar
import monetization_kit as mk
import failure_chain
from reporting_data import fetch_all
from monitor_agent import is_valid_affiliate_url
from llm_client import safe_model_error


CN_TZ = timezone(timedelta(hours=8))

MANUAL_SYSTEM_SUBTYPES = {
    'system_env_missing',
    'system_env_invalid',
    'system_schema_missing',
    'system_external_access',
}


def display_date():
    return datetime.now(CN_TZ).strftime('%Y-%m-%d')


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def load_manual_blockers():
    supabase = get_supabase()
    rows = fetch_all(supabase.table('action_queue').select('*')
                     .eq('action_type', 'flag_for_review').in_('status', ['pending', 'in_progress']).order('id'))
    tools = {t['slug']: t for t in fetch_all(supabase.table('tools').select(
        'slug,name_en,status,click_count,affiliate_url,category,official_url').eq('status', 'published').order('id'))}
    research = []
    schema_flags = []
    monetization_flags = []
    system_flags = []
    for row in rows:
        payload = row.get('payload') or {}
        subtype = payload.get('subtype')
        classified = failure_chain.classify_failure(payload.get('job_name', ''), payload.get('message'), payload.get('details'))
        if classified['subtype'] in MANUAL_SYSTEM_SUBTYPES and subtype != 'system_schema_missing':
            subtype = classified['subtype']
            payload = dict(payload, summary=classified['summary'], repair_hint=classified['repair_hint'])
        if subtype == 'system_schema_missing':
            schema_flags.append({
                'table_name': payload.get('table_name') or 'unknown table',
                'migration_script': payload.get('migration_script') or 'unknown migration',
                'reason': row.get('reason') or payload.get('repair_hint') or '',
                'priority': row.get('priority') or 'high',
            })
        elif subtype in ('monetization_gap', 'monetization_research', 'affiliate_link_broken'):
            slug = payload.get('slug') or ''
            prog = ar.program_for(slug) or {}
            tool = tools.get(slug)
            if not tool or is_valid_affiliate_url(tool.get('affiliate_url')) or prog.get('status') == 'no_program':
                continue
            pack = mk.build_application_pack(tool)
            if not pack['application_ready'] and subtype != 'affiliate_link_broken':
                research.append({'slug': slug, 'click_count': tool.get('click_count', 0)})
                continue
            monetization_flags.append({
                'subtype': subtype,
                'name': tool.get('name_en') or slug,
                'slug': slug,
                'click_count': tool.get('click_count') or 0,
                'priority': row.get('priority') or 'medium',
                'roi': mk.roi_score(tool),
                'pack': pack,
                'signup_url': prog.get('signup_url') if pack['application_ready'] else None,
                'network': prog.get('network'),
                'commission': prog.get('commission'),
            })
        elif (subtype or '').startswith('system_') and subtype in MANUAL_SYSTEM_SUBTYPES:
            system_flags.append({
                'subtype': subtype or 'system_error',
                'job_name': payload.get('job_name') or payload.get('queue_action_type') or 'unknown job',
                'summary': payload.get('summary') or row.get('reason') or 'system failure needs review',
                'repair_hint': payload.get('repair_hint') or 'Inspect ops_logs/action_queue and rerun after fixing.',
                'message': safe_model_error(payload.get('message') or ''),
                'priority': row.get('priority') or 'medium',
                'created_at': row.get('created_at'),
            })

    monetization_flags.sort(key=lambda x: x.get('roi') or 0, reverse=True)
    system_flags.sort(key=lambda x: (x.get('priority') != 'high', x.get('created_at') or ''), reverse=False)
    return {
        'schema_flags': schema_flags,
        'monetization_flags': monetization_flags,
        'system_flags': system_flags,
        'research_pending': research,
    }


def format_message(data):
    schema_flags = data.get('schema_flags') or []
    monetization_flags = data.get('monetization_flags') or []
    system_flags = data.get('system_flags') or []

    lines = [
        '**以下仅列权限和已核实入口的商务事项；系统会继续自动跑其它增长闭环。**',
        '',
    ]

    lines.append('**1. 数据库 migration**')
    if schema_flags:
        for item in schema_flags[:5]:
            lines.append(
                f"- 缺表 `{item['table_name']}`：请在 Supabase SQL editor 执行 `{item['migration_script']}`"
            )
    else:
        lines.append('- 当前没有待处理缺表。')
    lines.append('')

    lines.append('**2. 系统失败责任链（需要权限处理）**')
    if system_flags:
        for item in system_flags[:10]:
            msg = f"；错误：{item['message'][:160]}" if item.get('message') else ''
            lines.append(
                f"- [{item['priority']}] {item['job_name']} / {item['subtype']}："
                f"{item['summary']}；处理：{item['repair_hint']}{msg}"
            )
        if len(system_flags) > 10:
            lines.append(f"- 其余 {len(system_flags) - 10} 个系统失败 flag 留在 action_queue 跟踪。")
    else:
        lines.append('- 当前没有已识别的人工权限阻塞；工程故障见总控报告。')
    lines.append('')

    lines.append('**3. 联盟链接申请/补充（按假设 EPC 估算排序，非实际佣金）**')
    if monetization_flags:
        for item in monetization_flags[:10]:
            roi = item.get('roi') or 0
            line = (
                f"- {item['name']} (`{item['slug']}`)：{item['click_count']} 次累计出站点击"
                f" · 估算排序值 ${roi}（非已损失收入） · {item['priority']}"
            )
            if item.get('signup_url'):
                net = f" · {item['network']}" if item.get('network') else ''
                line += f"\n  申请入口：{item['signup_url']}{net}"
            lines.append(line)
            if item.get('subtype') == 'affiliate_link_broken':
                lines.append('  待修正：现有链接不含可识别联盟标记，请从平台后台复制真实 tracking link。')
        if len(monetization_flags) > 10:
            lines.append(f"- 其余 {len(monetization_flags) - 10} 个低优先级机会继续由系统排队监控。")

        top = monetization_flags[0]
        pack = top.get('pack') or {}
        if pack and pack.get('application_ready'):
            lines.append('')
            lines.append(f"**最高优先：{pack.get('tool')}（申请草稿；资格与佣金需平台审核）**")
            lines.append(
                f"- 假设估算：{pack.get('outbound_clicks')} 点击 x "
                f"${pack.get('est_epc_usd')}/点击 ≈ **排序值 ${pack.get('est_revenue_at_risk_usd')}（非真实收入）**"
            )
            lines.append(f"- 我们的页面：{pack.get('our_page')}")
            if pack.get('official_url'):
                lines.append(f"- 工具官网：{pack.get('official_url')}")
            lines.append(f"- 去哪申请：{' / '.join(pack.get('where_to_apply') or [])}")
            lines.append(f"- 申请话术（可直接粘贴）：\n  > {pack.get('pitch')}")
            lines.append(f"- 申请通过后：{pack.get('next_step')}")
    else:
        lines.append('- 当前没有待处理联盟缺口。')
    lines.append('')

    if data.get('research_pending'):
        lines.append(f"另有 {len(data['research_pending'])} 个工具的申请入口/资格待系统核实，未指派人工申请。")
    lines.append('系统会自动销账：任务或源动作经验证恢复、表建好、或联盟链接配置缺口解决后关闭对应 flag；链接配置不代表佣金已产生。')
    return '\n'.join(lines)


def send_manual_blockers_report():
    if not FEISHU_WEBHOOK_URL:
        print('FEISHU_WEBHOOK_URL not configured, skipping manual blockers report')
        return False

    data = load_manual_blockers()
    if not data.get('schema_flags') and not data.get('system_flags') and not data.get('monetization_flags'):
        log_operation('manual_blockers_report', 'success', 'no manual blockers; report suppressed', {
            'schema_flags': 0,
            'system_flags': 0,
            'monetization_flags': 0,
            'suppressed': True,
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
        'system_flags': len(data.get('system_flags') or []),
        'monetization_flags': len(data.get('monetization_flags') or []),
    })
    print(f'Manual blockers report sent: {ok}')
    return ok


if __name__ == '__main__':
    send_manual_blockers_report()

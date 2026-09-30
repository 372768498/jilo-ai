# crawler/self_iteration_agent.py
#
# Self-iteration layer. It watches the operating system itself, closes loops
# that can be closed safely, and turns non-automatic fixes into persistent,
# deduplicated action_queue items.
from datetime import datetime, timedelta, timezone
import hashlib
import re

from supabase import create_client

import action_queue as aq
import failure_chain
from reporting_data import fetch_all, latest_job_logs, job_succeeded
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_alert
from ops_logger import log_operation


ERROR_LOOKBACK_HOURS = 48
BACKLOG_LIMITS = {
    'generate_seo_content': 32,
    'generate_comparison': 10,
    'flag_for_review': 80,
}

REPAIRABLE_SEO_FAILURE_TERMS = (
    'title_en ',
    'meta_description_en ',
    'meta_description_zh ',
    'missing/empty fields:',
    'generation returned None',
    'AEO generation returned None',
    'AEO rewrite returned None',
)

REQUIRED_TABLES = [
    ('analytics_site_daily', 'scripts/create-ops-tables.sql'),
    ('analytics_referrers_daily', 'scripts/create-ai-referrers.sql'),
    ('action_queue', 'scripts/create-action-queue.sql'),
    ('page_performance_lookback', 'scripts/create-page-lookback.sql'),
]

ACTIVE_OPS_JOBS = {
    'analytics_collector',
    'compare_articles',
    'daily_report',
    'indexnow_submitter',
    'lookback_agent',
    'monitor_agent',
    'rss_news_crawler',
    'news_crawler',
    'llm_health',
    'seo_articles',
    'strategy_engine',
    'tool_discovery',
    'traffic_growth_agent',
    'trend_agent',
    'weekly_report',
}


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _now():
    return datetime.utcnow().isoformat()


def _hash(text):
    return hashlib.md5((text or '').encode('utf-8')).hexdigest()[:10]


def _slug(text):
    s = re.sub(r'[^a-z0-9\s:-]', '', (text or '').lower())
    return re.sub(r'[\s:-]+', '-', s).strip('-')[:80] or 'unknown'


def classify_error(job_name, message, details=None):
    return failure_chain.classify_failure(job_name, message, details)


def open_system_error_flags(supabase):
    rows = [r for r in latest_job_logs(supabase) if not job_succeeded(r)]

    opened = 0
    seen = set()
    for row in rows:
        job = row.get('job_name') or 'unknown_job'
        if job not in ACTIVE_OPS_JOBS:
            continue
        msg = row.get('message') or ''
        info = classify_error(job, msg, row.get('details'))
        key_base = f"{job}:{info['subtype']}:{_hash(msg)}"
        if key_base in seen:
            continue
        seen.add(key_base)
        dedup_key = f"flag:system:{_slug(key_base)}"
        payload = {
            'subtype': info['subtype'],
            'job_name': job,
            'message': msg[:1000],
            'first_seen_in_window': row.get('created_at'),
            'summary': info['summary'],
            'repair_hint': info['repair_hint'],
        }
        if info.get('migration_script'):
            payload['migration_script'] = info['migration_script']
        if aq.enqueue(
            supabase,
            action_type='flag_for_review',
            payload=payload,
            reason=f"{info['summary']}: {info['repair_hint']}",
            priority=info['priority'],
            dedup_key=dedup_key,
        ):
            opened += 1
            print(f"  [SYSTEM FLAG {info['priority'].upper()}] {job}: {info['summary']}")
    return opened


def open_partial_failure_flags(supabase):
    since = (datetime.utcnow() - timedelta(hours=ERROR_LOOKBACK_HOURS)).isoformat()
    rows = supabase.table('ops_logs').select(
        'job_name, message, details, created_at'
    ).eq('status', 'success').gte('created_at', since).order(
        'created_at', desc=True
    ).limit(1000).execute()

    opened = 0
    for row in (rows.data or []):
        details = row.get('details') or {}
        failed = details.get('failed') if isinstance(details, dict) else None
        if not isinstance(failed, (int, float)) or failed <= 0:
            continue
        if failure_chain.enqueue_partial_failure(
            supabase,
            row.get('job_name') or 'unknown_job',
            row.get('message') or '',
            details,
        ):
            opened += 1
    if opened:
        print(f"  Opened {opened} partial failure review flag(s)")
    return opened


def resolve_recovered_system_flags(supabase):
    """Close system error flags once the same job has a later success log."""
    latest = {r['job_name']: r for r in latest_job_logs(supabase)}
    rows = fetch_all(supabase.table('action_queue').select('id,payload,created_at')
                     .eq('action_type', 'flag_for_review')
                     .in_('status', ['pending', 'in_progress']).order('id'))

    resolved = 0
    for row in rows:
        payload = row.get('payload') or {}
        subtype = payload.get('subtype') or ''
        job_name = payload.get('job_name')
        if subtype == 'system_action_failed':
            source_id = payload.get('source_action_id')
            source = supabase.table('action_queue').select('*').eq('id', source_id).limit(1).execute().data if source_id else []
            if source and source[0].get('status') == 'done':
                resolved += failure_chain.resolve_action_failure(supabase, source[0])
            elif source and (source[0].get('status') == 'failed' or (
                    source[0].get('status') == 'skipped' and
                    (source[0].get('result') or {}).get('resolved') == 'explicit repair replacement completed')):
                original = source[0]
                replacements = fetch_all(supabase.table('action_queue').select('*')
                                         .eq('dedup_key', original.get('dedup_key'))
                                         .eq('status', 'done').order('id'))
                replacement = next((r for r in replacements if
                    ((r.get('payload') or {}).get('source_repair') or {}).get('failed_action_id') == source_id
                    and (original.get('status') == 'failed' or
                         (original.get('result') or {}).get('replacement_action_id') == r['id'])), None)
                if replacement:
                    changed = supabase.table('action_queue').update({
                        'status': 'skipped', 'result': {'resolved': 'explicit repair replacement completed',
                                                       'replacement_action_id': replacement['id']},
                        'updated_at': _now(), 'completed_at': _now(),
                    }).eq('id', source_id).eq('status', original['status']).execute()
                    if changed.data:
                        supabase.table('action_queue').update({
                            'status': 'done', 'result': {'resolved': 'explicit repair replacement completed',
                                                       'replacement_action_id': replacement['id']},
                            'updated_at': _now(), 'completed_at': _now(),
                        }).eq('id', row['id']).in_('status', ['pending', 'in_progress']).execute()
                        resolved += 1
            continue
        if not subtype.startswith('system_') or not job_name:
            continue
        outcome = latest.get(job_name) or {}
        success_at = outcome.get('created_at') if job_succeeded(outcome) else None
        error_seen_at = payload.get('first_seen_in_window') or row.get('created_at') or ''
        if not success_at or _utc(success_at) <= _utc(error_seen_at):
            continue
        supabase.table('action_queue').update({
            'status': 'done',
            'result': {
                'resolved': 'job later succeeded',
                'job_name': job_name,
                'success_at': success_at,
            },
            'completed_at': _now(),
            'updated_at': _now(),
        }).eq('id', row['id']).execute()
        resolved += 1
    if resolved:
        print(f"  Resolved {resolved} recovered system error flag(s)")
    return resolved


def recover_stale_actions(supabase):
    recovered = aq.recover_stale_in_progress(supabase, older_than_minutes=120)
    if recovered:
        print(f"  Recovered {recovered} stale in_progress action(s)")
    return recovered


def open_backlog_flags(supabase):
    rows = supabase.table('action_queue').select(
        'action_type, status'
    ).in_('status', ['pending', 'in_progress']).execute()

    counts = {}
    for row in (rows.data or []):
        action_type = row.get('action_type')
        counts[action_type] = counts.get(action_type, 0) + 1

    opened = 0
    for action_type, limit in BACKLOG_LIMITS.items():
        count = counts.get(action_type, 0)
        dedup_key = f"flag:system:backlog:{action_type}"
        if count <= limit:
            opened += aq.resolve(
                supabase,
                dedup_key,
                {'resolved': 'backlog below limit', 'count': count, 'limit': limit},
            )
            continue
        if aq.enqueue(
            supabase,
            action_type='flag_for_review',
            payload={
                'subtype': 'system_backlog',
                'queue_action_type': action_type,
                'count': count,
                'limit': limit,
                'repair_hint': 'Increase consumer cadence or per-run limit.',
            },
            reason=f"{action_type} backlog is {count}, above limit {limit}; increase consumer throughput.",
            priority='medium',
            dedup_key=dedup_key,
        ):
            opened += 1
            print(f"  [BACKLOG] {action_type}: {count}>{limit}")
    return opened


def open_failed_action_flags(supabase):
    """Ensure terminal failed queue actions are not dead-end rows."""
    rows = supabase.table('action_queue').select(
        'id, action_type, priority, payload, dedup_key, error_reason, completed_at, updated_at'
    ).eq('status', 'failed').order('updated_at', desc=True).limit(200).execute()

    opened = 0
    for row in (rows.data or []):
        if failure_chain.enqueue_action_failure(
            supabase,
            row,
            row.get('error_reason') or 'action failed without error_reason',
        ):
            opened += 1
    if opened:
        print(f"  Opened {opened} failed action review flag(s)")
    return opened


def _utc(value):
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)


def requeue_repairable_seo_failures(supabase):
    """修复已验证后，每轮最多恢复 5 个原动作，每个只增加一轮重试额度。"""
    health = latest_job_logs(supabase, jobs=('llm_health',))
    if not health or not job_succeeded(health[0]):
        return 0
    if datetime.now(timezone.utc) - _utc(health[0]['created_at']) > timedelta(hours=6):
        return 0
    active = fetch_all(supabase.table('action_queue').select('id')
                       .eq('action_type', 'generate_seo_content')
                       .in_('status', ['pending', 'in_progress']).order('id'))
    allowance = max(0, min(5, 16 - len(active)))
    if not allowance:
        return 0
    rows = fetch_all(supabase.table('action_queue').select('*')
                     .eq('action_type', 'generate_seo_content').eq('status', 'failed')
                     .order('created_at').order('id'))
    requeued = 0
    for row in rows:
        if requeued >= allowance:
            break
        reason = row.get('error_reason') or ''
        kind = failure_chain.classify_failure('seo_articles', reason)['subtype']
        repairable = kind in ('system_env_invalid', 'system_env_missing', 'system_transient_network')
        repairable = repairable or any(term in reason for term in REPAIRABLE_SEO_FAILURE_TERMS)
        payload = dict(row.get('payload') or {})
        if not repairable or payload.get('source_repair') or not row.get('dedup_key'):
            continue
        competing = supabase.table('action_queue').select('id').eq('dedup_key', row['dedup_key']).in_(
            'status', ['pending', 'in_progress', 'done']).limit(1).execute().data
        if competing:
            continue
        payload['source_repair'] = {
            'version': '2026-09-30', 'failed_action_id': row['id'],
            'failed_reason': reason, 'previous_attempts': row.get('attempts') or 0,
            'previous_max_attempts': row.get('max_attempts') or 3,
            'health_verified_at': health[0]['created_at'], 'queued_at': _now(),
        }
        changed = supabase.table('action_queue').update({
            'status': 'pending', 'payload': payload,
            'max_attempts': (row.get('attempts') or 0) + 3,
            'picked_at': None, 'completed_at': None, 'updated_at': _now(),
        }).eq('id', row['id']).eq('status', 'failed').eq('updated_at', row.get('updated_at')).execute()
        requeued += bool(changed.data)
    return requeued


def open_schema_health_flags(supabase):
    opened = 0
    for table_name, migration_script in REQUIRED_TABLES:
        try:
            supabase.table(table_name).select('*').limit(1).execute()
            aq.resolve(
                supabase,
                f"flag:system:schema:{table_name}",
                {'resolved': 'required table exists', 'table': table_name},
            )
            continue
        except Exception as e:
            message = str(e)
        if aq.enqueue(
            supabase,
            action_type='flag_for_review',
            payload={
                'subtype': 'system_schema_missing',
                'table_name': table_name,
                'message': message[:1000],
                'migration_script': migration_script,
                'repair_hint': f'Run {migration_script} in Supabase SQL editor.',
            },
            reason=f'Required table {table_name} is missing or unavailable; run {migration_script}.',
            priority='high',
            dedup_key=f"flag:system:schema:{table_name}",
        ):
            opened += 1
            print(f"  [SCHEMA FLAG] {table_name}: {migration_script}")
    return opened


def write_learning_snapshot(supabase, results):
    today = datetime.utcnow().strftime('%Y-%m-%d')

    # rank3 (A3b): derive the lesson from real measured effectiveness instead of
    # the old hardcoded sentence (which was a dead string the audit flagged).
    import growth_state
    modes = (growth_state.get_mode_effectiveness(supabase).get('modes') or {})
    suppress = growth_state.get_suppress(supabase)
    ranked = sorted(modes.items(), key=lambda kv: (kv[1].get('avg_pv') or 0), reverse=True)
    if ranked:
        top_mode, top = ranked[0]
        lesson = (
            f"Top PV mode: {top_mode} ({top.get('avg_pv')} pv/page over "
            f"{top.get('samples')} pages). Suppressed: "
            f"{', '.join(suppress) if suppress else 'none'}."
        )
    else:
        lesson = "No per-mode PV signal yet — need more aged snapshots before reallocating budget."

    payload = {
        'ran_at': _now(),
        'results': results,
        'mode_effectiveness': modes,
        'suppress': suppress,
        'lesson': lesson,
    }
    existing = supabase.table('strategy_reports').select('id').eq(
        'report_date', today
    ).eq('report_type', 'daily').execute()
    if not existing.data:
        return
    report_id = existing.data[0]['id']
    current = supabase.table('strategy_reports').select('content').eq('id', report_id).limit(1).execute()
    content = ((current.data or [{}])[0].get('content') or {})
    content['self_iteration'] = payload
    supabase.table('strategy_reports').update({'content': content}).eq('id', report_id).execute()


def run():
    supabase = get_supabase()
    results = {}
    steps = [
        ('stale_recovered', recover_stale_actions),
        ('system_flags_opened', open_system_error_flags),
        ('partial_failure_flags_opened', open_partial_failure_flags),
        ('system_flags_resolved', resolve_recovered_system_flags),
        ('schema_flags_opened_or_resolved', open_schema_health_flags),
        ('backlog_flags_opened_or_resolved', open_backlog_flags),
        ('repairable_seo_requeued', requeue_repairable_seo_failures),
        ('failed_action_flags_opened', open_failed_action_flags),
    ]
    for name, fn in steps:
        try:
            results[name] = fn(supabase)
        except Exception as e:
            results[name] = {'error': str(e)}
            print(f"  [SELF-ITERATION STEP FAILED] {name}: {e}")

    try:
        write_learning_snapshot(supabase, results)
    except Exception as e:
        results['learning_snapshot'] = {'error': str(e)}
        print(f"  [SELF-ITERATION STEP FAILED] learning_snapshot: {e}")
    return results


if __name__ == "__main__":
    print("Starting self-iteration agent...")
    try:
        from llm_client import check_llm_health
        try:
            check_llm_health()
        except RuntimeError:
            pass  # 预检已记录权限阻塞；继续处理不依赖模型的自愈。
        result = run()
        print(f"Self-iteration result: {result}")
        log_operation("self_iteration_agent", "success", "self-iteration pass complete", result)
    except Exception as e:
        log_operation("self_iteration_agent", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "自迭代 Agent 出错", str(e), "error")
        raise

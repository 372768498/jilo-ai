# crawler/self_iteration_agent.py
#
# Self-iteration layer. It watches the operating system itself, closes loops
# that can be closed safely, and turns non-automatic fixes into persistent,
# deduplicated action_queue items.
from datetime import datetime, timedelta
import hashlib
import re

from supabase import create_client

import action_queue as aq
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_alert
from ops_logger import log_operation


ERROR_LOOKBACK_HOURS = 48
BACKLOG_LIMITS = {
    'generate_seo_content': 32,
    'generate_comparison': 10,
    'flag_for_review': 80,
}

ACTIVE_OPS_JOBS = {
    'analytics_collector',
    'compare_articles',
    'daily_report',
    'indexnow_submitter',
    'lookback_agent',
    'monitor_agent',
    'rss_news_crawler',
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


def classify_error(job_name, message):
    msg = message or ''
    if 'Could not find the table' in msg or 'PGRST205' in msg:
        return {
            'subtype': 'system_schema_missing',
            'priority': 'high',
            'summary': f'{job_name} references a missing database table',
            'repair_hint': 'Apply the relevant SQL migration under scripts/ and rerun the job.',
        }
    if 'OPENAI_API_KEY not configured' in msg:
        return {
            'subtype': 'system_env_missing',
            'priority': 'high',
            'summary': 'OPENAI_API_KEY is missing',
            'repair_hint': 'Add OPENAI_API_KEY to GitHub Actions secrets.',
        }
    if 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' in msg:
        return {
            'subtype': 'system_env_missing',
            'priority': 'high',
            'summary': 'GOOGLE_SERVICE_ACCOUNT_JSON is missing',
            'repair_hint': 'Add GOOGLE_SERVICE_ACCOUNT_JSON to GitHub Actions secrets, or disable analytics-dependent decisions.',
        }
    if '_ssl.c' in msg or 'SSL:' in msg or 'handshake operation timed out' in msg:
        return {
            'subtype': 'system_transient_network',
            'priority': 'medium',
            'summary': f'{job_name} hit a transient network/SSL failure',
            'repair_hint': 'Rerun automatically on the next schedule; only escalate if it remains unresolved after the next successful run window.',
        }
    if '403 Client Error' in msg and 'googleapis.com' in msg:
        return {
            'subtype': 'system_external_access',
            'priority': 'medium',
            'summary': 'Google API access is denied',
            'repair_hint': 'Check GSC/GA permissions for the service account.',
        }
    return {
        'subtype': 'system_error',
        'priority': 'medium',
        'summary': f'{job_name} is failing',
        'repair_hint': 'Inspect ops_logs and the GitHub Actions run output.',
    }


def open_system_error_flags(supabase):
    since = (datetime.utcnow() - timedelta(hours=ERROR_LOOKBACK_HOURS)).isoformat()
    rows = supabase.table('ops_logs').select(
        'job_name, message, created_at'
    ).eq('status', 'error').gte('created_at', since).order(
        'created_at', desc=True
    ).limit(50).execute()

    opened = 0
    seen = set()
    for row in (rows.data or []):
        job = row.get('job_name') or 'unknown_job'
        if job not in ACTIVE_OPS_JOBS:
            continue
        msg = row.get('message') or ''
        info = classify_error(job, msg)
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


def resolve_recovered_system_flags(supabase):
    """Close system error flags once the same job has a later success log."""
    since = (datetime.utcnow() - timedelta(hours=ERROR_LOOKBACK_HOURS)).isoformat()
    logs = supabase.table('ops_logs').select(
        'job_name, status, created_at'
    ).gte('created_at', since).order('created_at', desc=False).limit(200).execute()

    latest_success = {}
    for row in (logs.data or []):
        if row.get('status') == 'success':
            latest_success[row.get('job_name')] = row.get('created_at')

    rows = supabase.table('action_queue').select(
        'id, payload, created_at'
    ).eq('action_type', 'flag_for_review').in_(
        'status', ['pending', 'in_progress']
    ).execute()

    resolved = 0
    for row in (rows.data or []):
        payload = row.get('payload') or {}
        subtype = payload.get('subtype') or ''
        job_name = payload.get('job_name')
        if not subtype.startswith('system_') or not job_name:
            continue
        success_at = latest_success.get(job_name)
        if not success_at or success_at <= (row.get('created_at') or ''):
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


def write_learning_snapshot(supabase, results):
    today = datetime.utcnow().strftime('%Y-%m-%d')
    payload = {
        'ran_at': _now(),
        'results': results,
        'lesson': (
            'The system is self-iterating when it can recover stale work, '
            'surface recurring errors as durable queue items, and flag throughput gaps.'
        ),
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
        ('system_flags_resolved', resolve_recovered_system_flags),
        ('backlog_flags_opened_or_resolved', open_backlog_flags),
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
        result = run()
        print(f"Self-iteration result: {result}")
        log_operation("self_iteration_agent", "success", "self-iteration pass complete", result)
    except Exception as e:
        log_operation("self_iteration_agent", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "自迭代 Agent 出错", str(e), "error")
        raise

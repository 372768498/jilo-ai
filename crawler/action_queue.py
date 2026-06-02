"""
Action queue client — the bus between strategy_engine (producer)
and generators (consumers).

Lifecycle a generator follows:
    actions = pick_pending(supabase, 'generate_seo_content', limit=2)
    for action in actions:
        try:
            result = do_work(action['payload'])
            mark_done(supabase, action, result)
        except Exception as e:
            mark_failed(supabase, action, str(e))
"""
from datetime import datetime, timedelta

PRIORITY_SCORE = {'high': 0, 'medium': 1, 'low': 2}


def _now():
    return datetime.utcnow().isoformat()


def pick_pending(supabase, action_type, limit=2, batch_window=50):
    """
    Claim up to `limit` pending actions of the given type.
    Sorted by priority (high→low) then FIFO.

    The claim is race-safe: we only flip the row to in_progress if it is
    still pending, so two concurrent runs cannot double-pick.

    Increments `attempts` on each claim — so a row claimed three times
    that never completes ends with attempts=3 and stays failed.
    """
    rows = supabase.table('action_queue').select('*').eq(
        'action_type', action_type
    ).eq('status', 'pending').order(
        'created_at', desc=False
    ).limit(batch_window).execute()

    ordered = sorted(
        (rows.data or []),
        key=lambda r: (PRIORITY_SCORE.get(r['priority'], 9), r['created_at']),
    )

    claimed = []
    for row in ordered:
        if len(claimed) >= limit:
            break
        new_attempts = (row.get('attempts') or 0) + 1
        upd = supabase.table('action_queue').update({
            'status': 'in_progress',
            'picked_at': _now(),
            'attempts': new_attempts,
            'updated_at': _now(),
        }).eq('id', row['id']).eq('status', 'pending').execute()
        if upd.data:
            row['status'] = 'in_progress'
            row['attempts'] = new_attempts
            claimed.append(row)
    return claimed


def mark_done(supabase, action, result):
    """Finalize a claimed action with success result."""
    supabase.table('action_queue').update({
        'status': 'done',
        'result': result,
        'completed_at': _now(),
        'updated_at': _now(),
    }).eq('id', action['id']).execute()


def mark_failed(supabase, action, error_reason):
    """
    Finalize a claimed action with failure.
    If attempts < max_attempts, revert to pending so the next run retries.
    Otherwise mark failed permanently — strategy/monitor agents can flag it.
    """
    attempts = action.get('attempts') or 0
    max_attempts = action.get('max_attempts') or 3
    if attempts < max_attempts:
        supabase.table('action_queue').update({
            'status': 'pending',
            'error_reason': error_reason,
            'updated_at': _now(),
        }).eq('id', action['id']).execute()
    else:
        supabase.table('action_queue').update({
            'status': 'failed',
            'error_reason': error_reason,
            'completed_at': _now(),
            'updated_at': _now(),
        }).eq('id', action['id']).execute()


def mark_skipped(supabase, action, reason):
    """
    Terminal skip — for example duplicate content detected at quality gate.
    Differs from failed: skip is "don't retry, this was a soft no-op".
    """
    supabase.table('action_queue').update({
        'status': 'skipped',
        'error_reason': reason,
        'completed_at': _now(),
        'updated_at': _now(),
    }).eq('id', action['id']).execute()


def enqueue(supabase, action_type, payload, reason, priority, dedup_key, source_report_id=None):
    """
    Producer-side insert. Skips if an active (pending|in_progress) row already
    exists for the same dedup_key, so the same logical action is never queued
    twice while still open. Returns True if inserted, False if deduped.
    """
    existing = supabase.table('action_queue').select('id').eq(
        'dedup_key', dedup_key
    ).in_('status', ['pending', 'in_progress']).execute()
    if existing.data:
        return False
    supabase.table('action_queue').insert({
        'action_type': action_type,
        'payload': payload,
        'reason': reason,
        'priority': priority,
        'dedup_key': dedup_key,
        'source_report_id': source_report_id,
    }).execute()
    return True


def resolve(supabase, dedup_key, result):
    """
    Close any active rows for a dedup_key as done — used when the underlying
    problem that opened a flag has been fixed (self-healing). Returns count closed.
    """
    rows = supabase.table('action_queue').select('id').eq(
        'dedup_key', dedup_key
    ).in_('status', ['pending', 'in_progress']).execute()
    for row in (rows.data or []):
        supabase.table('action_queue').update({
            'status': 'done',
            'result': result,
            'completed_at': _now(),
            'updated_at': _now(),
        }).eq('id', row['id']).execute()
    return len(rows.data or [])


def recover_stale_in_progress(supabase, older_than_minutes=120):
    """
    Return stale in_progress actions to pending.

    GitHub Actions can time out or be cancelled after a row is claimed. Without
    this recovery pass, those rows stay in_progress forever and the queue stops
    being self-healing.
    """
    cutoff = (datetime.utcnow() - timedelta(minutes=older_than_minutes)).isoformat()
    rows = supabase.table('action_queue').select(
        'id, action_type, dedup_key, attempts'
    ).eq('status', 'in_progress').lt('picked_at', cutoff).execute()

    recovered = 0
    for row in (rows.data or []):
        supabase.table('action_queue').update({
            'status': 'pending',
            'error_reason': f"auto-recovered stale in_progress after {older_than_minutes}m",
            'updated_at': _now(),
        }).eq('id', row['id']).eq('status', 'in_progress').execute()
        recovered += 1
    return recovered

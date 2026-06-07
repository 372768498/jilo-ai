from datetime import datetime
import hashlib
import re

import action_queue as aq


def _now():
    return datetime.utcnow().isoformat()


def _hash(text):
    return hashlib.md5((text or "").encode("utf-8")).hexdigest()[:10]


def _slug(text):
    s = re.sub(r"[^a-z0-9\s:-]", "", (text or "").lower())
    return re.sub(r"[\s:-]+", "-", s).strip("-")[:80] or "unknown"


def classify_failure(job_name, message):
    msg = message or ""
    if "Could not find the table" in msg or "PGRST205" in msg:
        return {
            "subtype": "system_schema_missing",
            "priority": "high",
            "summary": f"{job_name} references a missing database table",
            "repair_hint": "Apply the relevant SQL migration under scripts/ and rerun the job.",
        }
    if "OPENAI_API_KEY not configured" in msg:
        return {
            "subtype": "system_env_missing",
            "priority": "high",
            "summary": "OPENAI_API_KEY is missing",
            "repair_hint": "Add OPENAI_API_KEY to GitHub Actions secrets.",
        }
    if "Incorrect API key provided" in msg or "invalid_api_key" in msg:
        return {
            "subtype": "system_env_invalid",
            "priority": "high",
            "summary": "OPENAI_API_KEY is invalid",
            "repair_hint": "Replace OPENAI_API_KEY in GitHub Actions secrets and local env, then rerun the generator.",
        }
    if "GOOGLE_SERVICE_ACCOUNT_JSON not configured" in msg:
        return {
            "subtype": "system_env_missing",
            "priority": "high",
            "summary": "GOOGLE_SERVICE_ACCOUNT_JSON is missing",
            "repair_hint": "Add GOOGLE_SERVICE_ACCOUNT_JSON to GitHub Actions secrets.",
        }
    if "_ssl.c" in msg or "SSL:" in msg or "handshake operation timed out" in msg:
        return {
            "subtype": "system_transient_network",
            "priority": "medium",
            "summary": f"{job_name} hit a transient network/SSL failure",
            "repair_hint": "Rerun automatically on the next schedule; escalate only if it remains unresolved.",
        }
    if "403 Client Error" in msg and "googleapis.com" in msg:
        return {
            "subtype": "system_external_access",
            "priority": "medium",
            "summary": "Google API access is denied",
            "repair_hint": "Check GSC/GA permissions for the service account.",
        }
    return {
        "subtype": "system_error",
        "priority": "medium",
        "summary": f"{job_name} is failing",
        "repair_hint": "Inspect ops_logs and the GitHub Actions run output.",
    }


def enqueue_ops_failure(supabase, job_name, message, details=None):
    """Put an ops error into action_queue immediately. Never raises."""
    try:
        info = classify_failure(job_name, message)
        key_base = f"{job_name}:{info['subtype']}:{_hash(message)}"
        payload = {
            "subtype": info["subtype"],
            "job_name": job_name,
            "message": (message or "")[:1000],
            "first_seen_in_window": _now(),
            "summary": info["summary"],
            "repair_hint": info["repair_hint"],
            "source": "ops_logger",
            "details": details or {},
        }
        return aq.enqueue(
            supabase,
            action_type="flag_for_review",
            payload=payload,
            reason=f"{info['summary']}: {info['repair_hint']}",
            priority=info["priority"],
            dedup_key=f"flag:system:{_slug(key_base)}",
        )
    except Exception as e:
        print(f"[FailureChain] Failed to enqueue ops failure: {e}")
        return False


def enqueue_partial_failure(supabase, job_name, message, details=None):
    """Put a successful job with failed subitems into the chain. Never raises."""
    try:
        failed_count = (details or {}).get("failed")
        key_base = f"{job_name}:partial:{_hash(str(details or message))}"
        payload = {
            "subtype": "system_partial_failure",
            "job_name": job_name,
            "message": (message or "")[:1000],
            "summary": f"{job_name} completed with failed subitems",
            "repair_hint": "Inspect job details and source item failures; failed subitems must be retried, skipped with reason, or fixed.",
            "source": "ops_logger",
            "failed_count": failed_count,
            "details": details or {},
            "first_seen_in_window": _now(),
        }
        return aq.enqueue(
            supabase,
            action_type="flag_for_review",
            payload=payload,
            reason=f"{job_name} completed with failed subitems: {message}",
            priority="medium",
            dedup_key=f"flag:system:{_slug(key_base)}",
        )
    except Exception as e:
        print(f"[FailureChain] Failed to enqueue partial failure: {e}")
        return False


def resolve_ops_failure(supabase, job_name):
    """Close active system flags for a job after a later success. Never raises."""
    try:
        rows = supabase.table("action_queue").select("id, payload").eq(
            "action_type", "flag_for_review"
        ).in_("status", ["pending", "in_progress"]).execute()
        closed = 0
        for row in rows.data or []:
            payload = row.get("payload") or {}
            if payload.get("job_name") != job_name:
                continue
            if not (payload.get("subtype") or "").startswith("system_"):
                continue
            supabase.table("action_queue").update({
                "status": "done",
                "result": {"resolved": "job later succeeded", "job_name": job_name},
                "completed_at": _now(),
                "updated_at": _now(),
            }).eq("id", row["id"]).execute()
            closed += 1
        return closed
    except Exception as e:
        print(f"[FailureChain] Failed to resolve ops failure: {e}")
        return 0


def action_failure_dedup_key(action):
    return f"flag:action_failed:{action.get('dedup_key') or action.get('id')}"


def enqueue_action_failure(supabase, action, error_reason):
    """Escalate a terminal action_queue failure into a review flag. Never raises."""
    try:
        action_type = action.get("action_type") or "unknown"
        payload = {
            "subtype": "system_action_failed",
            "job_name": action_type,
            "queue_action_type": action_type,
            "source_action_id": action.get("id"),
            "source_action_dedup_key": action.get("dedup_key"),
            "source_action_payload": action.get("payload") or {},
            "message": (error_reason or "")[:1000],
            "summary": f"{action_type} action failed permanently",
            "repair_hint": "Inspect the source action payload, generator validation, and retry policy.",
            "source": "action_queue.mark_failed",
        }
        return aq.enqueue(
            supabase,
            action_type="flag_for_review",
            payload=payload,
            reason=f"{action_type} action failed permanently: {error_reason}",
            priority=action.get("priority") or "medium",
            dedup_key=action_failure_dedup_key(action),
        )
    except Exception as e:
        print(f"[FailureChain] Failed to enqueue action failure: {e}")
        return False


def resolve_action_failure(supabase, action):
    try:
        return aq.resolve(
            supabase,
            action_failure_dedup_key(action),
            {
                "resolved": "source action later completed",
                "source_action_id": action.get("id"),
                "source_action_dedup_key": action.get("dedup_key"),
            },
        )
    except Exception as e:
        print(f"[FailureChain] Failed to resolve action failure: {e}")
        return 0

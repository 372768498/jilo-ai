"""Route GitHub Actions job failures into action_queue.

This runs from the ops-heartbeat job. It deliberately uses only the Python
standard library so the heartbeat can report failures even before project
dependencies are installed.
"""
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone


ACTIVE_STATUSES = ("pending", "in_progress")


def _now():
    return datetime.now(timezone.utc).isoformat()


def _hash(text):
    return hashlib.md5((text or "").encode("utf-8")).hexdigest()[:10]


def _slug(text):
    s = re.sub(r"[^a-z0-9\s:-]", "", (text or "").lower())
    return re.sub(r"[\s:-]+", "-", s).strip("-")[:80] or "unknown"


def _request(url, service_key, method="GET", payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode("utf-8", errors="ignore")
        return json.loads(body) if body else None


def _supabase_url(path):
    base = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    if not base:
        return None
    return f"{base}/rest/v1/{path}"


def _active_flag_exists(service_key, dedup_key):
    status_filter = ",".join(f'"{s}"' for s in ACTIVE_STATUSES)
    url = _supabase_url(
        "action_queue"
        f"?select=id&dedup_key=eq.{urllib.parse.quote(dedup_key)}"
        f"&status=in.({urllib.parse.quote(status_filter)})"
        "&limit=1"
    )
    if not url:
        return False
    rows = _request(url, service_key) or []
    return bool(rows)


def _insert_flag(service_key, payload):
    url = _supabase_url("action_queue")
    if not url:
        return False
    _request(url, service_key, method="POST", payload=payload)
    return True


def _resolve_job_flags(service_key, job_name, run_id):
    status_filter = ",".join(f'"{s}"' for s in ACTIVE_STATUSES)
    url = _supabase_url(
        "action_queue"
        "?select=id,payload"
        "&action_type=eq.flag_for_review"
        f"&status=in.({urllib.parse.quote(status_filter)})"
    )
    if not url:
        return 0
    rows = _request(url, service_key) or []
    closed = 0
    for row in rows:
        payload = row.get("payload") or {}
        if payload.get("job_name") != job_name:
            continue
        if payload.get("source") != "github_actions_heartbeat":
            continue
        patch_url = _supabase_url(f"action_queue?id=eq.{row['id']}")
        _request(
            patch_url,
            service_key,
            method="PATCH",
            payload={
                "status": "done",
                "result": {
                    "resolved": "github actions job later succeeded",
                    "job_name": job_name,
                    "run_id": run_id,
                },
                "completed_at": _now(),
                "updated_at": _now(),
            },
        )
        closed += 1
    return closed


def enqueue_failed_jobs(needs, service_key, run_context):
    opened = 0
    resolved = 0
    for job_name, data in sorted((needs or {}).items()):
        result = (data or {}).get("result") or "unknown"
        if result == "skipped":
            continue
        if result == "success":
            resolved += _resolve_job_flags(service_key, job_name, run_context.get("run_id"))
            continue

        message = (
            f"GitHub Actions job `{job_name}` ended with `{result}` in "
            f"{run_context.get('workflow')} run {run_context.get('run_id')}."
        )
        dedup_key = f"flag:github-actions:{_slug(job_name)}:{_hash(result)}"
        if _active_flag_exists(service_key, dedup_key):
            continue
        payload = {
            "action_type": "flag_for_review",
            "status": "pending",
            "priority": "high" if result == "failure" else "medium",
            "dedup_key": dedup_key,
            "reason": message,
            "payload": {
                "subtype": "system_github_actions_job_failed",
                "job_name": job_name,
                "message": message,
                "summary": f"GitHub Actions job {job_name} failed before or outside ops_logs",
                "repair_hint": "Open the GitHub Actions run, inspect the failed job logs, fix the failing step, and rerun.",
                "source": "github_actions_heartbeat",
                "github_result": result,
                "workflow": run_context.get("workflow"),
                "run_id": run_context.get("run_id"),
                "run_attempt": run_context.get("run_attempt"),
                "run_url": run_context.get("run_url"),
                "event_name": run_context.get("event_name"),
                "schedule": run_context.get("schedule"),
                "dispatch_job": run_context.get("dispatch_job"),
                "created_by": "ops-heartbeat",
            },
        }
        if _insert_flag(service_key, payload):
            opened += 1
    return {"opened": opened, "resolved": resolved}


def main():
    service_key = os.getenv("SUPABASE_SERVICE_KEY")
    if not service_key or not _supabase_url("action_queue"):
        print("Supabase env missing; heartbeat responsibility-chain sync skipped")
        return 0

    needs = json.loads(os.getenv("NEEDS_JSON") or "{}")
    run_context = {
        "workflow": os.getenv("WORKFLOW"),
        "run_id": os.getenv("RUN_ID"),
        "run_attempt": os.getenv("RUN_ATTEMPT"),
        "run_url": os.getenv("RUN_URL"),
        "event_name": os.getenv("EVENT_NAME"),
        "schedule": os.getenv("EVENT_SCHEDULE"),
        "dispatch_job": os.getenv("DISPATCH_JOB"),
    }
    try:
        result = enqueue_failed_jobs(needs, service_key, run_context)
        print(f"Heartbeat responsibility-chain sync: {result}")
        return 0
    except (urllib.error.URLError, urllib.error.HTTPError, Exception) as e:
        print(f"Heartbeat responsibility-chain sync failed: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

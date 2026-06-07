# crawler/ops_logger.py
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY
import failure_chain


HIGH_VOLUME_SUCCESS_JOBS = {"outbound_click"}


def _has_failed_subitems(details):
    if not isinstance(details, dict):
        return False
    failed = details.get("failed")
    return isinstance(failed, (int, float)) and failed > 0


def log_operation(job_name: str, status: str, message: str, details: dict = None):
    """Log an operation result and route failures into the responsibility chain.

    This function is intentionally non-throwing: observability must never break
    the business job. If the error path cannot enqueue its review flag, it prints
    the secondary failure so the GitHub log still carries evidence.
    """
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase.table("ops_logs").insert({
            "job_name": job_name,
            "status": status,
            "message": message,
            "details": details or {},
        }).execute()
        if status == "error":
            failure_chain.enqueue_ops_failure(supabase, job_name, message, details)
        elif status == "success" and _has_failed_subitems(details):
            failure_chain.enqueue_partial_failure(supabase, job_name, message, details)
        elif status == "success" and job_name not in HIGH_VOLUME_SUCCESS_JOBS:
            failure_chain.resolve_ops_failure(supabase, job_name)
    except Exception as e:
        print(f"[OpsLogger] Failed to log: {e}")

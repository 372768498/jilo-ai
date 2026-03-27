# crawler/ops_logger.py
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY


def log_operation(job_name: str, status: str, message: str, details: dict = None):
    """Log an operation result to ops_logs table. Never raises."""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase.table("ops_logs").insert({
            "job_name": job_name,
            "status": status,
            "message": message,
            "details": details or {},
        }).execute()
    except Exception as e:
        print(f"[OpsLogger] Failed to log: {e}")

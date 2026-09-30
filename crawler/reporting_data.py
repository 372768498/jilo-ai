"""完整读取报表数据；任务状态不随报表日期归零。"""
from concurrent.futures import ThreadPoolExecutor

OPS_JOBS = (
    'analytics_collector', 'seo_articles', 'compare_articles', 'trend_agent',
    'news_crawler', 'rss_news_crawler', 'tool_discovery', 'lookback_agent',
    'monitor_agent', 'strategy_engine', 'traffic_growth_agent', 'self_iteration_agent',
    'autonomy_guardian_agent', 'daily_report', 'weekly_report', 'manual_blockers_report',
    'indexnow_submitter', 'llm_health',
)


def fetch_all(query, page_size=500):
    # 锁定 SDK 的 range(end) 不含 end；兼容含 end 版本时按实收条数推进。
    rows = []
    while True:
        page = query.range(len(rows), len(rows) + page_size).execute().data or []
        rows.extend(page)
        if len(page) < page_size:
            return rows


def latest_job_logs(supabase, jobs=OPS_JOBS):
    def read(job):
        offset = 0
        while True:
            rows = supabase.table('ops_logs').select(
                'job_name,status,message,details,created_at'
            ).eq('job_name', job).order('created_at', desc=True).range(offset, offset + 50).execute().data or []
            for row in rows:
                if ((row.get('details') or {}).get('reason') != 'queue_empty'
                        and not (row.get('status') == 'success' and (row.get('details') or {}).get('llm_checked') is False)):
                    return row
            if len(rows) < 50:
                return None
            offset += len(rows)
    with ThreadPoolExecutor(max_workers=6) as pool:
        return [row for row in pool.map(read, jobs) if row]


def job_succeeded(row):
    details = row.get('details') or {}
    return (row.get('status') == 'success' and not details.get('degraded')
            and not details.get('failed') and not details.get('llm_error')
            and details.get('reason') != 'queue_empty')

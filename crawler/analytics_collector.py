# crawler/analytics_collector.py
import json
from datetime import datetime, timedelta
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Metric, Dimension
)
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import requests as http_requests
from supabase import create_client
from config import (
    SUPABASE_URL, SUPABASE_KEY, GOOGLE_SERVICE_ACCOUNT_JSON,
    GA_PROPERTY_ID, GSC_SITE_URL, FEISHU_WEBHOOK_URL
)
from ops_logger import log_operation
from feishu_bot import send_feishu_alert


def get_google_credentials():
    """Get Google service account credentials from env JSON."""
    if not GOOGLE_SERVICE_ACCOUNT_JSON:
        raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON not configured")
    info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
    print(f"  JSON keys found: {list(info.keys())}")
    return service_account.Credentials.from_service_account_info(
        info,
        scopes=[
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/webmasters.readonly',
        ]
    )


def collect_ga_data():
    """Pull yesterday's GA4 data and store in Supabase."""
    credentials = get_google_credentials()
    ga_client = BetaAnalyticsDataClient(credentials=credentials)

    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')

    request = RunReportRequest(
        property=f"properties/{GA_PROPERTY_ID}",
        date_ranges=[DateRange(start_date=yesterday, end_date=yesterday)],
        dimensions=[
            Dimension(name="pagePath"),
            Dimension(name="sessionDefaultChannelGroup"),
        ],
        metrics=[
            Metric(name="screenPageViews"),
            Metric(name="totalUsers"),
            Metric(name="averageSessionDuration"),
            Metric(name="bounceRate"),
        ],
    )

    response = ga_client.run_report(request)
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    rows_saved = 0

    for row in response.rows:
        page_path = row.dimension_values[0].value
        traffic_source = row.dimension_values[1].value

        data = {
            'date': yesterday,
            'page_path': page_path,
            'pageviews': int(row.metric_values[0].value),
            'unique_pageviews': int(row.metric_values[1].value),
            'avg_session_duration': float(row.metric_values[2].value),
            'bounce_rate': float(row.metric_values[3].value),
            'traffic_source': traffic_source,
        }

        supabase.table('analytics_daily').upsert(
            data, on_conflict='date,page_path,traffic_source'
        ).execute()
        rows_saved += 1

    return rows_saved


def collect_gsc_data():
    """Pull last 3 days of GSC data and store in Supabase."""
    credentials = get_google_credentials()
    credentials.refresh(Request())
    token = credentials.token

    three_days_ago = (datetime.utcnow() - timedelta(days=3)).strftime('%Y-%m-%d')
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')

    url = f"https://www.googleapis.com/webmasters/v3/sites/{GSC_SITE_URL}/searchAnalytics/query"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "startDate": three_days_ago,
        "endDate": yesterday,
        "dimensions": ["query", "page", "date"],
        "rowLimit": 500,
    }

    resp = http_requests.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    rows_saved = 0

    for row in data.get('rows', []):
        keys = row['keys']
        record = {
            'query': keys[0],
            'page': keys[1],
            'date': keys[2],
            'clicks': row['clicks'],
            'impressions': row['impressions'],
            'ctr': round(row['ctr'], 4),
            'position': round(row['position'], 1),
        }

        supabase.table('search_console_daily').upsert(
            record, on_conflict='date,query,page'
        ).execute()
        rows_saved += 1

    return rows_saved


if __name__ == "__main__":
    print("Starting analytics data collection...")
    ga_rows = 0
    gsc_rows = 0
    try:
        if GA_PROPERTY_ID:
            print("Collecting GA4 data...")
            ga_rows = collect_ga_data()
            print(f"  GA4: {ga_rows} rows saved")

        if GSC_SITE_URL:
            print("Collecting GSC data...")
            gsc_rows = collect_gsc_data()
            print(f"  GSC: {gsc_rows} rows saved")

        log_operation("analytics_collector", "success", f"GA:{ga_rows}, GSC:{gsc_rows}", {
            "ga_rows": ga_rows, "gsc_rows": gsc_rows
        })
    except Exception as e:
        log_operation("analytics_collector", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "Analytics Collection Error", str(e), "error")
        raise

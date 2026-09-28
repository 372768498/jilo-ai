"""GA/GSC 日采集与有界补采；关键写入全部成功后才报告成功。"""
import argparse
import json
import os
from datetime import date, datetime, timedelta
from urllib.parse import quote
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric, Dimension, OrderBy
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import requests as http_requests
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, GOOGLE_SERVICE_ACCOUNT_JSON, GA_PROPERTY_ID, GSC_SITE_URL, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert

GA_PAGE_SIZE = 10000
GSC_PAGE_SIZE = 25000
MAX_BACKFILL_DAYS = 62
MAX_ROWS_PER_REPORT = 500000
AI_SOURCES = ('chatgpt', 'openai', 'perplexity', 'claude', 'anthropic', 'gemini', 'copilot', 'you.com', 'phind', 'poe')


def get_google_credentials():
    if not GOOGLE_SERVICE_ACCOUNT_JSON:
        raise ValueError('GOOGLE_SERVICE_ACCOUNT_JSON not configured')
    return service_account.Credentials.from_service_account_info(
        json.loads(GOOGLE_SERVICE_ACCOUNT_JSON), scopes=[
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/webmasters.readonly'])


def validate_window(start, end):
    if not start and not end:
        return None
    if not start or not end:
        raise ValueError('start-date and end-date must be supplied together')
    first, last = date.fromisoformat(start), date.fromisoformat(end)
    if first > last or (last - first).days >= MAX_BACKFILL_DAYS:
        raise ValueError(f'Backfill must cover 1..{MAX_BACKFILL_DAYS} days')
    if last >= datetime.utcnow().date():
        raise ValueError('Only complete past dates can be collected')
    return first, last


def dates_between(first, last):
    return [(first + timedelta(days=i)).isoformat() for i in range((last - first).days + 1)]


def _upsert(db, table, records, conflict):
    for offset in range(0, len(records), 500):
        db.table(table).upsert(records[offset:offset + 500], on_conflict=conflict).execute()


def _ga_rows(client, request):
    offset = 0
    while True:
        page_request = RunReportRequest(request)
        page_request.offset = offset
        page_request.limit = GA_PAGE_SIZE
        response = client.run_report(page_request, timeout=60)
        rows = list(response.rows)
        if not rows and offset < response.row_count:
            raise RuntimeError('GA returned an incomplete page')
        yield from rows
        offset += len(rows)
        if offset >= response.row_count:
            return
        if offset >= MAX_ROWS_PER_REPORT:
            raise RuntimeError('GA report exceeded safety limit; collection incomplete')


def collect_ga_data(target_date=None):
    target_date = target_date or (datetime.utcnow().date() - timedelta(days=1)).isoformat()
    validate_window(target_date, target_date)
    client = BetaAnalyticsDataClient(credentials=get_google_credentials())
    db = create_client(SUPABASE_URL, SUPABASE_KEY)

    def report(dimensions, metrics):
        return RunReportRequest(
            property=f'properties/{GA_PROPERTY_ID}',
            date_ranges=[DateRange(start_date=target_date, end_date=target_date)],
            dimensions=[Dimension(name=n) for n in dimensions],
            metrics=[Metric(name=n) for n in metrics],
            order_bys=[OrderBy(dimension=OrderBy.DimensionOrderBy(dimension_name=n)) for n in dimensions])

    pages = []
    for r in _ga_rows(client, report(['pagePath', 'sessionDefaultChannelGroup'],
                                    ['screenPageViews', 'totalUsers', 'averageSessionDuration', 'bounceRate'])):
        pages.append({'date': target_date, 'page_path': r.dimension_values[0].value,
                      'traffic_source': r.dimension_values[1].value,
                      'pageviews': int(r.metric_values[0].value), 'unique_pageviews': int(r.metric_values[1].value),
                      'avg_session_duration': float(r.metric_values[2].value), 'bounce_rate': float(r.metric_values[3].value)})
    _upsert(db, 'analytics_daily', pages, 'date,page_path,traffic_source')
    totals = list(_ga_rows(client, report([], ['screenPageViews', 'totalUsers', 'sessions'])))
    site = {'date': target_date, 'total_pageviews': 0, 'total_users': 0, 'total_sessions': 0}
    if totals:
        for field, value in zip(['total_pageviews', 'total_users', 'total_sessions'], totals[0].metric_values):
            site[field] = int(value.value)
    referrers = []
    for r in _ga_rows(client, report(['pagePath', 'sessionSourceMedium'], ['screenPageViews', 'sessions', 'totalUsers'])):
        source = r.dimension_values[1].value
        if any(n in source.lower() for n in AI_SOURCES):
            referrers.append({'date': target_date, 'page_path': r.dimension_values[0].value,
                              'source_medium': source, 'source_type': 'ai_answer_engine',
                              'pageviews': int(r.metric_values[0].value), 'sessions': int(r.metric_values[1].value),
                              'users': int(r.metric_values[2].value)})
    _upsert(db, 'analytics_referrers_daily', referrers, 'date,page_path,source_medium')
    # 全站日期最后落库，避免明细失败但下游认为当天已完成。
    db.table('analytics_site_daily').upsert(site, on_conflict='date').execute()
    return len(pages)


def collect_gsc_data(start_date=None, end_date=None):
    today = datetime.utcnow().date()
    window = validate_window(start_date, end_date) or (today - timedelta(days=3), today - timedelta(days=1))
    credentials = get_google_credentials()
    credentials.refresh(Request())
    headers = {'Authorization': f'Bearer {credentials.token}', 'Content-Type': 'application/json'}
    url = f'https://www.googleapis.com/webmasters/v3/sites/{quote(GSC_SITE_URL, safe="")}/searchAnalytics/query'
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0
    for day in dates_between(*window):
        offset = 0
        while True:
            response = http_requests.post(url, headers=headers, timeout=60, json={
                'startDate': day, 'endDate': day, 'dimensions': ['query', 'page', 'date'],
                'dataState': 'final', 'type': 'web', 'rowLimit': GSC_PAGE_SIZE, 'startRow': offset})
            response.raise_for_status()
            rows = response.json().get('rows', [])
            records = [{'query': r['keys'][0], 'page': r['keys'][1], 'date': r['keys'][2],
                        'clicks': r['clicks'], 'impressions': r['impressions'],
                        'ctr': round(r['ctr'], 4), 'position': round(r['position'], 1)} for r in rows]
            _upsert(db, 'search_console_daily', records, 'date,query,page')
            saved += len(records)
            offset += len(records)
            if len(rows) < GSC_PAGE_SIZE:
                break
            if offset >= MAX_ROWS_PER_REPORT:
                raise RuntimeError('GSC report exceeded safety limit; collection incomplete')
        # 最近三天 final 空结果可能仍在处理，不能冒充真实零流量。
        if offset > 0 or day <= (today - timedelta(days=3)).isoformat():
            db.table('growth_state').upsert({'key': 'gsc_collection:' + day,
                'value': {'date': day, 'rows': offset, 'data_state': 'final'},
                'updated_at': datetime.utcnow().isoformat()}, on_conflict='key').execute()
    return saved


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--start-date', default=os.getenv('ANALYTICS_START_DATE') or None)
    parser.add_argument('--end-date', default=os.getenv('ANALYTICS_END_DATE') or None)
    parser.add_argument('--require-window', action='store_true', help='Backfill jobs must specify both dates')
    args = parser.parse_args(argv)
    try:
        window = validate_window(args.start_date, args.end_date)
        if args.require_window and not window:
            raise ValueError('Backfill requires start-date and end-date')
        if not GA_PROPERTY_ID or not GSC_SITE_URL:
            raise ValueError('GA_PROPERTY_ID and GSC_SITE_URL must both be configured')
        get_google_credentials()
        yesterday = datetime.utcnow().date() - timedelta(days=1)
        ga_days = dates_between(*(window or (yesterday, yesterday)))
        ga_rows = sum(collect_ga_data(day) for day in ga_days)
        gsc_rows = collect_gsc_data(args.start_date, args.end_date)
        details = {'ga_rows': ga_rows, 'gsc_rows': gsc_rows, 'ga_dates': ga_days, 'backfill': bool(window)}
        if not log_operation('analytics_collector', 'success', f'GA:{ga_rows}, GSC:{gsc_rows}', details):
            return 1
        return 0
    except Exception as exc:
        log_operation('analytics_collector', 'error', str(exc))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, '数据采集出错', str(exc), 'error')
        return 1


if __name__ == '__main__':
    raise SystemExit(main())

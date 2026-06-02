# crawler/indexnow_submitter.py
#
# Submit recently published URLs to IndexNow so Bing and other participating
# engines discover new traffic pages quickly. Google still relies on sitemap
# and crawling, but this closes the fast-indexing path we can control.
import os
import time
from datetime import datetime, timedelta

import requests
from supabase import create_client

from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_alert
from ops_logger import log_operation


SITE_URL = os.getenv("NEXT_PUBLIC_SITE_URL") or os.getenv("SITE_URL") or "https://www.jilo.ai"
INDEXNOW_KEY = os.getenv("INDEXNOW_KEY") or "jilo-ai-indexnow-key"
LOOKBACK_HOURS = int(os.getenv("INDEXNOW_LOOKBACK_HOURS", "30"))


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _since():
    return (datetime.utcnow() - timedelta(hours=LOOKBACK_HOURS)).isoformat()


def _execute(label, query, retries=3):
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            return query.execute()
        except Exception as e:
            last_error = e
            print(f"  {label} query failed attempt {attempt}/{retries}: {e}")
            time.sleep(attempt * 2)
    raise last_error


def collect_urls(supabase):
    since = _since()
    urls = set()

    news = _execute(
        'news',
        supabase.table('news').select('slug').eq('status', 'published').gte('published_at', since).limit(100),
    )
    for row in news.data or []:
        slug = row.get('slug')
        if slug:
            urls.add(f"{SITE_URL}/en/news/{slug}")
            urls.add(f"{SITE_URL}/zh/news/{slug}")

    tools = _execute(
        'tools',
        supabase.table('tools').select('slug').eq('status', 'published').gte('created_at', since).limit(100),
    )
    for row in tools.data or []:
        slug = row.get('slug')
        if slug:
            urls.add(f"{SITE_URL}/en/tools/{slug}")
            urls.add(f"{SITE_URL}/zh/tools/{slug}")

    comparisons = _execute(
        'compare_articles',
        supabase.table('compare_articles').select('slug').eq('status', 'published').gte('created_at', since).limit(100),
    )
    for row in comparisons.data or []:
        slug = row.get('slug')
        if slug:
            clean_slug = slug.replace('-zh', '')
            urls.add(f"{SITE_URL}/en/compare/{clean_slug}")
            urls.add(f"{SITE_URL}/zh/compare/{clean_slug}")

    return sorted(urls)


def submit_indexnow(urls):
    if not urls:
        return {'submitted': 0, 'status_code': None}

    payload = {
        'host': SITE_URL.replace('https://', '').replace('http://', '').strip('/'),
        'key': INDEXNOW_KEY,
        'urlList': urls[:100],
    }
    last_error = None
    for attempt in range(1, 4):
        try:
            response = requests.post(
                'https://api.indexnow.org/indexnow',
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=20,
            )
            return {'submitted': len(payload['urlList']), 'status_code': response.status_code}
        except Exception as e:
            last_error = e
            print(f"  IndexNow submit failed attempt {attempt}/3: {e}")
            time.sleep(attempt * 2)
    raise last_error


if __name__ == "__main__":
    print("Starting IndexNow submitter...")
    try:
        supabase = get_supabase()
        urls = collect_urls(supabase)
        result = submit_indexnow(urls)
        result['collected'] = len(urls)
        print(result)
        log_operation("indexnow_submitter", "success", f"submitted={result['submitted']}", result)
    except Exception as e:
        log_operation("indexnow_submitter", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "IndexNow submitter error", str(e), "error")
        raise

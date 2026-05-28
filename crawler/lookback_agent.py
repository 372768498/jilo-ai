# crawler/lookback_agent.py
#
# Learning-feedback layer. When a generated page turns 7/14/28 days old,
# snapshot how it's actually performing into page_performance_lookback.
# Matches GSC/GA rows by slug substring, so it doesn't depend on the exact
# route structure. Captures the baseline as pages age — data that can't be
# reconstructed after the fact — so it runs from day one even at low traffic.
from collections import defaultdict
from datetime import datetime, timedelta
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert

# Content-type-aware cadence. GSC ranking data is inherently lagged (Google
# needs days to index + accumulate search impressions), so fast feedback can
# only come from GA pageviews — which is exactly what time-sensitive news
# needs. Evergreen content takes weeks to rank, so slow buckets fit it.
AGE_BUCKETS_BY_TYPE = {
    'seo_article': [1, 3, 7],    # news / hot topics — watch GA pageviews early
    'compare': [7, 14, 28],      # evergreen — watch GSC rankings over time
}
ALL_BUCKETS = sorted({b for buckets in AGE_BUCKETS_BY_TYPE.values() for b in buckets})


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _collect_pages(supabase):
    """All generated pages with a slug + publish date, tagged by content_type."""
    pages = []
    news = supabase.table('news').select(
        'slug, published_at'
    ).eq('news_type', 'seo_article').execute()
    for r in (news.data or []):
        if r.get('slug') and r.get('published_at'):
            pages.append({'content_type': 'seo_article', 'slug': r['slug'], 'published_at': r['published_at']})

    cmp = supabase.table('compare_articles').select(
        'slug, published_at'
    ).eq('locale', 'en').execute()
    for r in (cmp.data or []):
        if r.get('slug') and r.get('published_at'):
            pages.append({'content_type': 'compare', 'slug': r['slug'], 'published_at': r['published_at']})
    return pages


def _gsc_snapshot(supabase, slug):
    """Aggregate the most recent GSC rows whose page contains the slug."""
    rows = supabase.table('search_console_daily').select(
        'clicks, impressions, position, date'
    ).ilike('page', f'%/{slug}%').execute()
    data = rows.data or []
    if not data:
        return None
    # use the latest date available for this page
    latest = max(r['date'] for r in data)
    latest_rows = [r for r in data if r['date'] == latest]
    clicks = sum(r.get('clicks') or 0 for r in latest_rows)
    impressions = sum(r.get('impressions') or 0 for r in latest_rows)
    # impression-weighted average position
    wpos = sum((r.get('position') or 0) * (r.get('impressions') or 0) for r in latest_rows)
    position = (wpos / impressions) if impressions else None
    ctr = (clicks / impressions) if impressions else 0.0
    return {'clicks': clicks, 'impressions': impressions,
            'position': round(position, 1) if position is not None else None,
            'ctr': round(ctr, 4)}


def _ga_pageviews(supabase, slug):
    """Sum recent pageviews whose page_path contains the slug."""
    rows = supabase.table('analytics_daily').select(
        'pageviews, page_path, date'
    ).ilike('page_path', f'%/{slug}%').execute()
    data = rows.data or []
    if not data:
        return 0
    latest = max(r['date'] for r in data)
    return sum(r.get('pageviews') or 0 for r in data if r['date'] == latest)


def capture_due_snapshots(supabase):
    """For each page that hit an age bucket today, upsert a performance snapshot."""
    today = datetime.utcnow().date()
    pages = _collect_pages(supabase)
    captured = 0

    for page in pages:
        try:
            pub_date = datetime.fromisoformat(page['published_at'].replace('Z', '+00:00')).date()
        except Exception:
            continue
        age = (today - pub_date).days

        buckets = AGE_BUCKETS_BY_TYPE.get(page['content_type'], [7, 14, 28])
        if age not in buckets:
            continue

        slug = page['slug']
        gsc = _gsc_snapshot(supabase, slug)
        pv = _ga_pageviews(supabase, slug)

        snapshot = {
            'content_type': page['content_type'],
            'slug': slug,
            'published_at': page['published_at'],
            'age_bucket': age,
            'position': gsc['position'] if gsc else None,
            'ctr': gsc['ctr'] if gsc else 0.0,
            'clicks': gsc['clicks'] if gsc else 0,
            'impressions': gsc['impressions'] if gsc else 0,
            'pageviews': pv,
            'captured_at': datetime.utcnow().isoformat(),
        }
        supabase.table('page_performance_lookback').upsert(
            snapshot, on_conflict='content_type,slug,age_bucket'
        ).execute()
        captured += 1
        print(f"  [{age}d] {page['content_type']}/{slug}: "
              f"pos={snapshot['position']} clicks={snapshot['clicks']} pv={pv}")

    return captured


if __name__ == "__main__":
    print("Starting lookback agent...")
    try:
        supabase = get_supabase()
        captured = capture_due_snapshots(supabase)
        print(f"\n  Captured {captured} age-bucket snapshots")
        log_operation("lookback_agent", "success", f"captured {captured} snapshots",
                      {"captured": captured})
    except Exception as e:
        log_operation("lookback_agent", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "回看 Agent 出错", str(e), "error")
        raise

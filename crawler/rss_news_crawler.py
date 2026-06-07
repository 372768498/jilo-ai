# crawler/rss_news_crawler.py
import time
import hashlib
import re
from datetime import datetime
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, OPENAI_MODEL, RSS_SOURCES
from ops_logger import log_operation
from feishu_bot import send_feishu_alert
from config import FEISHU_WEBHOOK_URL
from llm_client import get_openai_client

def _get_openai_client():
    return get_openai_client()

CATEGORY_KEYWORDS = {
    'product_launch': ['launch', 'release', 'announce', 'introduce', 'unveil', 'ship', 'available', 'new feature'],
    'funding': ['raise', 'funding', 'series', 'invest', 'valuation', 'capital', 'million', 'billion', '$'],
    'tech_breakthrough': ['breakthrough', 'achieve', 'beat', 'record', 'state-of-the-art', 'benchmark', 'outperform'],
    'policy': ['regulation', 'policy', 'ban', 'law', 'govern', 'congress', 'senate', 'eu', 'compliance'],
    'research': ['paper', 'research', 'study', 'arxiv', 'findings', 'experiment', 'transformer', 'attention'],
}


def generate_slug(title):
    slug = title.lower()[:80]
    slug = ''.join(c if c.isalnum() or c in (' ', '-') else '' for c in slug)
    slug = slug.replace(' ', '-').strip('-')
    slug = re.sub(r'-+', '-', slug)
    return slug[:100]


def generate_content_hash(title, source_url):
    content = f"{title}{source_url}"
    return hashlib.md5(content.encode()).hexdigest()


def classify_news(title, summary):
    """Classify news into category tags based on keywords."""
    text = f"{title} {summary}".lower()
    tags = []
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            tags.append(category)
    return tags if tags else ['industry_news']


def parse_published_date(entry):
    for field in ['published_parsed', 'updated_parsed', 'created_parsed']:
        time_struct = getattr(entry, field, None)
        if time_struct:
            return datetime(*time_struct[:6]).isoformat()
    return datetime.now().isoformat()


def rewrite_and_translate(title, summary, source):
    """Rewrite news + translate to Chinese in a single API call."""
    try:
        client = _get_openai_client()
        prompt = f"""Rewrite this AI news in your own words. Make it engaging and SEO-friendly.

Original title: {title}
Original summary: {summary[:500]}
Source: {source}

Respond in this exact format (no extra text):
TITLE_EN: [rewritten English title, max 100 chars]
SUMMARY_EN: [rewritten English summary, 100-200 words]
TITLE_ZH: [Chinese translation of the new title]
SUMMARY_ZH: [Chinese translation of the new summary]"""

        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an AI news editor. Rewrite news to be original while keeping facts accurate. Translate naturally to Chinese, keeping brand names in English."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )

        content = response.choices[0].message.content
        result = {}
        for line in content.split('\n'):
            for key in ['TITLE_EN', 'SUMMARY_EN', 'TITLE_ZH', 'SUMMARY_ZH']:
                if line.startswith(f'{key}:'):
                    result[key.lower()] = line.split(':', 1)[1].strip()

        return (
            result.get('title_en', title),
            result.get('summary_en', summary[:200]),
            result.get('title_zh', ''),
            result.get('summary_zh', ''),
        )
    except Exception as e:
        print(f"  AI rewrite error: {e}")
        return title, summary[:200], '', ''


def crawl_rss_news():
    """Crawl and rewrite news from all RSS sources."""
    import feedparser

    print("Crawling RSS news sources...")
    news_list = []
    failed = 0

    for source, url in RSS_SOURCES.items():
        try:
            print(f"\nFetching from {source}...")
            feed = feedparser.parse(url)

            for entry in feed.entries[:3]:
                try:
                    published_at = parse_published_date(entry)
                    raw_summary = entry.get('summary', entry.get('description', ''))

                    print(f"  Rewriting: {entry.title[:50]}...")
                    title_en, summary_en, title_zh, summary_zh = rewrite_and_translate(
                        entry.title, raw_summary, source
                    )

                    category_tags = classify_news(entry.title, raw_summary)
                    content_hash = generate_content_hash(title_en, entry.link)

                    news_list.append({
                        'title_en': title_en,
                        'summary_en': summary_en,
                        'title_zh': title_zh,
                        'summary_zh': summary_zh,
                        'source': source,
                        'source_url': entry.link,
                        'news_type': 'industry_news',
                        'category_tags': category_tags,
                        'published_at': published_at,
                        'status': 'published',
                        'content_hash': content_hash,
                    })
                    print(f"  Done: {title_en[:50]}")
                    time.sleep(1)
                except Exception as e:
                    failed += 1
                    print(f"  Error processing entry: {e}")
                    continue
        except Exception as e:
            failed += 1
            print(f"Error fetching {source}: {e}")
            continue

    return news_list, failed


def save_news_to_db(news_list):
    """Save news to database, skip duplicates."""
    if not news_list:
        print("No news to save")
        return 0, 0, 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0
    skipped = 0
    failed = 0

    for news in news_list:
        try:
            existing = supabase.table('news').select('id').eq('content_hash', news['content_hash']).execute()
            if existing.data:
                skipped += 1
                continue

            news['slug'] = generate_slug(news['title_en'])
            result = supabase.table('news').insert(news).execute()
            if result.data:
                saved += 1
            time.sleep(0.5)
        except Exception as e:
            failed += 1
            print(f"  Error saving: {e}")
            continue

    print(f"\nSaved: {saved}, Skipped: {skipped}, Failed: {failed}, Total: {len(news_list)}")
    return saved, skipped, failed


if __name__ == "__main__":
    print("Starting RSS news crawler...")
    try:
        news, crawl_failed = crawl_rss_news()
        saved, skipped, save_failed = save_news_to_db(news)
        failed = crawl_failed + save_failed
        log_operation("news_crawler", "success", f"Saved {saved}, skipped {skipped}, failed {failed}", {
            "saved": saved, "skipped": skipped, "failed": failed, "total": len(news)
        })
    except Exception as e:
        log_operation("news_crawler", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "新闻抓取出错", str(e), "error")
        raise

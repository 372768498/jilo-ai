# crawler/seo_article_generator.py
import time
import re
import hashlib
from datetime import datetime, timedelta
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert

# Minimum GSC data threshold before auto-generating articles.
# Prevents publishing generic fallback content when the site is new.
MIN_GSC_IMPRESSIONS = 50
MIN_GSC_ROWS_TO_PROCEED = 3


def _get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    return OpenAI(api_key=OPENAI_API_KEY)


def get_target_keywords():
    """
    Get high-potential keywords from GSC data.
    Returns (keywords, used_fallback) tuple.
    used_fallback=True means no real GSC data was available.
    """
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    result = supabase.table('search_console_daily').select(
        'query, impressions, clicks, ctr, position'
    ).gte('date', week_ago).gte('impressions', MIN_GSC_IMPRESSIONS).lte(
        'ctr', 0.05
    ).order('impressions', desc=True).limit(10).execute()

    rows = result.data or []

    # Deduplicate queries across multiple dates
    seen = {}
    for row in rows:
        q = row['query']
        if q not in seen or row['impressions'] > seen[q]['impressions']:
            seen[q] = row
    unique_rows = list(seen.values())

    if len(unique_rows) >= MIN_GSC_ROWS_TO_PROCEED:
        return unique_rows[:2], False

    return [], True


def get_related_tools(keyword):
    """Find published tools in DB whose category matches keyword."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    category_map = {
        'writing': 'Writing', 'write': 'Writing', 'content': 'Writing',
        'coding': 'Coding', 'code': 'Coding', 'developer': 'Developer',
        'image': 'Image', 'design': 'Design', 'video': 'Video',
        'seo': 'Business', 'marketing': 'Business', 'business': 'Business',
        'chatbot': 'Chatbot', 'chat': 'Chatbot',
        'productivity': 'Productivity', 'audio': 'Audio',
    }
    kw_lower = keyword.lower()
    category = next((v for k, v in category_map.items() if k in kw_lower), None)

    if category:
        result = supabase.table('tools').select(
            'name_en, slug, category, pricing_type, affiliate_url'
        ).eq('status', 'published').eq('category', category).limit(15).execute()
        if result.data:
            return result.data

    result = supabase.table('tools').select(
        'name_en, slug, category, pricing_type, affiliate_url'
    ).eq('status', 'published').limit(15).execute()
    return result.data or []


def generate_seo_article(keyword_data):
    """
    Generate a long-form SEO article.
    Uses gpt-4o-mini (~$0.006/article) instead of gpt-4o (~$0.06/article).
    """
    keyword = keyword_data['query']
    related_tools = get_related_tools(keyword)

    tools_context = ""
    if related_tools:
        tool_lines = [
            f"- {t['name_en']} (/{t['slug']}, {t.get('pricing_type','freemium')}, affiliate: {t.get('affiliate_url', 'N/A')})"
            for t in related_tools
        ]
        tools_context = "\n\nTools from our directory to mention (use /slug for internal links, use affiliate_url when available):\n" + '\n'.join(tool_lines)

    prompt = f"""Write a comprehensive, SEO-optimized article about: "{keyword}"

Requirements:
- 5000-7000 words (detailed, in-depth content)
- H2 and H3 headings (markdown)
- Multiple comparison tables (features, pricing, use cases)
- Real-world examples and case studies
- Step-by-step tutorials where applicable
- FAQ section (5-8 questions) at the end
- Internal links to at least 10 tools from our directory
- Factual, practical, genuinely helpful — not generic filler
- Current year is 2026{tools_context}

Respond in this EXACT format:
TITLE_EN: [SEO title including "{keyword}", max 70 chars]
META_DESC_EN: [Meta description, 140-155 chars]
CONTENT_EN:
[full article in markdown]
---SEPARATOR---
TITLE_ZH: [Chinese title]
META_DESC_ZH: [Chinese meta description, 80-100 chars]
CONTENT_ZH:
[Chinese translation of full article in markdown]"""

    try:
        response = _get_openai_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert AI technology writer. Write in-depth, well-structured articles with genuine value. Use markdown. Never write generic filler."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.65,
            max_tokens=12000
        )

        raw = response.choices[0].message.content
        parts = raw.split('---SEPARATOR---')
        en_part = parts[0].strip()
        zh_part = parts[1].strip() if len(parts) > 1 else ''

        def extract_field(text, key):
            for line in text.split('\n'):
                if line.startswith(f'{key}:'):
                    return line.split(':', 1)[1].strip()
            return ''

        def extract_multiline(text, key):
            marker = f'{key}:\n'
            idx = text.find(marker)
            if idx == -1:
                return extract_field(text, key)
            return text[idx + len(marker):].strip()

        result = {
            'title_en': extract_field(en_part, 'TITLE_EN'),
            'meta_description_en': extract_field(en_part, 'META_DESC_EN'),
            'content_en': extract_multiline(en_part, 'CONTENT_EN'),
            'title_zh': extract_field(zh_part, 'TITLE_ZH'),
            'meta_description_zh': extract_field(zh_part, 'META_DESC_ZH'),
            'content_zh': extract_multiline(zh_part, 'CONTENT_ZH'),
            'target_keyword': keyword,
        }

        # Quality gate: reject suspiciously short content
        if len(result['content_en']) < 3000:
            print(f"  Quality gate FAIL: content too short ({len(result['content_en'])} chars)")
            return None

        return result

    except Exception as e:
        print(f"  GPT-4o-mini article generation error: {e}")
        return None


def save_article(article):
    """Save SEO article to news table. Returns True if saved."""
    if not article or not article.get('title_en') or not article.get('content_en'):
        return False

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    content_hash = hashlib.md5(
        f"{article['title_en']}{article['target_keyword']}".encode()
    ).hexdigest()
    existing = supabase.table('news').select('id').eq('content_hash', content_hash).execute()
    if existing.data:
        print(f"  Skip (duplicate): {article['title_en'][:60]}")
        return False

    slug = re.sub(r'[^a-z0-9\s-]', '', article['title_en'].lower())[:80]
    slug = re.sub(r'[\s-]+', '-', slug).strip('-')

    existing_slug = supabase.table('news').select('id').eq('slug', slug).execute()
    if existing_slug.data:
        slug = f"{slug}-{content_hash[:6]}"

    row = {
        'slug': slug,
        'title_en': article['title_en'],
        'title_zh': article['title_zh'],
        'summary_en': article['meta_description_en'],
        'summary_zh': article['meta_description_zh'],
        'content_en': article['content_en'],
        'content_zh': article['content_zh'],
        'source': 'jilo.ai SEO',
        'news_type': 'seo_article',
        'category_tags': ['seo_content'],
        'status': 'published',
        'content_hash': content_hash,
        'published_at': datetime.utcnow().isoformat(),
    }

    supabase.table('news').insert(row).execute()
    return True


if __name__ == "__main__":
    print("Starting SEO article generator...")
    try:
        keywords, used_fallback = get_target_keywords()

        if used_fallback:
            print(f"Insufficient GSC data (need >= {MIN_GSC_ROWS_TO_PROCEED} queries with {MIN_GSC_IMPRESSIONS}+ impressions). Skipping to avoid low-quality output.")
            log_operation("seo_articles", "success",
                          "Skipped: insufficient GSC data", {"saved": 0, "reason": "no_gsc_data"})
        else:
            saved = 0
            for kw in keywords:
                print(f"\nGenerating: {kw['query']} (impressions={kw.get('impressions',0)}, ctr={kw.get('ctr',0):.1%})")
                article = generate_seo_article(kw)
                if save_article(article):
                    saved += 1
                    print(f"  Saved: {article['title_en'][:60]}")
                time.sleep(2)

            log_operation("seo_articles", "success", f"Generated {saved} articles", {
                "saved": saved, "keywords": [k['query'] for k in keywords]
            })

    except Exception as e:
        log_operation("seo_articles", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "SEO Article Error", str(e), "error")
        raise

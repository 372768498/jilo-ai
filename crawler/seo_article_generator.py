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


def _get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    return OpenAI(api_key=OPENAI_API_KEY)


def get_target_keywords():
    """Get high-potential keywords from GSC data."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    # High impressions, low CTR = opportunity
    result = supabase.table('search_console_daily').select(
        'query, impressions, clicks, ctr, position'
    ).gte('date', week_ago).gte('impressions', 50).lte('ctr', 0.05).order(
        'impressions', desc=True
    ).limit(10).execute()

    if not result.data:
        # Fallback: use predefined seed keywords
        return [
            {"query": "best ai tools 2026", "impressions": 0, "position": 0},
            {"query": "ai writing assistant comparison", "impressions": 0, "position": 0},
        ]

    return result.data[:2]


def get_related_tools(keyword):
    """Find tools in our DB related to the keyword."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    words = keyword.split()[:3]
    search_term = ' '.join(words)

    result = supabase.table('tools').select(
        'name_en, slug, category, pricing_type'
    ).eq('status', 'published').ilike('name_en', f'%{search_term}%').limit(5).execute()

    return result.data or []


def generate_seo_article(keyword_data):
    """Generate a long-form SEO article using GPT-4o."""
    keyword = keyword_data['query']
    related_tools = get_related_tools(keyword)

    tools_context = ""
    if related_tools:
        tools_list = ', '.join(t['name_en'] for t in related_tools)
        tools_context = f"\nRelated tools from our database to mention and link: {tools_list}"

    prompt = f"""Write a comprehensive, SEO-optimized article about: "{keyword}"

Requirements:
- 1500-2000 words
- Use H2 and H3 headings (markdown format)
- Include a comparison table if relevant
- Include a FAQ section (3-5 questions) at the end
- Be factual, practical, and helpful
- Current year is 2026{tools_context}

Respond in this exact format:
TITLE_EN: [SEO-optimized title including "{keyword}"]
META_DESC_EN: [155 char meta description]
CONTENT_EN: [full article in markdown]
---SEPARATOR---
TITLE_ZH: [Chinese title]
META_DESC_ZH: [Chinese meta description]
CONTENT_ZH: [Chinese translation of full article]"""

    try:
        response = _get_openai_client().chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert AI technology writer. Write in-depth, well-structured articles that provide genuine value to readers. Use markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )

        content = response.choices[0].message.content
        parts = content.split('---SEPARATOR---')
        en_part = parts[0] if parts else content
        zh_part = parts[1] if len(parts) > 1 else ''

        def extract(text, key):
            for line in text.split('\n'):
                if line.startswith(f'{key}:'):
                    return line.split(':', 1)[1].strip()
            return ''

        def extract_content(text, key):
            lines = text.split('\n')
            collecting = False
            collected = []
            for line in lines:
                if line.startswith(f'{key}:'):
                    collected.append(line.split(':', 1)[1].strip())
                    collecting = True
                elif collecting and not any(line.startswith(f'{k}:') for k in ['TITLE_EN', 'META_DESC_EN', 'TITLE_ZH', 'META_DESC_ZH']):
                    collected.append(line)
                elif collecting:
                    break
            return '\n'.join(collected).strip()

        return {
            'title_en': extract(en_part, 'TITLE_EN'),
            'meta_description_en': extract(en_part, 'META_DESC_EN'),
            'content_en': extract_content(en_part, 'CONTENT_EN'),
            'title_zh': extract(zh_part, 'TITLE_ZH'),
            'meta_description_zh': extract(zh_part, 'META_DESC_ZH'),
            'content_zh': extract_content(zh_part, 'CONTENT_ZH'),
            'target_keyword': keyword,
        }
    except Exception as e:
        print(f"  GPT-4o article generation error: {e}")
        return None


def save_article(article):
    """Save SEO article to news table as a long-form article."""
    if not article or not article.get('title_en'):
        return False

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    slug = article['title_en'].lower()[:80]
    slug = ''.join(c if c.isalnum() or c in (' ', '-') else '' for c in slug)
    slug = slug.replace(' ', '-').strip('-')
    slug = re.sub(r'-+', '-', slug)

    content_hash = hashlib.md5(f"{article['title_en']}{article['target_keyword']}".encode()).hexdigest()

    existing = supabase.table('news').select('id').eq('content_hash', content_hash).execute()
    if existing.data:
        print(f"  Skip (duplicate): {article['title_en'][:50]}")
        return False

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
        keywords = get_target_keywords()
        saved = 0
        for kw in keywords[:2]:
            print(f"\nGenerating article for: {kw['query']}...")
            article = generate_seo_article(kw)
            if save_article(article):
                saved += 1
                print(f"  Saved: {article['title_en'][:60]}")
            time.sleep(2)

        log_operation("seo_articles", "success", f"Generated {saved} articles", {
            "saved": saved, "keywords": [k['query'] for k in keywords[:2]]
        })
    except Exception as e:
        log_operation("seo_articles", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "SEO Article Error", str(e), "error")
        raise

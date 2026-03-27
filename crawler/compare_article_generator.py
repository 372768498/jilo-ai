# crawler/compare_article_generator.py
import time
import re
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


def find_comparison_pairs():
    """Find tool pairs that should be compared."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    pairs = []

    # Strategy 1: GSC queries containing "vs" or "alternative"
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')
    vs_result = supabase.table('search_console_daily').select(
        'query, impressions'
    ).gte('date', week_ago).ilike('query', '%vs%').order(
        'impressions', desc=True
    ).limit(5).execute()
    alt_result = supabase.table('search_console_daily').select(
        'query, impressions'
    ).gte('date', week_ago).ilike('query', '%alternative%').order(
        'impressions', desc=True
    ).limit(5).execute()
    combined = (vs_result.data or []) + (alt_result.data or [])
    vs_queries_data = sorted(combined, key=lambda x: x.get('impressions', 0), reverse=True)[:5]

    for q in vs_queries_data:
        query = q['query'].lower()
        if ' vs ' in query:
            parts = query.split(' vs ')
            if len(parts) == 2:
                pairs.append((parts[0].strip(), parts[1].strip()))

    # Strategy 2: Top viewed tools → compare with similar category tools
    if not pairs:
        top_tools = supabase.table('tools').select(
            'name_en, category, slug'
        ).eq('status', 'published').order('click_count', desc=True).limit(5).execute()

        for tool in (top_tools.data or [])[:2]:
            similar = supabase.table('tools').select(
                'name_en, slug'
            ).eq('status', 'published').eq('category', tool['category']).neq(
                'slug', tool['slug']
            ).limit(1).execute()

            if similar.data:
                pairs.append((tool['name_en'], similar.data[0]['name_en']))

    # Fallback: predefined popular comparisons
    if not pairs:
        pairs = [("ChatGPT", "Claude"), ("Midjourney", "DALL-E 3")]

    return pairs[:1]  # Generate 1 per run


def get_tool_data(tool_name):
    """Fetch tool data from Supabase."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    result = supabase.table('tools').select('*').ilike('name_en', f'%{tool_name}%').limit(1).execute()
    return result.data[0] if result.data else {"name_en": tool_name}


def generate_comparison(tool_a_name, tool_b_name):
    """Generate comparison article using GPT-4o."""
    tool_a = get_tool_data(tool_a_name)
    tool_b = get_tool_data(tool_b_name)

    context_a = f"Name: {tool_a.get('name_en', tool_a_name)}, Category: {tool_a.get('category', 'AI')}, Pricing: {tool_a.get('pricing_type', 'unknown')}, Description: {tool_a.get('description_en', '')[:300]}"
    context_b = f"Name: {tool_b.get('name_en', tool_b_name)}, Category: {tool_b.get('category', 'AI')}, Pricing: {tool_b.get('pricing_type', 'unknown')}, Description: {tool_b.get('description_en', '')[:300]}"

    prompt = f"""Write a detailed comparison article: "{tool_a_name} vs {tool_b_name}"

Tool A data: {context_a}
Tool B data: {context_b}

Requirements:
- 2000-2500 words
- Include a markdown comparison table (features, pricing, ease of use, best for)
- Include scenario-based recommendations ("If you need X, choose A; if you need Y, choose B")
- Include FAQ section (3-5 questions)
- Be balanced and factual
- Year is 2026

Respond in this exact format:
TITLE_EN: [{tool_a_name} vs {tool_b_name}: comprehensive comparison title]
META_DESC_EN: [155 char meta description]
CONTENT_EN: [full comparison article in markdown]
---SEPARATOR---
TITLE_ZH: [Chinese title]
META_DESC_ZH: [Chinese meta description]
CONTENT_ZH: [Chinese translation of full article]"""

    try:
        response = _get_openai_client().chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert AI tool reviewer. Write fair, detailed comparisons that help users make informed decisions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=5000
        )

        content = response.choices[0].message.content
        parts = content.split('---SEPARATOR---')
        en_part = parts[0]
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

        slug_base = f"{tool_a_name}-vs-{tool_b_name}".lower()
        slug = re.sub(r'[^a-z0-9-]', '', slug_base.replace(' ', '-'))
        slug = re.sub(r'-+', '-', slug)[:100]

        return {
            'slug': slug,
            'title_en': extract(en_part, 'TITLE_EN') or f"{tool_a_name} vs {tool_b_name}: Complete Comparison",
            'meta_title_en': extract(en_part, 'TITLE_EN'),
            'meta_description_en': extract(en_part, 'META_DESC_EN'),
            'content_en': extract_content(en_part, 'CONTENT_EN'),
            'title_zh': extract(zh_part, 'TITLE_ZH'),
            'meta_description_zh': extract(zh_part, 'META_DESC_ZH'),
            'content_zh': extract_content(zh_part, 'CONTENT_ZH'),
        }
    except Exception as e:
        print(f"  GPT-4o comparison error: {e}")
        return None


def save_comparison(article):
    """Save comparison article to compare_articles table."""
    if not article or not article.get('content_en'):
        return False

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    existing = supabase.table('compare_articles').select('id').eq('slug', article['slug']).execute()
    if existing.data:
        print(f"  Skip (exists): {article['slug']}")
        return False

    # Save English version
    supabase.table('compare_articles').insert({
        'slug': article['slug'],
        'locale': 'en',
        'title': article['title_en'],
        'meta_title': article['meta_title_en'],
        'meta_description': article['meta_description_en'],
        'content': article['content_en'],
        'status': 'published',
        'published_at': datetime.utcnow().isoformat(),
    }).execute()

    # Save Chinese version
    if article.get('content_zh'):
        supabase.table('compare_articles').insert({
            'slug': f"{article['slug']}-zh",
            'locale': 'zh',
            'title': article['title_zh'],
            'meta_title': article['title_zh'],
            'meta_description': article['meta_description_zh'],
            'content': article['content_zh'],
            'status': 'published',
            'published_at': datetime.utcnow().isoformat(),
        }).execute()

    return True


if __name__ == "__main__":
    print("Starting compare article generator...")
    try:
        pairs = find_comparison_pairs()
        saved = 0
        for tool_a, tool_b in pairs:
            print(f"\nGenerating: {tool_a} vs {tool_b}...")
            article = generate_comparison(tool_a, tool_b)
            if save_comparison(article):
                saved += 1
                print(f"  Saved: {article['slug']}")
            time.sleep(2)

        log_operation("compare_articles", "success", f"Generated {saved} articles", {
            "saved": saved, "pairs": [f"{a} vs {b}" for a, b in pairs]
        })
    except Exception as e:
        log_operation("compare_articles", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "Compare Article Error", str(e), "error")
        raise

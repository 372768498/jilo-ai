# crawler/seo_article_generator.py
#
# Queue consumer: reads `generate_seo_content` actions from action_queue
# (emitted by strategy_engine), produces articles, writes lifecycle back.
# Does NOT self-select keywords — single source of truth is the policy layer.
import time
import re
import hashlib
from datetime import datetime
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert
import action_queue as aq
import quality_gates as qg

ACTIONS_PER_RUN = 2


def _get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    return OpenAI(api_key=OPENAI_API_KEY)


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


def generate_seo_article(keyword):
    """
    Generate a long-form SEO article for the given keyword.
    Uses gpt-4o-mini (~$0.006/article) instead of gpt-4o (~$0.06/article).
    """
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

        return {
            'title_en': extract_field(en_part, 'TITLE_EN'),
            'meta_description_en': extract_field(en_part, 'META_DESC_EN'),
            'content_en': extract_multiline(en_part, 'CONTENT_EN'),
            'title_zh': extract_field(zh_part, 'TITLE_ZH'),
            'meta_description_zh': extract_field(zh_part, 'META_DESC_ZH'),
            'content_zh': extract_multiline(zh_part, 'CONTENT_ZH'),
            'target_keyword': keyword,
        }

    except Exception as e:
        print(f"  GPT-4o-mini article generation error: {e}")
        return None


def save_article(article, supabase):
    """
    Save SEO article to news table. Assumes quality_gates already passed,
    including duplicate check (which sets article['_content_hash']).
    Slug collision is handled by appending a content_hash suffix.
    """
    content_hash = article['_content_hash']

    slug = re.sub(r'[^a-z0-9\s-]', '', article['title_en'].lower())[:80]
    slug = re.sub(r'[\s-]+', '-', slug).strip('-')

    existing_slug = supabase.table('news').select('id').eq('slug', slug).execute()
    if existing_slug.data:
        slug = f"{slug}-{content_hash[:6]}"

    supabase.table('news').insert({
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
    }).execute()
    return slug


if __name__ == "__main__":
    print("Starting SEO article generator (queue consumer)...")
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        actions = aq.pick_pending(supabase, 'generate_seo_content', limit=ACTIONS_PER_RUN)

        if not actions:
            print("No pending generate_seo_content actions. Strategy layer has nothing for us.")
            log_operation("seo_articles", "success",
                          "No pending actions", {"saved": 0, "reason": "queue_empty"})
        else:
            saved = 0
            failed = 0
            skipped = 0
            for action in actions:
                keyword = (action.get('payload') or {}).get('keyword')
                if not keyword:
                    aq.mark_failed(supabase, action, "payload missing 'keyword'")
                    failed += 1
                    continue

                print(f"\nGenerating: {keyword}  (priority={action['priority']}, attempt={action['attempts']}/{action.get('max_attempts', 3)})")
                try:
                    article = generate_seo_article(keyword)
                    if not article:
                        aq.mark_failed(supabase, action, "generation returned None (API error or parse failure)")
                        failed += 1
                        continue

                    gate = qg.check_seo_article(article, supabase)
                    if not gate.ok:
                        if gate.terminal:
                            aq.mark_skipped(supabase, action, gate.reason)
                            skipped += 1
                            print(f"  SKIP: {gate.reason}")
                        else:
                            aq.mark_failed(supabase, action, gate.reason)
                            failed += 1
                            print(f"  FAIL gate: {gate.reason}")
                        continue

                    slug = save_article(article, supabase)
                    aq.mark_done(supabase, action, {
                        'slug': slug,
                        'title_en': article['title_en'],
                        'keyword': keyword,
                    })
                    saved += 1
                    print(f"  DONE: {article['title_en'][:60]}")
                except Exception as gen_err:
                    aq.mark_failed(supabase, action, str(gen_err))
                    failed += 1
                    print(f"  FAIL: {gen_err}")
                time.sleep(2)

            log_operation("seo_articles", "success",
                          f"saved={saved} failed={failed} skipped={skipped}", {
                              "saved": saved, "failed": failed, "skipped": skipped,
                              "actions": [{"id": a['id'], "keyword": (a.get('payload') or {}).get('keyword')} for a in actions],
                          })

    except Exception as e:
        log_operation("seo_articles", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "SEO Article Error", str(e), "error")
        raise

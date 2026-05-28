# crawler/seo_article_generator.py
#
# Queue consumer: reads `generate_seo_content` actions from action_queue
# (emitted by strategy_engine), produces articles, writes lifecycle back.
# Does NOT self-select keywords — single source of truth is the policy layer.
import time
import re
import json
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
- 5000-7000 words in content_en (detailed, in-depth content)
- H2 and H3 headings (markdown)
- Multiple comparison tables (features, pricing, use cases)
- Real-world examples and case studies
- Step-by-step tutorials where applicable
- FAQ section (5-8 questions) at the end
- Internal links to at least 10 tools from our directory
- Factual, practical, genuinely helpful — not generic filler
- Current year is 2026{tools_context}

Return a single JSON object with EXACTLY these keys (all required, none empty):
{{
  "title_en": "SEO title including \\"{keyword}\\", max 70 chars",
  "meta_description_en": "140-155 char meta description",
  "content_en": "full article in markdown",
  "title_zh": "Chinese title",
  "meta_description_zh": "80-100 char Chinese meta description",
  "content_zh": "Chinese translation of the full article in markdown"
}}"""

    try:
        response = _get_openai_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert AI technology writer. Write in-depth, well-structured articles with genuine value, using markdown inside the content fields. Respond with a single valid JSON object only — no code fences, no commentary."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.65,
            max_tokens=12000,
            response_format={"type": "json_object"},
        )

        data = json.loads(response.choices[0].message.content)

        return {
            'title_en': data.get('title_en', ''),
            'meta_description_en': data.get('meta_description_en', ''),
            'content_en': data.get('content_en', ''),
            'title_zh': data.get('title_zh', ''),
            'meta_description_zh': data.get('meta_description_zh', ''),
            'content_zh': data.get('content_zh', ''),
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


def rewrite_article(article, slug, supabase):
    """
    Refresh an existing page in place (used for underperformer rewrites).
    Keeps slug and published_at so age tracking continues; swaps in the new
    title/summary/content and bumps the content hash. Returns the slug, or
    None if no row matched (page may have been removed).
    """
    existing = supabase.table('news').select('id').eq('slug', slug).limit(1).execute()
    if not existing.data:
        return None
    supabase.table('news').update({
        'title_en': article['title_en'],
        'title_zh': article['title_zh'],
        'summary_en': article['meta_description_en'],
        'summary_zh': article['meta_description_zh'],
        'content_en': article['content_en'],
        'content_zh': article['content_zh'],
        'content_hash': article['_content_hash'],
    }).eq('slug', slug).execute()
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
                payload = action.get('payload') or {}
                keyword = payload.get('keyword')
                is_rewrite = payload.get('mode') == 'rewrite'
                if not keyword:
                    aq.mark_failed(supabase, action, "payload missing 'keyword'")
                    failed += 1
                    continue

                mode_label = "Rewriting" if is_rewrite else "Generating"
                print(f"\n{mode_label}: {keyword}  (priority={action['priority']}, attempt={action['attempts']}/{action.get('max_attempts', 3)})")
                try:
                    article = generate_seo_article(keyword)
                    if not article:
                        aq.mark_failed(supabase, action, "generation returned None (API error or parse failure)")
                        failed += 1
                        continue

                    # Rewrites skip the duplicate gate (the page already exists).
                    gate = qg.check_seo_article(article, supabase, skip_dup=is_rewrite)
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

                    if is_rewrite:
                        slug = rewrite_article(article, payload.get('slug'), supabase)
                        if not slug:
                            aq.mark_skipped(supabase, action, f"page gone, nothing to rewrite: {payload.get('slug')}")
                            skipped += 1
                            print(f"  SKIP: page {payload.get('slug')} not found")
                            continue
                        outcome = 'rewritten'
                    else:
                        slug = save_article(article, supabase)
                        outcome = 'created'

                    aq.mark_done(supabase, action, {
                        'slug': slug,
                        'title_en': article['title_en'],
                        'keyword': keyword,
                        'outcome': outcome,
                    })
                    saved += 1
                    print(f"  DONE ({outcome}): {article['title_en'][:60]}")
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
            send_feishu_alert(FEISHU_WEBHOOK_URL, "SEO 文章生成出错", str(e), "error")
        raise

# crawler/seo_article_generator.py
#
# Queue consumer: reads `generate_seo_content` actions from action_queue
# (emitted by strategy_engine), produces articles, writes lifecycle back.
# Does NOT self-select keywords — single source of truth is the policy layer.
import time
import re
import json
import hashlib
import os
from datetime import datetime
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert
import action_queue as aq
import quality_gates as qg

ACTIONS_PER_RUN = int(os.getenv("SEO_ACTIONS_PER_RUN", "5"))


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
            f"- {t['name_en']} (slug: {t['slug']}, pricing: {t.get('pricing_type','freemium')})"
            for t in related_tools
        ]
        tools_context = (
            "\n\nOnly these tools exist in our directory — link ONLY to these, never invent a tool or slug:\n"
            + '\n'.join(tool_lines)
        )

    prompt = f"""Write a comprehensive, SEO-optimized article about: "{keyword}"

Requirements:
- 5000-7000 words in content_en (detailed, in-depth content)
- H2 and H3 headings (markdown)
- Multiple comparison tables (features, use cases)
- Step-by-step tutorials where applicable
- FAQ section (5-8 questions) at the end
- Factual, practical, genuinely helpful — not generic filler
- Current year is 2026{tools_context}

INTERNAL LINKS — exact path format (other formats 404):
- In content_en link as /en/tools/<slug>   e.g. [Pictory](/en/tools/pictory)
- In content_zh link as /zh/tools/<slug>   e.g. [Pictory](/zh/tools/pictory)
- Use ONLY slugs from the directory list above. Link 8-12 of them.

DO NOT FABRICATE (this is critical for trust and SEO):
- No invented statistics, percentages, case studies, university/company names,
  or "X increased by Y%" claims. If you lack a verifiable fact, write generally
  without fake numbers.
- For pricing, do NOT guess exact prices; say pricing tier (free/freemium/paid)
  and "check the official site for current pricing".

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


def generate_aeo_answer(keyword, context=None):
    """
    Generate an answer-engine-optimized page: direct answer first, citation
    snippets, comparison table, FAQ, and internal links.
    """
    context = context or {}
    related_tools = get_related_tools(keyword)
    tool_lines = [
        f"- {t['name_en']} (slug: {t['slug']}, pricing: {t.get('pricing_type','freemium')})"
        for t in related_tools[:12]
    ]
    tools_context = "\n".join(tool_lines) or "- No exact tool matches; keep recommendations general."

    prompt = f"""Create an answer-engine-optimized page for this query: "{keyword}"

Context from our growth system:
{json.dumps(context, ensure_ascii=False)}

Tools available in our directory. Link ONLY to these slugs:
{tools_context}

Goal:
This page should be easy for Google, ChatGPT, Perplexity, Claude, Gemini, and Copilot-style answer engines to quote and link.

Required structure for content_en as clean HTML (not markdown):
1. <section class="aeo-short-answer"> with an <h2>Short answer</h2> and a 2-4 sentence direct answer.
2. <section class="aeo-citation-snippets"> with <h2>Quick citation snippets</h2> and 3 short standalone <p> snippets that can be quoted.
3. A comparison <table> with practical decision criteria.
4. A "Best next step" section with internal links to /en/tools/<slug> where relevant.
5. An FAQ section with 4-6 questions using <h3> question headings and concise answers.
6. A final "Last updated" line for 2026.

Required structure for content_zh: faithful Simplified Chinese HTML translation using /zh/tools/<slug> links.

Rules:
- Give a clear answer near the top. No throat-clearing.
- Do not invent statistics, prices, case studies, benchmarks, or citations.
- Mention uncertainty where current pricing/features may change.
- Internal links must use exact paths: /en/tools/<slug> and /zh/tools/<slug>.
- Keep content_en around 900-1500 words. Keep it useful and dense.

Return a single JSON object with EXACTLY these keys:
{{
  "title_en": "SEO title including the query, max 80 chars",
  "meta_description_en": "140-160 char meta description",
  "content_en": "full English HTML",
  "title_zh": "Chinese title",
  "meta_description_zh": "80-110 char Chinese meta description",
  "content_zh": "full Chinese HTML"
}}"""

    try:
        response = _get_openai_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You create concise answer-engine-optimized pages that are useful, citeable, and factual. Respond with one valid JSON object only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.45,
            max_tokens=9000,
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
        print(f"  GPT-4o-mini AEO generation error: {e}")
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


def save_aeo_answer(article, supabase):
    content_hash = article['_content_hash']
    slug_base = re.sub(r'[^a-z0-9\s-]', '', article.get('target_keyword', article['title_en']).lower())[:76]
    slug = re.sub(r'[\s-]+', '-', slug_base).strip('-')
    if not slug:
        slug = re.sub(r'[^a-z0-9\s-]', '', article['title_en'].lower())[:76]
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
        'source': 'jilo.ai AEO',
        'news_type': 'aeo_answer',
        'category_tags': ['aeo_answer', 'answer_engine'],
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


def generate_hub_intro(category_slug, keyword, supabase):
    """
    Generate a bilingual SEO intro for a category hub and write it to
    categories.description_*. Returns True on success.
    """
    cat = supabase.table('categories').select('name_en, name_zh').eq(
        'slug', category_slug
    ).limit(1).execute()
    if not cat.data:
        return False
    name_en = cat.data[0]['name_en']

    tools = supabase.table('tools').select('name_en').eq(
        'category_canonical', category_slug
    ).eq('status', 'published').limit(15).execute()
    tool_names = ', '.join(t['name_en'] for t in (tools.data or []) if t.get('name_en'))

    prompt = f"""Write a concise, helpful SEO intro for a category hub page titled "Best {name_en} AI Tools in 2026".

Tools featured on this page: {tool_names}

Requirements:
- 180-280 words in description_en (2-3 short paragraphs)
- Explain what {name_en} AI tools do, who they're for, and how to choose between them (what criteria matter)
- Natural, genuinely useful — it sits above a comparison table and tool list
- DO NOT fabricate statistics, prices, or case studies. No invented numbers.

Return a single JSON object with EXACTLY these keys (all required, none empty):
{{
  "description_en": "the English intro",
  "description_zh": "the Chinese (Simplified) intro"
}}"""

    try:
        resp = _get_openai_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You write tight, useful category intros for an AI-tools site. Respond with a single valid JSON object only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
            max_tokens=1200,
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content)
        desc_en = (data.get('description_en') or '').strip()
        desc_zh = (data.get('description_zh') or '').strip()
        if len(desc_en) < 120 or len(desc_zh) < 60:
            print(f"  Hub intro too short for {category_slug}")
            return False
        supabase.table('categories').update({
            'description_en': desc_en,
            'description_zh': desc_zh,
        }).eq('slug', category_slug).execute()
        return True
    except Exception as e:
        print(f"  Hub intro generation error for {category_slug}: {e}")
        return False


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
                mode = payload.get('mode')

                # Hub mode: fill a category hub's intro instead of writing /news.
                if mode == 'hub':
                    cat_slug = payload.get('category_slug')
                    print(f"\nHub intro: /c/{cat_slug}  (priority={action['priority']})")
                    try:
                        if generate_hub_intro(cat_slug, keyword, supabase):
                            aq.mark_done(supabase, action, {'category_slug': cat_slug, 'outcome': 'hub_intro'})
                            saved += 1
                            print(f"  DONE (hub_intro): /c/{cat_slug}")
                        else:
                            aq.mark_failed(supabase, action, f"hub intro generation failed for {cat_slug}")
                            failed += 1
                    except Exception as hub_err:
                        aq.mark_failed(supabase, action, str(hub_err))
                        failed += 1
                        print(f"  FAIL: {hub_err}")
                    time.sleep(2)
                    continue

                if mode == 'aeo':
                    print(f"\nAEO answer: {keyword}  (priority={action['priority']})")
                    try:
                        article = generate_aeo_answer(keyword, payload)
                        if not article:
                            aq.mark_failed(supabase, action, "AEO generation returned None")
                            failed += 1
                            continue
                        gate = qg.check_aeo_answer(article, supabase)
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
                        slug = save_aeo_answer(article, supabase)
                        aq.mark_done(supabase, action, {
                            'slug': slug,
                            'title_en': article['title_en'],
                            'keyword': keyword,
                            'outcome': 'aeo_answer',
                        })
                        saved += 1
                        print(f"  DONE (aeo_answer): {article['title_en'][:60]}")
                    except Exception as aeo_err:
                        aq.mark_failed(supabase, action, str(aeo_err))
                        failed += 1
                        print(f"  FAIL: {aeo_err}")
                    time.sleep(2)
                    continue

                is_rewrite = mode == 'rewrite'
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

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
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, OPENAI_MODEL, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert
import action_queue as aq
import quality_gates as qg
import content_verifier as cv
from llm_client import get_openai_client

ACTIONS_PER_RUN = int(os.getenv("SEO_ACTIONS_PER_RUN", "5"))
LAST_GENERATION_ERROR = None


def _get_openai_client():
    return get_openai_client()


def _record_generation_error(error):
    global LAST_GENERATION_ERROR
    LAST_GENERATION_ERROR = str(error)


def _generation_failure_reason(default):
    return LAST_GENERATION_ERROR or default


def _is_fatal_generation_env_error(reason):
    reason = reason or ''
    return (
        'OPENAI_API_KEY not configured' in reason
        or 'Incorrect API key provided' in reason
        or 'invalid_api_key' in reason
    )


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
    global LAST_GENERATION_ERROR
    LAST_GENERATION_ERROR = None
    related_tools = get_related_tools(keyword)

    tools_context = ""
    if related_tools:
        # rank2: mark monetized tools so the model can give them prominent,
        # honest placement in comparison tables (revenue follows the traffic).
        tool_lines = [
            f"- {t['name_en']} (slug: {t['slug']}, pricing: {t.get('pricing_type','freemium')})"
            f"{' [monetized — feature prominently in comparison tables when genuinely relevant]' if (t.get('affiliate_url') or '').strip() else ''}"
            for t in related_tools
        ]
        tools_context = (
            "\n\nOnly these tools exist in our directory — link ONLY to these, never invent a tool or slug:\n"
            + '\n'.join(tool_lines)
            + "\n(Tools marked [monetized] should be included and fairly compared where relevant — never misrepresent them, but don't bury them.)"
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
            model=OPENAI_MODEL,
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
        _record_generation_error(e)
        print(f"  GPT-4o-mini article generation error: {e}")
        return None


def generate_aeo_answer(keyword, context=None):
    """
    Generate an answer-engine-optimized page: direct answer first, citation
    snippets, comparison table, FAQ, and internal links.
    """
    global LAST_GENERATION_ERROR
    LAST_GENERATION_ERROR = None
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

Current year is 2026. Do not put 2025, 2024, 2023, or older years in titles unless the user query itself contains that year.

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
            model=OPENAI_MODEL,
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
        _record_generation_error(e)
        print(f"  GPT-4o-mini AEO generation error: {e}")
        return None


def _plain_text(value):
    text = re.sub(r'<[^>]+>', ' ', value or '')
    text = re.sub(r'[#*_`\[\]()>-]+', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def _fit_text(text, lo, hi, fallback):
    base = _plain_text(text) or _plain_text(fallback)
    if not base:
        base = "A practical guide to choosing the right AI tools for the task."
    if len(base) > hi:
        trimmed = base[:hi].rsplit(' ', 1)[0].strip()
        base = trimmed or base[:hi].strip()
    while len(base) < lo:
        addon = " Compare options, use cases, tradeoffs, and next steps before choosing."
        room = hi - len(base)
        if room <= 1:
            break
        base = (base + addon[:room]).strip()
    return base[:hi].strip()


def _fit_title(title, max_len, keyword):
    title = _plain_text(title)
    keyword = _plain_text(keyword)
    if not title:
        title = keyword or "AI Tools Guide"
    if len(title) <= max_len:
        return title
    candidates = [
        keyword,
        f"{keyword}: Guide",
        title.split(':', 1)[0],
        title,
    ]
    for candidate in candidates:
        candidate = _plain_text(candidate)
        if candidate and len(candidate) <= max_len:
            return candidate
    trimmed = title[:max_len].rsplit(' ', 1)[0].strip()
    return trimmed or title[:max_len].strip()


def _remove_unrequested_stale_years(title, keyword):
    keyword = keyword or ''
    for year in re.findall(r'\b20(?:2[0-5])\b', title or ''):
        if year not in keyword:
            title = re.sub(rf'\b{year}\b', '', title)
    return re.sub(r'\s+', ' ', title or '').strip(' -:|')


def repair_article_for_gate(article, reason, article_type='seo'):
    """Best-effort deterministic repair for common model contract violations."""
    repaired = dict(article or {})
    keyword = repaired.get('target_keyword') or ''
    title_max = 80 if article_type == 'aeo' else 70

    if reason.startswith('missing/empty fields:'):
        fields = [f.strip() for f in reason.split(':', 1)[1].split(',') if f.strip()]
        for field in fields:
            if repaired.get(field):
                continue
            if field == 'title_en':
                repaired[field] = _fit_title(keyword, title_max, keyword)
            elif field == 'meta_description_en':
                repaired[field] = _fit_text('', 100, 170, repaired.get('content_en') or keyword)
            elif field == 'content_en':
                return article, False
            elif field == 'title_zh':
                repaired[field] = repaired.get('title_en') or _fit_title(keyword, title_max, keyword)
            elif field == 'meta_description_zh':
                repaired[field] = _fit_text(
                    repaired.get('meta_description_en'),
                    40,
                    170,
                    repaired.get('content_zh') or repaired.get('content_en') or keyword,
                )
            elif field == 'content_zh':
                # Fallback keeps the item from dying when only translation is missing.
                # A later translation pass can improve it; the growth system should not
                # discard a valid English page solely because the bilingual field is empty.
                repaired[field] = repaired.get('content_en') or ''

    m = re.search(r'title_en \d+ chars > (\d+) max', reason)
    if m:
        repaired['title_en'] = _fit_title(repaired.get('title_en'), int(m.group(1)), keyword)

    m = re.search(r'meta_description_en \d+ chars out of \[(\d+),(\d+)\]', reason)
    if m:
        repaired['meta_description_en'] = _fit_text(
            repaired.get('meta_description_en'),
            int(m.group(1)),
            int(m.group(2)),
            repaired.get('content_en') or keyword,
        )

    m = re.search(r'title_en contains stale year \d+ not present in target keyword', reason)
    if m:
        repaired['title_en'] = _remove_unrequested_stale_years(repaired.get('title_en'), keyword)

    if reason.startswith('meta_description_zh ') or 'meta_description_zh' in reason:
        repaired['meta_description_zh'] = _fit_text(
            repaired.get('meta_description_zh') or repaired.get('meta_description_en'),
            40,
            170,
            repaired.get('content_zh') or repaired.get('content_en') or keyword,
        )

    changed = repaired != (article or {})
    return repaired, changed


def check_with_repair(article, supabase, check_fn, article_type='seo', skip_dup=False):
    gate = check_fn(article, supabase, skip_dup=skip_dup)
    if gate.ok or gate.terminal:
        return article, gate, False
    repaired, changed = repair_article_for_gate(article, gate.reason, article_type=article_type)
    if not changed:
        return article, gate, False
    repaired_gate = check_fn(repaired, supabase, skip_dup=skip_dup)
    if repaired_gate.ok:
        print(f"  REPAIRED gate: {gate.reason}")
        return repaired, repaired_gate, True
    return repaired, repaired_gate, True


def generate_with_retry(generate_fn, failure_label):
    article = generate_fn()
    if article:
        return article, False
    if _is_fatal_generation_env_error(LAST_GENERATION_ERROR):
        return None, False
    print(f"  {failure_label}; retrying once")
    return generate_fn(), True


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
            model=OPENAI_MODEL,
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
            failure_reasons = []
            fatal_generation_error = None
            for action in actions:
                if fatal_generation_error:
                    aq.release_pending(
                        supabase,
                        action,
                        f"blocked by fatal generation error: {fatal_generation_error[:500]}",
                    )
                    continue
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
                        article, retried = generate_with_retry(
                            lambda: generate_aeo_answer(keyword, payload),
                            "AEO generation returned None",
                        )
                        if not article:
                            reason = _generation_failure_reason("AEO generation returned None")
                            aq.mark_failed(supabase, action, reason)
                            failure_reasons.append(reason)
                            if _is_fatal_generation_env_error(reason):
                                fatal_generation_error = reason
                            failed += 1
                            continue
                        article, gate, repaired = check_with_repair(
                            article, supabase, qg.check_aeo_answer, article_type='aeo'
                        )
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
                        verdict = cv.verify_publishable(article, 'aeo_answer')
                        if not verdict['ok']:
                            reason = f"verifier {verdict['verdict']}: {verdict['failed_gates']} {verdict['evidence']}"
                            aq.mark_skipped(supabase, action, reason)
                            skipped += 1
                            print(f"  BLOCKED by verifier: {reason}")
                            continue
                        slug = save_aeo_answer(article, supabase)
                        aq.mark_done(supabase, action, {
                            'slug': slug,
                            'title_en': article['title_en'],
                            'keyword': keyword,
                            'outcome': 'aeo_answer',
                            'repaired': repaired,
                            'retried': retried,
                        })
                        saved += 1
                        print(f"  DONE (aeo_answer): {article['title_en'][:60]}")
                    except Exception as aeo_err:
                        reason = str(aeo_err)
                        aq.mark_failed(supabase, action, reason)
                        failure_reasons.append(reason)
                        failed += 1
                        print(f"  FAIL: {aeo_err}")
                    time.sleep(2)
                    continue

                is_rewrite = mode == 'rewrite'
                if not keyword:
                    aq.mark_failed(supabase, action, "payload missing 'keyword'")
                    failed += 1
                    continue

                # rank6 (I3): rewriting an AEO answer page must produce another AEO
                # page — never overwrite it with a long-form SEO article, which
                # would strip the short answer / table / FAQ that gets it cited.
                if is_rewrite and payload.get('content_type') == 'aeo_answer':
                    print(f"\nRewriting AEO: {keyword}  (priority={action['priority']})")
                    try:
                        article, retried = generate_with_retry(
                            lambda: generate_aeo_answer(keyword, payload),
                            "AEO rewrite returned None",
                        )
                        if not article:
                            reason = _generation_failure_reason("AEO rewrite returned None")
                            aq.mark_failed(supabase, action, reason)
                            failure_reasons.append(reason)
                            if _is_fatal_generation_env_error(reason):
                                fatal_generation_error = reason
                            failed += 1
                            continue
                        article, gate, repaired = check_with_repair(
                            article, supabase, qg.check_aeo_answer, article_type='aeo', skip_dup=True
                        )
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
                        verdict = cv.verify_publishable(article, 'aeo_answer')
                        if not verdict['ok']:
                            reason = f"verifier {verdict['verdict']}: {verdict['failed_gates']} {verdict['evidence']}"
                            aq.mark_skipped(supabase, action, reason)
                            skipped += 1
                            print(f"  BLOCKED by verifier: {reason}")
                            continue
                        slug = rewrite_article(article, payload.get('slug'), supabase)
                        if not slug:
                            aq.mark_skipped(supabase, action, f"AEO page gone: {payload.get('slug')}")
                            skipped += 1
                            continue
                        aq.mark_done(supabase, action, {
                            'slug': slug, 'title_en': article['title_en'],
                            'keyword': keyword, 'outcome': 'rewritten_aeo',
                            'repaired': repaired, 'retried': retried,
                        })
                        saved += 1
                        print(f"  DONE (rewritten_aeo): {article['title_en'][:60]}")
                    except Exception as aeo_rw_err:
                        reason = str(aeo_rw_err)
                        aq.mark_failed(supabase, action, reason)
                        failure_reasons.append(reason)
                        failed += 1
                        print(f"  FAIL: {aeo_rw_err}")
                    time.sleep(2)
                    continue

                mode_label = "Rewriting" if is_rewrite else "Generating"
                print(f"\n{mode_label}: {keyword}  (priority={action['priority']}, attempt={action['attempts']}/{action.get('max_attempts', 3)})")
                try:
                    article, retried = generate_with_retry(
                        lambda: generate_seo_article(keyword),
                        "generation returned None (API error or parse failure)",
                    )
                    if not article:
                        reason = _generation_failure_reason("generation returned None (API error or parse failure)")
                        aq.mark_failed(supabase, action, reason)
                        failure_reasons.append(reason)
                        if _is_fatal_generation_env_error(reason):
                            fatal_generation_error = reason
                        failed += 1
                        continue

                    # Rewrites skip the duplicate gate (the page already exists).
                    article, gate, repaired = check_with_repair(
                        article, supabase, qg.check_seo_article, article_type='seo', skip_dup=is_rewrite
                    )
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

                    verdict = cv.verify_publishable(article, 'seo_article')
                    if not verdict['ok']:
                        reason = f"verifier {verdict['verdict']}: {verdict['failed_gates']} {verdict['evidence']}"
                        aq.mark_skipped(supabase, action, reason)
                        skipped += 1
                        print(f"  BLOCKED by verifier: {reason}")
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
                        'repaired': repaired,
                        'retried': retried,
                    })
                    saved += 1
                    print(f"  DONE ({outcome}): {article['title_en'][:60]}")
                except Exception as gen_err:
                    reason = str(gen_err)
                    aq.mark_failed(supabase, action, reason)
                    failure_reasons.append(reason)
                    failed += 1
                    print(f"  FAIL: {gen_err}")
                time.sleep(2)

            details = {
                "saved": saved,
                "failed": failed,
                "skipped": skipped,
                "failure_reasons": failure_reasons[:5],
                "actions": [{"id": a['id'], "keyword": (a.get('payload') or {}).get('keyword')} for a in actions],
            }
            if fatal_generation_error:
                details["fatal_generation_error"] = fatal_generation_error
                log_operation("seo_articles", "error", fatal_generation_error, details)
            else:
                log_operation("seo_articles", "success",
                              f"saved={saved} failed={failed} skipped={skipped}", details)

    except Exception as e:
        log_operation("seo_articles", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "SEO 文章生成出错", str(e), "error")
        raise

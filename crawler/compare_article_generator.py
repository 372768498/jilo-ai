# crawler/compare_article_generator.py
#
# Queue consumer: reads `generate_comparison` actions from action_queue
# (emitted by strategy_engine), produces compare articles, writes lifecycle back.
# Does NOT self-select pairs — single source of truth is the policy layer.
import time
import re
import json
from datetime import datetime
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert
import action_queue as aq
import quality_gates as qg

ACTIONS_PER_RUN = 1


def _get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    return OpenAI(api_key=OPENAI_API_KEY)


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
- 2000-2500 words in content_en
- Include a markdown comparison table (features, pricing, ease of use, best for)
- Include scenario-based recommendations ("If you need X, choose A; if you need Y, choose B")
- Include FAQ section (3-5 questions)
- Be balanced and factual
- Year is 2026

Return a single JSON object with EXACTLY these keys (all required, none empty):
{{
  "title_en": "SEO comparison title, max 80 chars",
  "meta_description_en": "100-160 char meta description",
  "content_en": "full comparison article in markdown",
  "title_zh": "Chinese title",
  "meta_description_zh": "Chinese meta description",
  "content_zh": "Chinese translation of the full article in markdown"
}}"""

    try:
        response = _get_openai_client().chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert AI tool reviewer. Write fair, detailed comparisons. Respond with a single valid JSON object only — no markdown code fences, no commentary."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=5000,
            response_format={"type": "json_object"},
        )

        data = json.loads(response.choices[0].message.content)

        slug_base = f"{tool_a_name}-vs-{tool_b_name}".lower()
        slug = re.sub(r'[^a-z0-9-]', '', slug_base.replace(' ', '-'))
        slug = re.sub(r'-+', '-', slug)[:100]

        return {
            'slug': slug,
            'title_en': data.get('title_en', ''),
            'meta_title_en': data.get('title_en', ''),
            'meta_description_en': data.get('meta_description_en', ''),
            'content_en': data.get('content_en', ''),
            'title_zh': data.get('title_zh', ''),
            'meta_description_zh': data.get('meta_description_zh', ''),
            'content_zh': data.get('content_zh', ''),
        }
    except Exception as e:
        print(f"  GPT-4o comparison error: {e}")
        return None


def save_comparison(article, supabase):
    """
    Save comparison article (both locales) to compare_articles.
    Assumes quality_gates already passed including slug-duplicate check.
    """
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


if __name__ == "__main__":
    print("Starting compare article generator (queue consumer)...")
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        actions = aq.pick_pending(supabase, 'generate_comparison', limit=ACTIONS_PER_RUN)

        if not actions:
            print("No pending generate_comparison actions. Strategy layer has nothing for us.")
            log_operation("compare_articles", "success",
                          "No pending actions", {"saved": 0, "reason": "queue_empty"})
        else:
            saved = 0
            failed = 0
            skipped = 0
            for action in actions:
                payload = action.get('payload') or {}
                tool_a = payload.get('tool_a')
                tool_b = payload.get('tool_b')
                if not tool_a or not tool_b:
                    aq.mark_failed(supabase, action, "payload missing tool_a/tool_b")
                    failed += 1
                    continue

                print(f"\nGenerating: {tool_a} vs {tool_b}  (priority={action['priority']}, attempt={action['attempts']}/{action.get('max_attempts', 3)})")
                try:
                    article = generate_comparison(tool_a, tool_b)
                    if not article:
                        aq.mark_failed(supabase, action, "generation returned None")
                        failed += 1
                        continue

                    gate = qg.check_compare_article(article, supabase)
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

                    save_comparison(article, supabase)
                    aq.mark_done(supabase, action, {
                        'slug': article['slug'],
                        'tool_a': tool_a,
                        'tool_b': tool_b,
                    })
                    saved += 1
                    print(f"  DONE: {article['slug']}")
                except Exception as gen_err:
                    aq.mark_failed(supabase, action, str(gen_err))
                    failed += 1
                    print(f"  FAIL: {gen_err}")
                time.sleep(2)

            log_operation("compare_articles", "success",
                          f"saved={saved} failed={failed} skipped={skipped}", {
                              "saved": saved, "failed": failed, "skipped": skipped,
                              "actions": [{"id": a['id'], "pair": f"{(a.get('payload') or {}).get('tool_a')} vs {(a.get('payload') or {}).get('tool_b')}"} for a in actions],
                          })
    except Exception as e:
        log_operation("compare_articles", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "对比文章生成出错", str(e), "error")
        raise

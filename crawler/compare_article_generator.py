# crawler/compare_article_generator.py
#
# Queue consumer: reads `generate_comparison` actions from action_queue
# (emitted by strategy_engine), produces compare articles, writes lifecycle back.
# Does NOT self-select pairs — single source of truth is the policy layer.
import time
import re
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
            send_feishu_alert(FEISHU_WEBHOOK_URL, "Compare Article Error", str(e), "error")
        raise

# crawler/china_access_agent.py
#
# Judges each tool's accessibility from mainland China — jilo's differentiator.
# For tools with china_access still null, asks the LLM to classify based on the
# product and its origin/known blocking, and writes a confident value back.
# Conservative: unsure → left null (re-tried next run or human-filled).
#
# Values: 'direct' | 'proxy' | 'blocked'  (null = unknown)
import json
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert

BATCH = 25            # tools judged per run
VALID = {'direct', 'proxy', 'blocked'}


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    return OpenAI(api_key=OPENAI_API_KEY)


def judge_batch(tools):
    """Ask the LLM to classify a batch. Returns {slug: value} for confident ones."""
    lines = [f"- slug={t['slug']} | {t.get('name_en')} | {t.get('official_url') or ''}" for t in tools]
    prompt = f"""For each AI tool below, judge how accessible it is from MAINLAND CHINA for a typical user, based on the product, its company/origin, and well-known blocking as of 2026.

Classify each into exactly one of:
- "direct"  — works from mainland China without a VPN (e.g. most China-origin tools, or global tools not blocked)
- "proxy"   — needs a VPN/proxy or a foreign phone/payment (most US AI tools: OpenAI, Anthropic, Google, Midjourney, etc.)
- "blocked" — effectively unusable even with a proxy (hard region ban / refuses China accounts)
- "unknown" — you are not reasonably confident

Be conservative: if unsure, use "unknown". Don't guess.

Tools:
{chr(10).join(lines)}

Return a single JSON object mapping each slug to its class:
{{ "slug-a": "proxy", "slug-b": "direct", ... }}"""

    resp = _client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You assess mainland-China accessibility of software accurately and conservatively. Respond with a single valid JSON object only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    data = json.loads(resp.choices[0].message.content)
    return {k: v for k, v in data.items() if v in VALID}


def run():
    supabase = get_supabase()
    tools = supabase.table('tools').select(
        'slug, name_en, official_url'
    ).is_('china_access', 'null').eq('status', 'published').limit(BATCH).execute()
    rows = tools.data or []
    if not rows:
        print("No tools pending china_access judgement.")
        return 0

    verdicts = judge_batch(rows)
    updated = 0
    for slug, value in verdicts.items():
        supabase.table('tools').update({'china_access': value}).eq('slug', slug).execute()
        updated += 1
        print(f"  {slug}: {value}")
    print(f"\n  Judged {len(rows)}, set {updated} (rest left null as unknown)")
    return updated


if __name__ == "__main__":
    print("Starting china_access agent...")
    try:
        n = run()
        log_operation("china_access_agent", "success", f"set {n} verdicts", {"updated": n})
    except Exception as e:
        log_operation("china_access_agent", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "中国可用性判定出错", str(e), "error")
        raise

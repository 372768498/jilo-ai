# crawler/trend_agent.py
#
# Forward loop — catches a topic while it's hot instead of judging it after.
# Reads the last 48h of ingested industry_news, lets the LLM cluster the
# near-duplicate rewrites and surface topics that are genuinely surging across
# multiple distinct sources AND worth an evergreen content page, then enqueues
# high-priority generate_seo_content actions. The existing SEO generator
# consumes them; high priority makes them jump ahead of routine GSC work.
import re
import json
from datetime import datetime, timedelta
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert
import action_queue as aq

LOOKBACK_HOURS = 48
MIN_ARTICLES = 8           # not enough fresh news → no reliable trend signal
MIN_SOURCES_PER_TOPIC = 2  # multi-source co-occurrence = a real trend, not one outlet
MAX_TOPICS = 3             # cap new high-priority work per run


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _slugify(text):
    s = re.sub(r'[^a-z0-9\s-]', '', text.lower())
    return re.sub(r'[\s-]+', '-', s).strip('-')


def fetch_recent_headlines(supabase):
    since = (datetime.utcnow() - timedelta(hours=LOOKBACK_HOURS)).isoformat()
    rows = supabase.table('news').select(
        'title_en, source, published_at'
    ).eq('news_type', 'industry_news').gte('published_at', since).order(
        'published_at', desc=True
    ).limit(200).execute()
    return [r for r in (rows.data or []) if r.get('title_en')]


def detect_trends(headlines):
    """Ask the LLM to cluster rewrites and surface multi-source surging topics."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")

    lines = [f"- [{(h.get('source') or '?')}] {h['title_en']}" for h in headlines]
    headlines_block = "\n".join(lines)

    prompt = f"""These are AI news headlines ingested in the last {LOOKBACK_HOURS} hours, each tagged with its source:

{headlines_block}

Many headlines are near-duplicate rewrites of the same story — cluster those together.
A topic only counts as SURGING if it is covered by {MIN_SOURCES_PER_TOPIC}+ DISTINCT source names
(the names in [brackets]). Coverage from a single source repeated many times does NOT count,
no matter how many headlines. Also require it to be worth a durable SEO content page on an
AI-tools site (a new tool/model launch, a major capability, a comparison-worthy rivalry).
Ignore one-off opinion pieces and generic "AI is changing X" stories.

For each qualifying topic, list the EXACT distinct source names it appeared under.
Return a single JSON object (up to {MAX_TOPICS} topics):
{{
  "trends": [
    {{
      "topic": "short human-readable topic",
      "keyword": "the search keyword a content page should target",
      "sources": ["Source A", "Source B"],
      "why": "one sentence on why it's worth a page now"
    }}
  ]
}}
If nothing is covered by {MIN_SOURCES_PER_TOPIC}+ distinct sources, return {{"trends": []}}."""

    client = OpenAI(api_key=OPENAI_API_KEY)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You spot real, multi-source trends and reject noise. Respond with a single valid JSON object only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    data = json.loads(resp.choices[0].message.content)
    return data.get('trends', []) or []


def enqueue_trends(supabase, trends):
    opened = 0
    for t in trends:
        keyword = (t.get('keyword') or '').strip()
        # Count DISTINCT source names, case-insensitively — don't trust a
        # self-reported integer; the LLM tends to report article count.
        sources = {s.strip().lower() for s in (t.get('sources') or []) if s and s.strip()}
        if not keyword or len(sources) < MIN_SOURCES_PER_TOPIC:
            print(f"  [reject] {keyword or t.get('topic')}: only {len(sources)} distinct source(s)")
            continue
        dedup_key = f"seo:{_slugify(keyword)}"
        if aq.enqueue(
            supabase,
            action_type='generate_seo_content',
            payload={'keyword': keyword, 'source': 'trend',
                     'topic': t.get('topic'), 'distinct_sources': len(sources),
                     'source_names': sorted(sources)},
            reason=f"Trending across {len(sources)} sources: {t.get('why') or t.get('topic')}",
            priority='high',
            dedup_key=dedup_key,
        ):
            opened += 1
            print(f"  [TREND high] {keyword}  ({len(sources)} sources)")
        else:
            print(f"  [dedup] {keyword} already queued")
    return opened


if __name__ == "__main__":
    print("Starting trend agent...")
    try:
        supabase = get_supabase()
        headlines = fetch_recent_headlines(supabase)
        print(f"  {len(headlines)} headlines in last {LOOKBACK_HOURS}h")

        if len(headlines) < MIN_ARTICLES:
            print(f"  Too few fresh articles (<{MIN_ARTICLES}); skipping.")
            log_operation("trend_agent", "success", "skipped: too few articles",
                          {"enqueued": 0, "headlines": len(headlines)})
        else:
            trends = detect_trends(headlines)
            print(f"  LLM surfaced {len(trends)} trend(s)")
            enqueued = enqueue_trends(supabase, trends)
            print(f"\n  Enqueued {enqueued} high-priority trend action(s)")
            log_operation("trend_agent", "success", f"enqueued {enqueued} trend actions",
                          {"enqueued": enqueued, "trends": trends})
    except Exception as e:
        log_operation("trend_agent", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "Trend Agent Error", str(e), "error")
        raise

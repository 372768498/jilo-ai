# crawler/trend_agent.py
#
# Forward loop — catches a topic while it's hot instead of judging it after.
# Combines three free signals: ingested RSS news (breadth), Hacker News and
# AI subreddits (engagement). The LLM clusters near-duplicate stories and
# surfaces topics that are genuinely surging — by multi-source corroboration
# OR by raw engagement (a 500-point HN story is hot even from one source).
# Qualifying topics enqueue high-priority generate_seo_content, which the
# existing SEO generator consumes ahead of routine GSC work.
#
# Pulls HN/Reddit live, so it isn't bottlenecked by the once-daily RSS crawl
# and can catch intraday surges when run several times a day.
import re
import json
from datetime import datetime, timedelta
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert
import action_queue as aq
import trend_sources

LOOKBACK_HOURS = 48
MIN_SIGNALS = 8            # too little input → no reliable trend read
MIN_SOURCES_PER_TOPIC = 2  # multi-source corroboration path
ENGAGEMENT_THRESHOLD = 150 # OR single-source-but-very-hot path (HN points / Reddit upvotes)
MAX_TOPICS = 3             # cap new high-priority work per run


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _slugify(text):
    s = re.sub(r'[^a-z0-9\s-]', '', text.lower())
    return re.sub(r'[\s-]+', '-', s).strip('-')


def fetch_rss_signals(supabase):
    """Ingested RSS news (engagement unknown → 0)."""
    since = (datetime.utcnow() - timedelta(hours=LOOKBACK_HOURS)).isoformat()
    rows = supabase.table('news').select(
        'title_en, source'
    ).eq('news_type', 'industry_news').gte('published_at', since).order(
        'published_at', desc=True
    ).limit(150).execute()
    return [{'title': r['title_en'], 'source': r.get('source') or 'RSS', 'engagement': 0}
            for r in (rows.data or []) if r.get('title_en')]


def detect_trends(signals):
    """Cluster rewrites and surface topics hot by multi-source OR by engagement."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")

    lines = []
    for s in signals:
        eng = s.get('engagement') or 0
        tag = f"{s['source']}|{eng}pts" if eng else s['source']
        lines.append(f"- [{tag}] {s['title']}")
    block = "\n".join(lines)

    prompt = f"""These are AI signals from the last {LOOKBACK_HOURS} hours. Each is tagged [source|engagement] — engagement is Hacker News points or Reddit upvotes (RSS items have none).

{block}

Cluster near-duplicate rewrites of the same story together. A topic is SURGING if EITHER:
  (a) it appears under {MIN_SOURCES_PER_TOPIC}+ DISTINCT source names, OR
  (b) any single item about it has engagement >= {ENGAGEMENT_THRESHOLD}.

CRITICAL relevance filter — jilo.ai monetizes AI-TOOL content via affiliate links.
Only surface a topic if it maps to a page a tool-shopper would search for, such as:
  "best <category> AI tools", "<tool A> vs <tool B>", "how to use <tool>",
  "<tool/model> review", "<new tool> alternatives".
The keyword MUST name a concrete AI tool, model, or tool category with buyer/usage intent.
REJECT (do not return), regardless of engagement: memes/jokes, celebrity or design stories,
business/finance/politics/regulation news, philosophical "future of AI" takes, and discussion
threads with no specific tool to evaluate.

Return a single JSON object (up to {MAX_TOPICS} topics), each with the EXACT distinct source
names and the peak engagement you saw for it:
{{
  "trends": [
    {{
      "topic": "short human-readable topic",
      "keyword": "the search keyword a content page should target",
      "sources": ["Source A", "Source B"],
      "peak_engagement": <int>,
      "why": "one sentence on why it's worth a page now"
    }}
  ]
}}
If nothing qualifies, return {{"trends": []}}."""

    client = OpenAI(api_key=OPENAI_API_KEY)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You spot real trends and reject noise. Respond with a single valid JSON object only."},
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
        # Verify qualification in code — don't trust the LLM blindly.
        sources = {s.strip().lower() for s in (t.get('sources') or []) if s and s.strip()}
        peak = int(t.get('peak_engagement') or 0)
        qualifies = len(sources) >= MIN_SOURCES_PER_TOPIC or peak >= ENGAGEMENT_THRESHOLD
        if not keyword or not qualifies:
            print(f"  [reject] {keyword or t.get('topic')}: {len(sources)} source(s), {peak} peak engagement")
            continue
        dedup_key = f"seo:{_slugify(keyword)}"
        if aq.enqueue(
            supabase,
            action_type='generate_seo_content',
            payload={'keyword': keyword, 'source': 'trend', 'topic': t.get('topic'),
                     'distinct_sources': len(sources), 'source_names': sorted(sources),
                     'peak_engagement': peak},
            reason=f"Trending ({len(sources)} sources, peak {peak}): {t.get('why') or t.get('topic')}",
            priority='high',
            dedup_key=dedup_key,
        ):
            opened += 1
            print(f"  [TREND high] {keyword}  ({len(sources)} src, {peak} peak)")
        else:
            print(f"  [dedup] {keyword} already queued")
    return opened


if __name__ == "__main__":
    print("Starting trend agent...")
    try:
        supabase = get_supabase()
        signals = fetch_rss_signals(supabase) + trend_sources.gather_engagement_signals()
        print(f"  {len(signals)} total signals (RSS + HN + Reddit)")

        if len(signals) < MIN_SIGNALS:
            print(f"  Too few signals (<{MIN_SIGNALS}); skipping.")
            log_operation("trend_agent", "success", "skipped: too few signals",
                          {"enqueued": 0, "signals": len(signals)})
        else:
            trends = detect_trends(signals)
            print(f"  LLM surfaced {len(trends)} candidate trend(s)")
            enqueued = enqueue_trends(supabase, trends)
            print(f"\n  Enqueued {enqueued} high-priority trend action(s)")
            log_operation("trend_agent", "success", f"enqueued {enqueued} trend actions",
                          {"enqueued": enqueued, "trends": trends})
    except Exception as e:
        log_operation("trend_agent", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "趋势 Agent 出错", str(e), "error")
        raise

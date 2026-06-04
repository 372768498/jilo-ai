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
from collections import defaultdict
from datetime import datetime, timedelta
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert
import action_queue as aq
import trend_sources
from strategy_engine import brand_alternatives_keyword

LOOKBACK_HOURS = 48
MIN_SIGNALS = 8            # too little input → no reliable trend read
MIN_SOURCES_PER_TOPIC = 2  # multi-source corroboration path
ENGAGEMENT_THRESHOLD = 150 # OR single-source-but-very-hot path (HN points / Reddit upvotes)
MAX_TOPICS = 3             # cap new high-priority work per run

CURATED_FALLBACK_TRENDS = [
    {
        'keyword': 'best ai video editor',
        'topic': 'AI video editor buying intent',
        'why': 'GSC already shows demand and it is a monetizable tool-shopper query.',
    },
    {
        'keyword': 'kling ai vs runway gen-3 vs luma dream machine vs sora',
        'topic': 'AI video model comparison',
        'why': 'Video generation model comparisons are recurring high-intent queries.',
    },
    {
        'keyword': 'claude vs chatgpt',
        'topic': 'Claude vs ChatGPT comparison',
        'why': 'Assistant comparison queries have repeat GSC exposure.',
    },
    {
        'keyword': 'best ai writing tools comparison',
        'topic': 'AI writing tools comparison',
        'why': 'Writing-tool comparison intent is evergreen and monetizable.',
    },
]

TOOL_INTENT_TERMS = [
    'best ', ' vs ', 'alternative', 'alternatives', 'review', 'pricing',
    'worth it', 'how to use', 'tutorial', 'tool', 'tools', 'editor',
    'generator', 'software', 'platform', 'app', 'apps',
]
NOISE_TERMS = [
    'traffic surge', 'features impact', 'future of ai', 'regulation',
    'stock', 'earnings', 'policy', 'lawsuit', 'labeling', 'watermark',
    'how to build ai models',
]


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _slugify(text):
    s = re.sub(r'[^a-z0-9\s-]', '', text.lower())
    return re.sub(r'[\s-]+', '-', s).strip('-')


def has_tool_shopper_intent(keyword):
    """Code-level guardrail so hot news does not become bad SEO work."""
    k = (keyword or '').lower().strip()
    if not k:
        return False
    if any(term in k for term in NOISE_TERMS):
        return False
    return any(term in k for term in TOOL_INTENT_TERMS)


# rank5 — GSC breakout queries. The highest-quality demand signal isn't a
# second-hand HN/Reddit guess: it's a query Google has *already started showing
# us for*. We catch the jump (recent 3 days vs prior 3) and enqueue it directly,
# bypassing the LLM community-trend judgment.
GSC_EMERGING_LOOKBACK_DAYS = 6
GSC_EMERGING_MIN_IMPRESSIONS = 5
GSC_EMERGING_POSITION_MAX = 30
GSC_EMERGING_GROWTH = 1.0  # +100% recent vs prior, or any jump from ~zero


def detect_emerging_queries(rows):
    """Pure: search_console_daily rows -> breakout queries. A query qualifies if
    its last-3-day impressions are new (prior window ~0) or grew >=100%, it has
    real recent impressions, and it ranks within POSITION_MAX (we're close
    enough that a dedicated page can win it)."""
    dates = sorted({r['date'] for r in rows if r.get('date')}, reverse=True)
    if len(dates) < 2:
        return []
    recent_dates = set(dates[:3])
    prior_dates = set(dates[3:6])
    agg = defaultdict(lambda: {'recent': 0, 'prior': 0, 'wpos': 0.0, 'impr': 0})
    for r in rows:
        q = (r.get('query') or '').strip()
        if not q:
            continue
        impr = r.get('impressions') or 0
        d = r.get('date')
        if d in recent_dates:
            agg[q]['recent'] += impr
            agg[q]['wpos'] += (r.get('position') or 0) * impr
            agg[q]['impr'] += impr
        elif d in prior_dates:
            agg[q]['prior'] += impr

    emerging = []
    for q, a in agg.items():
        if a['recent'] < GSC_EMERGING_MIN_IMPRESSIONS:
            continue
        pos = a['wpos'] / a['impr'] if a['impr'] else 999
        if pos > GSC_EMERGING_POSITION_MAX:
            continue
        prior = a['prior']
        if prior == 0:
            growth = None
        else:
            growth = (a['recent'] - prior) / prior
            if growth < GSC_EMERGING_GROWTH:
                continue
        emerging.append({'query': q, 'impressions': a['recent'],
                         'position': round(pos, 1),
                         'growth': None if growth is None else round(growth, 2)})
    emerging.sort(key=lambda x: x['impressions'], reverse=True)
    return emerging


def fetch_gsc_emerging_signals(supabase):
    since = (datetime.utcnow() - timedelta(days=GSC_EMERGING_LOOKBACK_DAYS)).strftime('%Y-%m-%d')
    rows = supabase.table('search_console_daily').select(
        'query, impressions, position, date'
    ).gte('date', since).execute()
    return detect_emerging_queries(rows.data or [])


def _gsc_actionable_keyword(query):
    """Turn a GSC breakout query into a keyword worth a page, or None.

    The old guard rejected anything without tool-shopper intent — which threw
    away the most valuable signals: bare competitor-brand queries Google already
    ranks us for (e.g. 'marketmuse' at pos 22). We reframe those into a
    monetizable 'best <brand> alternatives' page (reusing strategy_engine's
    guarded logic, which also skips our own brand). Queries that are neither a
    competitor brand nor tool-shopper intent (our own brand, generic noise) are
    still dropped."""
    raw = (query or '').strip()
    if not raw:
        return None
    reframed = brand_alternatives_keyword(raw)
    if reframed != raw:
        return reframed                 # competitor brand -> alternatives page
    if has_tool_shopper_intent(raw):
        return raw                       # already a buyer query
    return None                          # own brand / generic -> skip


def enqueue_gsc_emerging(supabase, emerging, limit=MAX_TOPICS):
    """Enqueue breakout queries directly as high-priority SEO work — no LLM gate.
    Competitor-brand demand is reframed into alternatives pages; non-actionable
    queries (our own brand, generic) are skipped."""
    opened = 0
    for e in emerging[:limit]:
        keyword = _gsc_actionable_keyword(e.get('query'))
        if not keyword:
            continue
        dedup_key = f"seo:{_slugify(keyword)}"
        if aq.enqueue(
            supabase,
            action_type='generate_seo_content',
            payload={'keyword': keyword, 'source': 'GSC-rising',
                     'impressions': e['impressions'], 'position': e['position'],
                     'growth': e.get('growth')},
            reason=f'GSC breakout: "{keyword}" at {e["impressions"]} impressions, pos {e["position"]}',
            priority='high',
            dedup_key=dedup_key,
        ):
            opened += 1
            print(f"  [GSC-RISING high] {keyword}  ({e['impressions']} impr, pos {e['position']})")
    return opened


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
        if not has_tool_shopper_intent(keyword):
            print(f"  [reject intent] {keyword}: not a tool-shopper query")
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


def enqueue_fallback_trends(supabase, limit=2):
    """
    If live trend sources return no usable topic, keep the forward loop moving
    with known high-intent trend-adjacent queries instead of reporting zero.
    """
    opened = 0
    for item in CURATED_FALLBACK_TRENDS:
        if opened >= limit:
            break
        keyword = item['keyword']
        dedup_key = f"seo:{_slugify(keyword)}"
        if aq.enqueue(
            supabase,
            action_type='generate_seo_content',
            payload={
                'keyword': keyword,
                'source': 'trend_fallback',
                'topic': item['topic'],
                'fallback_reason': item['why'],
            },
            reason=f"Trend fallback: {item['why']}",
            priority='medium',
            dedup_key=dedup_key,
        ):
            opened += 1
            print(f"  [FALLBACK trend] {keyword}")
        else:
            print(f"  [fallback dedup] {keyword}")
    return opened


if __name__ == "__main__":
    print("Starting trend agent...")
    try:
        supabase = get_supabase()

        # rank5: first-party breakout demand goes straight to the queue, ahead of
        # (and independent of) the LLM community-trend path.
        emerging = fetch_gsc_emerging_signals(supabase)
        gsc_enqueued = enqueue_gsc_emerging(supabase, emerging)
        print(f"  GSC-rising: {len(emerging)} emerging, {gsc_enqueued} enqueued")

        signals = fetch_rss_signals(supabase) + trend_sources.gather_engagement_signals()
        print(f"  {len(signals)} total signals (RSS + HN + Reddit + PH + GitHub)")

        if len(signals) < MIN_SIGNALS:
            print(f"  Too few signals (<{MIN_SIGNALS}); skipping LLM path.")
            enqueued = gsc_enqueued
            log_operation("trend_agent", "success", "LLM path skipped: too few signals",
                          {"enqueued": enqueued, "gsc_rising": gsc_enqueued, "signals": len(signals)})
        else:
            trends = detect_trends(signals)
            print(f"  LLM surfaced {len(trends)} candidate trend(s)")
            enqueued = enqueue_trends(supabase, trends)
            if enqueued == 0:
                enqueued += enqueue_fallback_trends(supabase)
            enqueued += gsc_enqueued
            print(f"\n  Enqueued {enqueued} high-priority trend action(s)")
            log_operation("trend_agent", "success", f"enqueued {enqueued} trend actions",
                          {"enqueued": enqueued, "gsc_rising": gsc_enqueued, "trends": trends})
    except Exception as e:
        log_operation("trend_agent", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "趋势 Agent 出错", str(e), "error")
        raise

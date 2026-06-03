# crawler/strategy_engine.py
import re
from collections import defaultdict
from datetime import datetime, timedelta
from supabase import create_client
import growth_state
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _slugify(text):
    s = re.sub(r'[^a-z0-9\s-]', '', text.lower())
    return re.sub(r'[\s-]+', '-', s).strip('-')


def _clean_tool_name(text):
    """Extract the actual tool name from noisy GSC comparison queries."""
    text = (text or '').lower().strip()
    text = re.split(r'[:?|\-–—]', text, maxsplit=1)[0]
    text = re.sub(r'\b(202[0-9]|which|wins?|better|best|review|comparison|compare)\b', '', text)
    text = re.sub(r'\s+', ' ', text).strip(' "\'.,')
    return text


def parse_vs_query(query):
    """Return (tool_a, tool_b) only for clean two-tool comparison intent."""
    q = (query or '').lower().strip()
    if ' vs ' not in q:
        return None
    left, right = q.split(' vs ', 1)
    tool_a = _clean_tool_name(left)
    tool_b = _clean_tool_name(right)
    if not tool_a or not tool_b:
        return None
    if len(tool_a.split()) > 4 or len(tool_b.split()) > 4:
        return None
    return tool_a, tool_b


def build_dedup_key(action):
    """Stable, normalized key so the same logical action is never enqueued twice."""
    t = action['type']
    if t == 'generate_seo_content':
        if action.get('mode') == 'aeo':
            return f"aeo:{_slugify(action['keyword'])}"
        if action.get('mode') == 'rewrite':
            return f"rewrite:{action['slug']}"
        if action.get('mode') == 'hub':
            return f"hub:{action['category_slug']}"
        return f"seo:{_slugify(action['keyword'])}"
    if t == 'generate_comparison':
        a, b = sorted([_slugify(action['tool_a']), _slugify(action['tool_b'])])
        return f"compare:{a}|{b}"
    if t == 'flag_for_review':
        return f"flag:{_slugify(action['page'])}"
    raise ValueError(f"Unknown action type: {t}")


# Rewrite thresholds — a page that's had real search exposure but isn't winning.
# Tune once page_performance_lookback has accumulated real snapshots.
REWRITE_MIN_AGE = 7            # only judge pages that have had a fair chance
REWRITE_MIN_IMPRESSIONS = 30   # Google is showing it, so ranking is the issue
REWRITE_POSITION_FLOOR = 20    # ranking worse than ~page 2
REWRITE_CTR_FLOOR = 0.01       # shown a lot, almost nobody clicks
REWRITE_COOLDOWN_DAYS = 7      # don't re-rewrite the same page in a tight loop


def check_underperforming_pages():
    """
    Read page_performance_lookback and queue rewrites for pages that have had
    real search exposure but rank poorly or get no clicks. Pages with too few
    impressions are left alone — they haven't had a fair chance yet, and a
    rewrite wouldn't fix an indexing/age problem.
    """
    supabase = get_supabase()

    rows = supabase.table('page_performance_lookback').select(
        'content_type, slug, age_bucket, position, ctr, impressions'
    ).gte('age_bucket', REWRITE_MIN_AGE).execute()

    # Keep the most mature snapshot per slug.
    by_slug = {}
    for r in (rows.data or []):
        cur = by_slug.get(r['slug'])
        if not cur or r['age_bucket'] > cur['age_bucket']:
            by_slug[r['slug']] = r

    cutoff = (datetime.utcnow() - timedelta(days=REWRITE_COOLDOWN_DAYS)).isoformat()
    actions = []
    for slug, snap in by_slug.items():
        impr = snap.get('impressions') or 0
        if impr < REWRITE_MIN_IMPRESSIONS:
            continue
        pos = snap.get('position')
        ctr = snap.get('ctr') or 0
        underperforming = (pos is not None and pos > REWRITE_POSITION_FLOOR) or (ctr < REWRITE_CTR_FLOOR)
        if not underperforming:
            continue

        # Cooldown: skip if we already rewrote this page recently.
        recent = supabase.table('action_queue').select('id').eq(
            'dedup_key', f'rewrite:{slug}'
        ).eq('status', 'done').gte('completed_at', cutoff).execute()
        if recent.data:
            continue

        actions.append({
            'type': 'generate_seo_content',
            'mode': 'rewrite',
            'slug': slug,
            'content_type': snap['content_type'],
            'keyword': slug.replace('-', ' '),
            'reason': f"{snap['age_bucket']} 天龄表现不佳：排名 {pos}、点击率 {ctr:.1%}、曝光 {impr}，进队重写",
            'priority': 'medium',
        })

    return actions


# Category-level queries are owned by the corresponding hub (/c/<slug>), not
# by standalone /news articles — this is what kills the "best X" cannibalization.
CATEGORY_QUERY_TERMS = {
    'video': ['video'],
    'image': ['image', 'photo', 'logo', 'avatar', 'art generator'],
    'writing': ['writing', 'write', 'copywriting', 'essay', 'paraphras'],
    'code': ['coding', 'code', 'developer', 'programming'],
    'audio': ['audio', 'music', 'voice', 'speech', 'podcast', 'transcription'],
    'chat': ['chatbot', 'chat assistant'],
    'marketing': ['marketing', 'seo tool', 'ads', 'social media'],
    'design': ['design', 'presentation', 'slides', 'website builder'],
    'productivity': ['productivity', 'ai agent', 'automation', 'note-taking', 'workflow'],
}

HUB_MIN_TOOLS = 3  # a hub needs enough tools to be worth an intro


def route_to_hub(query):
    """Return the category slug a query belongs to, or None. Category-level
    queries are served by the hub, so they shouldn't spawn /news articles."""
    q = query.lower()
    if 'video' in q and any(term in q for term in ['editor', 'editing software', 'editing tools']):
        return None
    for slug, terms in CATEGORY_QUERY_TERMS.items():
        if any(term in q for term in terms):
            return slug
    return None


def check_empty_hubs():
    """Category hubs with enough tools but no intro yet → generate SEO intro
    into categories.description. This is the engine feeding the hubs."""
    supabase = get_supabase()
    cats = supabase.table('categories').select('slug, name_en, description_en').execute()
    tools = supabase.table('tools').select('category_canonical').eq('status', 'published').execute()
    counts = defaultdict(int)
    for t in (tools.data or []):
        if t.get('category_canonical'):
            counts[t['category_canonical']] += 1

    actions = []
    for c in (cats.data or []):
        slug = c['slug']
        if counts.get(slug, 0) < HUB_MIN_TOOLS:
            continue
        if (c.get('description_en') or '').strip():
            continue  # already has an intro
        actions.append({
            'type': 'generate_seo_content',
            'mode': 'hub',
            'category_slug': slug,
            'keyword': f"best {c['name_en']} AI tools",
            'reason': f"分类 Hub /c/{slug} 有 {counts[slug]} 个工具但缺简介，生成 SEO 引言",
            'priority': 'high',
        })
    return actions


# Keyword-opportunity thresholds. The old rule ("improved from 10+ into 5-10")
# never fires on a young site whose queries all sit at position 40-90, so the
# SEO generator starved. Instead: target queries with real demand that we
# already rank for — but too low — and don't yet have a dedicated page.
OPP_MIN_IMPRESSIONS = 5    # confirmed demand (top queries here have 6-27)
OPP_POS_MIN = 11           # not already top-10 (those are winning, leave them)
OPP_POS_MAX = 80           # ranking exists but poor; beyond this it's noise
OPP_MAX_PER_RUN = 10       # cap new evergreen targets per run

FORCED_AEO_QUERIES = [
    {
        'keyword': 'best ai video editor',
        'reason': 'Forced growth query: high-intent video-editor demand already appears in GSC and needs an AEO answer page',
        'priority': 'high',
    },
    {
        'keyword': 'best ai video editing tools',
        'reason': 'Forced growth query: video editing tool shoppers need a citeable answer page',
        'priority': 'high',
    },
    {
        'keyword': 'kling ai vs runway gen-3 vs luma dream machine vs sora',
        'reason': 'Forced growth query: multi-tool video model comparison is better served as an AEO decision page',
        'priority': 'high',
    },
]

FORCED_COMPARE_QUERIES = [
    {
        'tool_a': 'Claude',
        'tool_b': 'ChatGPT',
        'reason': 'Forced growth query: claude vs chatgpt has GSC exposure and needs a dedicated comparison page',
        'priority': 'high',
    },
    {
        'tool_a': 'HeyGen',
        'tool_b': 'Synthesia',
        'reason': 'Forced growth query: heygen vs synthesia has GSC exposure and needs a dedicated comparison page',
        'priority': 'medium',
    },
]


def _opp_priority(impressions):
    if impressions >= 20:
        return 'high'
    if impressions >= 10:
        return 'medium'
    return 'low'


def check_forced_growth_queries():
    """Seed known high-intent growth targets until the queue has handled them."""
    actions = []
    for item in FORCED_AEO_QUERIES:
        actions.append({
            'type': 'generate_seo_content',
            'mode': 'aeo',
            'keyword': item['keyword'],
            'reason': item['reason'],
            'priority': item['priority'],
            'source': 'forced_growth',
        })
    for item in FORCED_COMPARE_QUERIES:
        actions.append({
            'type': 'generate_comparison',
            'tool_a': item['tool_a'],
            'tool_b': item['tool_b'],
            'reason': item['reason'],
            'priority': item['priority'],
            'source': 'forced_growth',
        })
    return actions


def check_keyword_opportunities():
    """
    Find queries with real search demand that rank poorly and have no dedicated
    page yet — the highest-leverage evergreen targets. Google already surfaces
    us for them; we just rank too low. Pages we've already made are skipped
    here (improving those is the lookback-driven rewrite path's job).
    """
    supabase = get_supabase()
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    rows = supabase.table('search_console_daily').select(
        'query, impressions, clicks, position'
    ).gte('date', week_ago).execute()

    # Aggregate per query: total impressions/clicks, impression-weighted position.
    agg = defaultdict(lambda: {'impr': 0, 'clicks': 0, 'wpos': 0.0})
    for r in (rows.data or []):
        q = r['query']
        impr = r.get('impressions') or 0
        agg[q]['impr'] += impr
        agg[q]['clicks'] += r.get('clicks') or 0
        agg[q]['wpos'] += (r.get('position') or 0) * impr

    candidates = []
    for q, a in agg.items():
        # 'X vs Y' queries are the comparison generator's job — don't double up.
        if ' vs ' in q.lower():
            continue
        # Category-level queries belong to the hub, not a standalone article.
        if route_to_hub(q):
            continue
        if a['impr'] < OPP_MIN_IMPRESSIONS:
            continue
        avg_pos = a['wpos'] / a['impr'] if a['impr'] else 999
        if not (OPP_POS_MIN <= avg_pos <= OPP_POS_MAX):
            continue
        candidates.append((q, a['impr'], avg_pos))

    # Strongest demand first.
    candidates.sort(key=lambda x: -x[1])

    actions = []
    for query, impr, avg_pos in candidates[:OPP_MAX_PER_RUN]:
        dedup_key = f"seo:{_slugify(query)}"
        # Skip if we already made (or are making) a page for this keyword.
        existing = supabase.table('action_queue').select('id').eq(
            'dedup_key', dedup_key
        ).in_('status', ['pending', 'in_progress', 'done']).execute()
        if existing.data:
            continue
        actions.append({
            'type': 'generate_seo_content',
            'reason': f'"{query}" 有 {impr} 次曝光但排名第 {avg_pos:.0f}，且无专属页 — 做深 evergreen',
            'keyword': query,
            'priority': _opp_priority(impr),
        })

    return actions


MONETIZATION_MIN_CLICKS = 5
MONETIZATION_MAX_PER_RUN = 5


def _monetization_actions_from_tools(tools, min_clicks=MONETIZATION_MIN_CLICKS, limit=MONETIZATION_MAX_PER_RUN):
    """Pure: tools with an affiliate link AND real outbound clicks deserve a
    dedicated citeable landing page so the traffic actually converts (rank2 —
    wires monetization into content production instead of leaving it as a
    human-only flag)."""
    actions = []
    for t in tools:
        if len(actions) >= limit:
            break
        if not (t.get('affiliate_url') or '').strip():
            continue
        if (t.get('click_count') or 0) < min_clicks:
            continue
        name = t.get('name_en') or t.get('slug') or 'tool'
        actions.append({
            'type': 'generate_seo_content',
            'mode': 'aeo',
            'keyword': f"{name} review",
            'reason': f"变现机会：{name} 有联盟链接且 {t.get('click_count') or 0} 次出站点击，做可引用落地页承接转化",
            'priority': 'high',
            'source': 'monetization',
        })
    return actions


def check_monetization_opportunities():
    supabase = get_supabase()
    tools = supabase.table('tools').select(
        'slug, name_en, category, click_count, affiliate_url'
    ).eq('status', 'published').order('click_count', desc=True).limit(50).execute()
    return _monetization_actions_from_tools(tools.data or [])


def check_vs_queries_without_articles():
    """Find 'vs' queries with no corresponding compare article."""
    supabase = get_supabase()
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    vs_queries = supabase.table('search_console_daily').select(
        'query, impressions'
    ).gte('date', week_ago).ilike('query', '%vs%').order(
        'impressions', desc=True
    ).limit(10).execute()

    # Aggregate impressions by clean two-tool query. Ignore noisy one-off
    # article titles such as "figma vs adobe firefly: which ... wins in 2025".
    query_impressions = defaultdict(int)
    for q in (vs_queries.data or []):
        q_lower = q['query'].lower()
        if parse_vs_query(q_lower):
            query_impressions[q_lower] += q['impressions']

    actions = []
    for query, total_impressions in sorted(query_impressions.items(), key=lambda x: -x[1])[:10]:
        if total_impressions < 3:
            continue
        pair = parse_vs_query(query)
        if not pair:
            continue
        tool_a, tool_b = pair

        slug_guess = f"{tool_a}-vs-{tool_b}".replace(' ', '-')
        existing = supabase.table('compare_articles').select('id').ilike('slug', f'%{slug_guess}%').execute()

        if not existing.data:
            actions.append({
                'type': 'generate_comparison',
                'reason': f'搜索词 "{query}" 有 {total_impressions} 次曝光但还没有干净的对比页',
                'tool_a': tool_a,
                'tool_b': tool_b,
                'priority': 'medium',
            })

    return actions


def _slug_from_page(page):
    path = (page or '').split('?', 1)[0].rstrip('/')
    parts = [p for p in path.split('/') if p]
    if len(parts) < 3:
        return None
    if parts[-2] in ('news', 'answers'):
        return parts[-1]
    return None


def check_gsc_page_rewrite_opportunities():
    """
    Queue rewrites from direct GSC evidence, not only age-bucket lookback.
    Young sites need this because 7-day/30-impression thresholds starve rewrites.
    """
    supabase = get_supabase()
    since = (datetime.utcnow() - timedelta(days=14)).strftime('%Y-%m-%d')
    rows = supabase.table('search_console_daily').select(
        'query, page, impressions, clicks, position'
    ).gte('date', since).execute()

    by_slug = defaultdict(lambda: {'impr': 0, 'clicks': 0, 'wpos': 0.0, 'queries': defaultdict(int)})
    for row in (rows.data or []):
        slug = _slug_from_page(row.get('page'))
        if not slug:
            continue
        impressions = row.get('impressions') or 0
        if impressions <= 0:
            continue
        by_slug[slug]['impr'] += impressions
        by_slug[slug]['clicks'] += row.get('clicks') or 0
        by_slug[slug]['wpos'] += (row.get('position') or 0) * impressions
        by_slug[slug]['queries'][row.get('query') or slug.replace('-', ' ')] += impressions

    actions = []
    cutoff = (datetime.utcnow() - timedelta(days=REWRITE_COOLDOWN_DAYS)).isoformat()
    for slug, data in by_slug.items():
        impressions = data['impr']
        if impressions < 3:
            continue
        position = data['wpos'] / impressions if impressions else 999
        ctr = data['clicks'] / impressions if impressions else 0.0
        if not (data['clicks'] == 0 and (position >= 25 or impressions >= 5)):
            continue

        recent = supabase.table('action_queue').select('id').eq(
            'dedup_key', f'rewrite:{slug}'
        ).in_('status', ['pending', 'in_progress', 'done']).gte('updated_at', cutoff).execute()
        if recent.data:
            continue

        top_query = max(data['queries'].items(), key=lambda x: x[1])[0]
        actions.append({
            'type': 'generate_seo_content',
            'mode': 'rewrite',
            'slug': slug,
            'content_type': 'seo_article',
            'keyword': top_query,
            'reason': f'GSC rewrite: /news/{slug} has {impressions} impressions, pos {position:.1f}, CTR {ctr:.1%}; refresh for "{top_query}"',
            'priority': 'high' if impressions >= 10 else 'medium',
        })
    return actions[:10]


def check_high_bounce_pages_legacy():
    """Legacy implementation kept only for audit; runtime uses check_high_bounce_pages below."""
    supabase = get_supabase()
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    # Fetch raw rows
    raw = supabase.table('analytics_daily').select(
        'page_path, bounce_rate, pageviews'
    ).gte('date', week_ago).execute()

    # Aggregate in Python
    page_bounce = defaultdict(list)
    page_views = defaultdict(int)
    for r in (raw.data or []):
        page_bounce[r['page_path']].append(r['bounce_rate'])
        page_views[r['page_path']] += r['pageviews']

    actions = []
    for page_path, bounce_rates in page_bounce.items():
        if page_views[page_path] < 10:
            continue
        avg_bounce = sum(bounce_rates) / len(bounce_rates)
        if avg_bounce > 0.8:
            actions.append({
                'type': 'flag_for_review',
                'reason': f'页面 {page_path} 跳出率高达 {avg_bounce:.0%}，需排查',
                'page': page_path,
                'priority': 'low',
            })

    return actions


def check_high_bounce_pages():
    """Turn high-bounce pages into automatic queue work where safe."""
    supabase = get_supabase()
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    raw = supabase.table('analytics_daily').select(
        'page_path, bounce_rate, pageviews'
    ).gte('date', week_ago).execute()

    page_bounce = defaultdict(list)
    page_views = defaultdict(int)
    for r in (raw.data or []):
        page_bounce[r['page_path']].append(r['bounce_rate'])
        page_views[r['page_path']] += r['pageviews']

    actions = []
    for page_path, bounce_rates in page_bounce.items():
        if page_views[page_path] < 10:
            continue
        avg_bounce = sum(bounce_rates) / len(bounce_rates)
        if avg_bounce <= 0.8:
            continue
        if page_path.rstrip('/') in ('/zh/tools', '/en/tools'):
            locale = 'zh' if page_path.startswith('/zh/') else 'en'
            actions.append({
                'type': 'generate_seo_content',
                'mode': 'aeo',
                'keyword': 'best ai tools directory' if locale == 'en' else 'best ai tools for Chinese users',
                'source': 'high_bounce_tools_index',
                'page': page_path,
                'reason': f'{page_path} bounce rate is {avg_bounce:.0%}; create a citeable tools-directory answer page and route tool shoppers into deeper pages',
                'priority': 'high',
            })
            continue
        actions.append({
            'type': 'flag_for_review',
            'reason': f'High bounce page {page_path}: {avg_bounce:.0%}; needs manual UX review',
            'page': page_path,
            'priority': 'low',
        })

    return actions


def filter_actions_for_health(actions, verdict, blockers):
    """rank4: gate strategy output on the autonomy guardian's last verdict.

    Under a degraded verdict we stop producing NEW content and keep only
    rewrites — clear the backlog before adding to it. A seo_backlog blocker
    additionally drops new SEO even if the overall verdict is healthier.
    Mirrors traffic_growth_agent.apply_verdict_gate so both producers freeze
    the same way (invariant I2 — the VERDICT_KEY write changes behavior here).
    """
    degraded = isinstance(verdict, str) and verdict.startswith('degraded')
    blockers = blockers or []
    kept = []
    for a in actions:
        is_rewrite = a.get('mode') == 'rewrite'
        is_new_content = a['type'] in ('generate_seo_content', 'generate_comparison') and not is_rewrite
        if degraded and is_new_content:
            continue
        if 'seo_backlog' in blockers and a['type'] == 'generate_seo_content' and not is_rewrite:
            continue
        if 'compare_backlog' in blockers and a['type'] == 'generate_comparison':
            continue
        kept.append(a)
    return kept


def enqueue_action(supabase, action, source_report_id):
    """
    Upsert action into action_queue keyed by dedup_key.
    If an open row (pending|in_progress) already exists for the same logical
    action, the insert is a no-op so we never queue the same work twice.
    Returns True if a new row was created, False if already queued.
    """
    dedup_key = build_dedup_key(action)
    existing = supabase.table('action_queue').select('id, status').eq(
        'dedup_key', dedup_key
    ).in_('status', ['pending', 'in_progress']).execute()
    if existing.data:
        return False

    payload = {k: v for k, v in action.items() if k not in ('type', 'priority', 'reason')}
    supabase.table('action_queue').insert({
        'action_type': action['type'],
        'payload': payload,
        'reason': action.get('reason'),
        'priority': action.get('priority', 'medium'),
        'dedup_key': dedup_key,
        'source_report_id': source_report_id,
    }).execute()
    return True


def execute_actions(actions):
    """Persist strategy decisions: write history to strategy_reports AND emit to action_queue."""
    supabase = get_supabase()
    today = datetime.utcnow().strftime('%Y-%m-%d')

    # 1. Strategy report (audit trail, human-readable)
    existing = supabase.table('strategy_reports').select('id').eq(
        'report_date', today
    ).eq('report_type', 'daily').execute()

    if existing.data:
        report_id = existing.data[0]['id']
        supabase.table('strategy_reports').update({
            'actions_taken': actions,
            'content': {'action_count': len(actions)},
        }).eq('id', report_id).execute()
    else:
        ins = supabase.table('strategy_reports').insert({
            'report_date': today,
            'report_type': 'daily',
            'actions_taken': actions,
            'content': {'action_count': len(actions)},
        }).execute()
        report_id = ins.data[0]['id'] if ins.data else None

    # 2. Action queue (the bus that executors consume)
    enqueued = 0
    skipped = 0
    for action in actions:
        if enqueue_action(supabase, action, report_id):
            enqueued += 1
            print(f"  [ENQUEUE {action['priority'].upper()}] {action['type']}: {action['reason']}")
        else:
            skipped += 1
            print(f"  [DEDUP    {action['priority'].upper()}] {action['type']}: {action['reason']}")

    print(f"\n  Enqueued {enqueued}, deduped {skipped}")
    return enqueued


if __name__ == "__main__":
    print("Starting L2 strategy engine...")
    try:
        # Turn-head read of the shared decision state (G0 foundation). Logged for
        # observability now; rank4 turns the verdict into quota gating and rank2
        # adds monetization-driven actions keyed off this same state.
        state = growth_state.get_verdict(get_supabase())
        print(f"  growth_state: verdict={state['verdict']} blockers={state['blockers']}")

        all_actions = []
        all_actions.extend(check_forced_growth_queries())
        all_actions.extend(check_empty_hubs())
        all_actions.extend(check_keyword_opportunities())
        all_actions.extend(check_monetization_opportunities())
        all_actions.extend(check_vs_queries_without_articles())
        all_actions.extend(check_high_bounce_pages())
        all_actions.extend(check_underperforming_pages())
        all_actions.extend(check_gsc_page_rewrite_opportunities())

        # rank4: freeze new content under a degraded verdict, keep rewrites.
        before = len(all_actions)
        all_actions = filter_actions_for_health(all_actions, state['verdict'], state['blockers'])
        if len(all_actions) != before:
            print(f"  health gate ({state['verdict']}): {before} -> {len(all_actions)} actions")

        print(f"\nFound {len(all_actions)} actions:")
        enqueued = execute_actions(all_actions)

        log_operation("strategy_engine", "success", f"Enqueued {enqueued} of {len(all_actions)} actions", {
            "found": len(all_actions),
            "enqueued": enqueued,
            "actions": all_actions,
        })
    except Exception as e:
        log_operation("strategy_engine", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "策略引擎出错", str(e), "error")
        raise

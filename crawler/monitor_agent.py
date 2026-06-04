# crawler/monitor_agent.py
#
# Monitoring layer — watches the system's own state and surfaces fixable
# problems into action_queue as flag_for_review items. Unlike daily_report,
# which prints an ephemeral snapshot to Feishu, these flags are persistent,
# deduplicated, and auto-resolved once the underlying gap closes.
#
# v1 detector: monetization gap — published tools receiving outbound clicks
# but with no affiliate link. Every such tool leaks revenue.
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert
import action_queue as aq
import affiliate_registry as ar
import monetization_kit as mk

# Below this click count an affiliate application isn't worth the effort yet.
MIN_CLICKS = 5
MAX_ACTIVE_MONETIZATION_FLAGS = 25

# rank12 — a non-empty affiliate_url is NOT proof of monetization. A bare
# official URL pasted into the field leaks revenue while looking resolved
# (invariant I5: resolve must mean "actually tracked", not "field non-empty").
# A real affiliate link carries one of these tracking markers.
AFFILIATE_MARKERS = (
    'ref=', 'aff=', 'aff_id', 'affiliate', 'utm_', 'partner', 'fpr=', 'via=',
    'tap_a', 'pscd', 'impact', 'sjv.io', 'partnerstack', 'sovrn', 'cj.com',
    'shareasale', 'avantlink', 'clickbank', 'sld=', 'irclickid', 'gid=',
)


def is_valid_affiliate_url(url):
    """True only if the URL is an http(s) link carrying an affiliate tracking
    marker. A generic 'https://tool.com' returns False — it earns nothing."""
    u = (url or '').strip().lower()
    if not u.startswith(('http://', 'https://')):
        return False
    return any(marker in u for marker in AFFILIATE_MARKERS)


def _priority(clicks):
    if clicks >= 20:
        return 'high'
    if clicks >= 10:
        return 'medium'
    return 'low'


def check_monetization_gaps(supabase):
    """
    For each published tool:
      - has affiliate link  → auto-resolve any open monetization flag (gap closed)
      - clicks >= MIN_CLICKS, no affiliate → open/refresh a dedup'd flag
    Returns (opened, resolved).
    """
    tools = supabase.table('tools').select(
        'slug, name_en, click_count, affiliate_url, category, official_url'
    ).eq('status', 'published').execute()

    # Rough monthly PV for the application pitch (best-effort).
    site_pv_monthly = None
    try:
        recent = supabase.table('analytics_site_daily').select(
            'total_pageviews'
        ).order('date', desc=True).limit(30).execute()
        pvs = [r.get('total_pageviews') or 0 for r in (recent.data or [])]
        if pvs:
            site_pv_monthly = int(round(sum(pvs) / len(pvs) * 30))
    except Exception:
        pass

    # Tools the registry marks as having no affiliate program (e.g. OpenAI) can
    # never be monetized via affiliate — flagging them forever is pure noise.
    # Exclude them from candidates and auto-resolve any open flag below.
    registry = ar.load_registry()
    no_program = ar.no_program_slugs(registry)

    opened = 0
    resolved = 0
    candidates = []
    for t in (tools.data or []):
        clicks = t.get('click_count') or 0
        if t['slug'] in no_program:
            continue
        if not is_valid_affiliate_url(t.get('affiliate_url')) and clicks >= MIN_CLICKS:
            candidates.append(t)
    # rank2: order leaks by expected revenue (ROI), not raw click volume, so the
    # human's limited application time goes to the highest-earning gaps first.
    candidates.sort(key=lambda t: mk.roi_score(t), reverse=True)
    active_slugs = {t['slug'] for t in candidates[:MAX_ACTIVE_MONETIZATION_FLAGS]}
    tools_by_slug = {t['slug']: t for t in (tools.data or [])}

    for t in (tools.data or []):
        slug = t['slug']
        clicks = t.get('click_count') or 0
        dedup_key = f"flag:monetization:{slug}"
        raw = (t.get('affiliate_url') or '').strip()

        if slug in no_program:
            # No affiliate program exists — close any stale flag and never reopen.
            resolved += aq.resolve(supabase, dedup_key,
                                   {'resolved': 'no affiliate program (registry)'})
            continue

        if is_valid_affiliate_url(raw):
            resolved += aq.resolve(supabase, dedup_key, {'resolved': 'valid tracked affiliate_url'})
            continue

        if clicks >= MIN_CLICKS and slug in active_slugs:
            name = t.get('name_en') or slug
            # rank2: ROI-based priority + a ready-to-submit application pack so
            # the human just reviews and applies (the only step that can't be auto).
            roi = mk.roi_score(t)
            priority = mk.priority_from_roi(roi)
            pack = mk.build_application_pack(tools_by_slug.get(slug, t), site_pv_monthly)
            # rank12: a present-but-untracked link is a different, sneakier leak
            # than a missing one — surface it as its own subtype so it gets fixed
            # rather than silently counted as monetized.
            broken = bool(raw)
            subtype = 'affiliate_link_broken' if broken else 'monetization_gap'
            reason = (
                f"{name}: affiliate_url 不含 tracking 参数（{raw[:60]}），点击不计佣金 — 修正联盟链接"
                if broken else
                f"{name}: {clicks} 出站点击 / 预估漏钱 ${roi} — 申请联盟（材料已备好）"
            )
            if aq.enqueue(
                supabase,
                action_type='flag_for_review',
                payload={'subtype': subtype, 'slug': slug, 'name': name,
                         'click_count': clicks, 'affiliate_url': raw or None,
                         'roi': roi, 'application_pack': pack},
                reason=reason,
                priority=priority,
                dedup_key=dedup_key,
            ):
                opened += 1
                print(f"  [FLAG {priority.upper()}] {name}: {clicks} clicks, ${roi} ROI, {subtype}")
        elif clicks >= MIN_CLICKS:
            resolved += aq.resolve(
                supabase,
                dedup_key,
                {
                    'resolved': 'below active monetization priority window',
                    'click_count': clicks,
                    'active_limit': MAX_ACTIVE_MONETIZATION_FLAGS,
                },
            )

    return opened, resolved


if __name__ == "__main__":
    print("Starting monitor agent...")
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        opened, resolved = check_monetization_gaps(supabase)
        print(f"\n  Monetization gaps: opened {opened}, auto-resolved {resolved}")
        log_operation("monitor_agent", "success",
                      f"monetization gaps opened={opened} resolved={resolved}",
                      {"opened": opened, "resolved": resolved})
    except Exception as e:
        log_operation("monitor_agent", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "监控 Agent 出错", str(e), "error")
        raise

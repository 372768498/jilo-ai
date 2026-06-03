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
        'slug, name_en, click_count, affiliate_url'
    ).eq('status', 'published').execute()

    opened = 0
    resolved = 0
    candidates = []
    for t in (tools.data or []):
        clicks = t.get('click_count') or 0
        if not is_valid_affiliate_url(t.get('affiliate_url')) and clicks >= MIN_CLICKS:
            candidates.append(t)
    candidates.sort(key=lambda t: t.get('click_count') or 0, reverse=True)
    active_slugs = {t['slug'] for t in candidates[:MAX_ACTIVE_MONETIZATION_FLAGS]}

    for t in (tools.data or []):
        slug = t['slug']
        clicks = t.get('click_count') or 0
        dedup_key = f"flag:monetization:{slug}"
        raw = (t.get('affiliate_url') or '').strip()

        if is_valid_affiliate_url(raw):
            resolved += aq.resolve(supabase, dedup_key, {'resolved': 'valid tracked affiliate_url'})
            continue

        if clicks >= MIN_CLICKS and slug in active_slugs:
            name = t.get('name_en') or slug
            priority = _priority(clicks)
            # rank12: a present-but-untracked link is a different, sneakier leak
            # than a missing one — surface it as its own subtype so it gets fixed
            # rather than silently counted as monetized.
            broken = bool(raw)
            subtype = 'affiliate_link_broken' if broken else 'monetization_gap'
            reason = (
                f"{name}: affiliate_url 不含 tracking 参数（{raw[:60]}），点击不计佣金 — 修正联盟链接"
                if broken else
                f"{name}: {clicks} outbound clicks, no affiliate link — apply for affiliate program"
            )
            if aq.enqueue(
                supabase,
                action_type='flag_for_review',
                payload={'subtype': subtype, 'slug': slug, 'name': name,
                         'click_count': clicks, 'affiliate_url': raw or None},
                reason=reason,
                priority=priority,
                dedup_key=dedup_key,
            ):
                opened += 1
                print(f"  [FLAG {priority.upper()}] {name}: {clicks} clicks, {subtype}")
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

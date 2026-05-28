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
    for t in (tools.data or []):
        slug = t['slug']
        clicks = t.get('click_count') or 0
        dedup_key = f"flag:monetization:{slug}"
        has_affiliate = bool((t.get('affiliate_url') or '').strip())

        if has_affiliate:
            resolved += aq.resolve(supabase, dedup_key, {'resolved': 'affiliate_url added'})
            continue

        if clicks >= MIN_CLICKS:
            name = t.get('name_en') or slug
            priority = _priority(clicks)
            if aq.enqueue(
                supabase,
                action_type='flag_for_review',
                payload={'subtype': 'monetization_gap', 'slug': slug,
                         'name': name, 'click_count': clicks},
                reason=f"{name}: {clicks} outbound clicks, no affiliate link — apply for affiliate program",
                priority=priority,
                dedup_key=dedup_key,
            ):
                opened += 1
                print(f"  [FLAG {priority.upper()}] {name}: {clicks} clicks, no affiliate")

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
            send_feishu_alert(FEISHU_WEBHOOK_URL, "Monitor Agent Error", str(e), "error")
        raise

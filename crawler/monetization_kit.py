"""
monetization_kit — the half-automation that turns a "this tool leaks money"
signal into a ready-to-submit affiliate application, and ranks leaks by ROI
instead of raw click volume.

The final step (apply on the program's site + paste the tracking link) is
inherently human. Everything up to it is automated here:
  - rank gaps by expected revenue (clicks x category EPC), not click count
  - generate a complete application pack (pitch + site stats + where to apply)
  - (auto-close on fill is handled in monitor_agent once a tracked URL appears)

EPC values are rough, tunable seeds — their job is to order the queue toward
revenue. Adjust CATEGORY_EPC as real affiliate data comes in.
"""
SITE = "https://www.jilo.ai"

# Rough earnings-per-outbound-click by tool category (USD).
CATEGORY_EPC = {
    'Video': 1.2, 'Image': 0.8, 'Writing': 1.0, 'Coding': 1.5, 'Developer': 1.5,
    'Audio': 1.0, 'Business': 1.3, 'Marketing': 1.3, 'Design': 0.9,
    'Chatbot': 0.7, 'Productivity': 1.1,
}
DEFAULT_EPC = 0.8


def category_epc(category):
    return CATEGORY_EPC.get((category or '').strip(), DEFAULT_EPC)


def roi_score(tool):
    """Expected revenue at risk = outbound clicks x category EPC."""
    return round((tool.get('click_count') or 0) * category_epc(tool.get('category')), 2)


def priority_from_roi(roi):
    if roi >= 20:
        return 'high'
    if roi >= 8:
        return 'medium'
    return 'low'


def suggest_networks(tool):
    """Best-effort hints for where to apply — the human verifies the real one."""
    return [
        '工具官网 footer 找 "Affiliate" / "Partners" / "Referral"',
        'Impact.com', 'PartnerStack', 'FirstPromoter', 'Rewardful',
    ]


def build_application_pack(tool, site_pv_monthly=None):
    """A complete, submit-ready affiliate application draft for one tool."""
    name = tool.get('name_en') or tool.get('slug') or 'tool'
    slug = tool.get('slug') or ''
    clicks = tool.get('click_count') or 0
    epc = category_epc(tool.get('category'))
    roi = round(clicks * epc, 2)
    pitch = (
        f"jilo.ai is an AI-tools directory. We currently send {clicks} outbound clicks "
        f"to {name} that we cannot monetize. We'd like to join your affiliate/partner "
        f"program, feature {name} prominently on {SITE}/en/tools/{slug}, and track conversions."
    )
    if site_pv_monthly:
        pitch += f" Our site serves ~{site_pv_monthly} pageviews/month."
    return {
        'tool': name,
        'slug': slug,
        'our_page': f"{SITE}/en/tools/{slug}",
        'official_url': tool.get('official_url') or '',
        'category': tool.get('category'),
        'outbound_clicks': clicks,
        'est_epc_usd': epc,
        'est_revenue_at_risk_usd': roi,
        'priority': priority_from_roi(roi),
        'where_to_apply': suggest_networks(tool),
        'pitch': pitch,
        'next_step': (
            "申请通过后，把 tracking link 填进 tools.affiliate_url —— "
            "monitor agent 检测到带 tracking 参数的有效链接会自动销账。"
        ),
    }

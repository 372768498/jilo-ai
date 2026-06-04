"""
affiliate_autofill — closes the monetization loop's last mile.

Once an operator has signed up for a program and recorded the result in
data/affiliate_programs.json (an affiliate_id for a templated network, or a
full pasted link for an opaque one), this job assembles the tracked URL and
writes it to tools.affiliate_url. That single registry edit then:

  - turns every outbound click on that tool into commission, and
  - lets monitor_agent auto-resolve the tool's monetization flag, and
  - keeps applying on every run, so the link survives data refreshes and any
    newly discovered tool added to the registry gets monetized automatically.

This is the only place the system writes affiliate_url, and it only ever writes
a link that (a) the operator supplied and (b) passes the tracking-marker check
(invariant I5 — affiliate_url must mean "actually tracked", never a bare URL).
Idempotent: a tool already carrying the correct valid link is left untouched.
"""
import os

from supabase import create_client

import affiliate_registry as ar
from config import SUPABASE_URL, SUPABASE_KEY, FEISHU_WEBHOOK_URL
from feishu_bot import send_feishu_alert
from monitor_agent import is_valid_affiliate_url
from ops_logger import log_operation

DRY_RUN = os.getenv("AFFILIATE_AUTOFILL_DRY_RUN", "").lower() in ("1", "true", "yes")


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def plan_fills(supabase, registry=None):
    """Compute the set of (slug, tracked_url) writes the registry implies.

    Pure read + assembly — does not mutate anything. Returns:
      fills    : [{slug, name, url, source, current}]  ready to write
      skipped  : [{slug, reason}]                       can't act yet / invalid
    """
    reg = registry or ar.load_registry()
    programs = reg.get("programs") or {}
    if not programs:
        return [], []

    slugs = list(programs.keys())
    rows = supabase.table("tools").select(
        "slug, name_en, official_url, affiliate_url, status"
    ).in_("slug", slugs).execute()
    tools_by_slug = {r["slug"]: r for r in (rows.data or [])}

    fills, skipped = [], []
    for slug in slugs:
        tool = tools_by_slug.get(slug)
        if not tool:
            skipped.append({"slug": slug, "reason": "tool_not_in_db"})
            continue
        url, source = ar.resolve_tracked_url(slug, tool.get("official_url"), reg)
        if not url:
            # no_program / awaiting id / opaque-needs-url — nothing to write yet
            skipped.append({"slug": slug, "reason": source})
            continue
        if not is_valid_affiliate_url(url):
            # operator gave something, but it carries no tracking marker — refuse
            # to write it (it would look monetized while earning nothing).
            skipped.append({"slug": slug, "reason": f"resolved_but_untracked:{url[:50]}"})
            continue
        current = (tool.get("affiliate_url") or "").strip()
        if current == url:
            skipped.append({"slug": slug, "reason": "already_filled"})
            continue
        fills.append({
            "slug": slug,
            "name": tool.get("name_en") or slug,
            "url": url,
            "source": source,
            "current": current or None,
        })
    return fills, skipped


def apply_fills(supabase, fills):
    written = 0
    for f in fills:
        if DRY_RUN:
            print(f"  [DRY] would set {f['slug']}.affiliate_url = {f['url']} ({f['source']})")
            continue
        supabase.table("tools").update(
            {"affiliate_url": f["url"]}
        ).eq("slug", f["slug"]).execute()
        written += 1
        print(f"  [FILL] {f['slug']}.affiliate_url = {f['url']} ({f['source']})")
    return written


def run():
    supabase = get_supabase()
    fills, skipped = plan_fills(supabase)
    written = apply_fills(supabase, fills)
    return {
        "candidates": len(fills),
        "written": written,
        "skipped": len(skipped),
        "dry_run": DRY_RUN,
        "filled_slugs": [f["slug"] for f in fills],
    }


if __name__ == "__main__":
    print("Starting affiliate autofill..." + (" (DRY RUN)" if DRY_RUN else ""))
    try:
        result = run()
        print(f"\n  Autofill: wrote {result['written']} affiliate_url(s), "
              f"{result['skipped']} not actionable yet.")
        log_operation("affiliate_autofill",
                      "success" if not result.get("error") else "error",
                      f"wrote={result['written']} skipped={result['skipped']}",
                      result)
    except Exception as e:
        log_operation("affiliate_autofill", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "Affiliate autofill error", str(e), "error")
        raise

"""
affiliate_registry — the monetization last-mile loader.

monitor_agent finds WHICH tools leak revenue. This module loads
data/affiliate_programs.json and answers HOW to close each leak:

  - program_for(slug)        -> the registry entry for a tool (or None)
  - is_no_program(slug)      -> tool has no affiliate program; stop flagging it
  - resolve_tracked_url(...) -> build a tracked URL from a human-supplied
                                affiliate_id + the network's link template,
                                or pass through a human-pasted full link
  - strategic_opportunities()-> self-monetizable plays (no external approval)

Only humans supply real affiliate_id / affiliate_url (the irreducible business
step). This module never invents them — it only assembles links from values an
operator put in the registry, so a single signup monetizes a tool for good and
new tools on the same program get the same treatment automatically.
"""
import json
import os

_HERE = os.path.dirname(os.path.abspath(__file__))
REGISTRY_PATH = os.path.normpath(
    os.path.join(_HERE, "..", "data", "affiliate_programs.json")
)

# Statuses that mean "no affiliate program exists" — monitor_agent should stop
# raising (and should resolve) monetization flags for these, so the human's
# worklist isn't polluted by tools that can never be monetized via affiliate.
NO_PROGRAM_STATUSES = {"no_program"}


def load_registry(path=REGISTRY_PATH):
    """Load the registry. Returns a safe empty shape if the file is missing or
    malformed, so callers degrade gracefully (the system runs unchanged when the
    registry isn't present yet)."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, OSError) as e:
        print(f"[affiliate_registry] registry unavailable ({e}); using empty.")
        return {"networks": {}, "programs": {}, "strategic_opportunities": []}
    data.setdefault("networks", {})
    data.setdefault("programs", {})
    data.setdefault("strategic_opportunities", [])
    return data


def program_for(slug, registry=None):
    reg = registry or load_registry()
    return (reg.get("programs") or {}).get(slug)


def is_no_program(slug, registry=None):
    prog = program_for(slug, registry)
    return bool(prog) and (prog.get("status") in NO_PROGRAM_STATUSES)


def no_program_slugs(registry=None):
    reg = registry or load_registry()
    return {
        slug for slug, p in (reg.get("programs") or {}).items()
        if (p or {}).get("status") in NO_PROGRAM_STATUSES
    }


def _normalize_base(url):
    """A clean base URL to hang a tracking param off of. Strips trailing slash
    so '{base}?via=x' doesn't produce a double slash."""
    u = (url or "").strip()
    return u[:-1] if u.endswith("/") else u


def resolve_tracked_url(slug, official_url, registry=None):
    """Build a tracked affiliate URL for a tool from operator-supplied values.

    Resolution order (returns (url, source) or (None, reason)):
      1. program.affiliate_url present -> pass it through (opaque networks:
         Impact/PartnerStack links the operator pasted in full).
      2. program.affiliate_id present + network has a {base}/{id} template ->
         assemble base + template.
      3. otherwise -> (None, why) so the worklist can say what's still needed.

    Validation (must carry a real tracking marker) is the caller's job — reuse
    monitor_agent.is_valid_affiliate_url so the I5 invariant has one definition.
    """
    reg = registry or load_registry()
    prog = (reg.get("programs") or {}).get(slug)
    if not prog:
        return None, "no_registry_entry"
    if prog.get("status") in NO_PROGRAM_STATUSES:
        return None, "no_program"

    pasted = (prog.get("affiliate_url") or "").strip()
    if pasted:
        return pasted, "pasted_full_link"

    aff_id = (prog.get("affiliate_id") or "").strip()
    if not aff_id:
        return None, "awaiting_affiliate_id_or_url"

    network = prog.get("network")
    net = (reg.get("networks") or {}).get(network or "")
    if not net:
        return None, f"network_unknown:{network}"
    template = net.get("template")
    if not template:
        # Opaque network (no template) but only an id was given — we can't safely
        # synthesize the link; the operator must paste the full tracked URL.
        return None, f"network_opaque_needs_full_url:{network}"

    base = _normalize_base(official_url)
    if not base:
        return None, "tool_has_no_official_url"
    try:
        return template.format(base=base, id=aff_id), f"template:{network}"
    except (KeyError, IndexError) as e:
        return None, f"bad_template:{e}"


def strategic_opportunities(registry=None):
    reg = registry or load_registry()
    return reg.get("strategic_opportunities") or []


if __name__ == "__main__":
    reg = load_registry()
    progs = reg.get("programs") or {}
    print(f"registry: {len(progs)} programs, "
          f"{len(no_program_slugs(reg))} no_program, "
          f"{len(strategic_opportunities(reg))} strategic opportunities")
    for slug, p in progs.items():
        url, src = resolve_tracked_url(slug, "https://example.com", reg)
        print(f"  {slug:16} status={p.get('status'):11} -> {src}"
              + (f" ({url})" if url else ""))

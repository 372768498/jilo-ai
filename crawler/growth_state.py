"""
growth_state — the shared decision-state store that turns the system from a
self-checking workflow into a Loop.

The 2026-06-03 audit found three feedback edges that were written but never
read (dead ends). They all get reconnected through this one table:

  - per (source, mode) PV effectiveness  -> rank3 budget allocation
  - autonomy verdict + blockers          -> rank4 quota gating
  - keyword/mode suppress list            -> rank3/rank9 disinvestment

Design notes
------------
* Thin key/jsonb store: rank1/3/4 extend the value shape without schema churn.
* All reads degrade to safe defaults if the table is absent — the DDL in
  scripts/create-growth-state.sql is applied manually in Supabase, so deploying
  this code before the table exists must never break the pipeline. This mirrors
  the defensive fallback in traffic_growth_agent.latest_pv_pair.
* Functions take an existing `supabase` client (same convention as
  action_queue.py); they never create one.

INVARIANT I2 (see docs/jilo-growth-commander-upgrade-spec-2026-06-03.md):
every key written here must have a turn-head consumer landed in the same change.
At the G0 foundation stage nothing writes yet — set_state exists for rank3/4,
and the reads return defaults so behavior is unchanged.
"""
from datetime import datetime

# Canonical keys. Keep them here so producers and consumers can't drift.
VERDICT_KEY = "autonomy_verdict"        # written by rank4 (autonomy_guardian)
EFFECTIVENESS_KEY = "mode_effectiveness"  # written by rank3 (effectiveness_lookback)
SUPPRESS_KEY = "suppress"               # written by rank3/rank9


def get_state(supabase, key, default=None):
    """Read one state value by key. Returns `default` if absent or unavailable."""
    try:
        rows = supabase.table('growth_state').select('value').eq(
            'key', key
        ).limit(1).execute()
        if rows.data:
            value = rows.data[0].get('value')
            return value if value is not None else default
    except Exception as e:
        print(f"growth_state unavailable for key={key}: {e}")
    return default


def set_state(supabase, key, value):
    """Upsert one state value by key. Conflict resolves on the `key` PK.
    Returns True on success, False if the write failed (never raises)."""
    try:
        supabase.table('growth_state').upsert({
            'key': key,
            'value': value,
            'updated_at': datetime.utcnow().isoformat(),
        }).execute()
        return True
    except Exception as e:
        print(f"growth_state write failed for key={key}: {e}")
        return False


def read_all(supabase):
    """Read the full decision state in one shot for a turn-head snapshot."""
    try:
        rows = supabase.table('growth_state').select('key, value').execute()
        return {r['key']: r.get('value') for r in (rows.data or [])}
    except Exception as e:
        print(f"growth_state snapshot unavailable: {e}")
        return {}


# --- typed convenience accessors (consumed by rank3/rank4) ---

def get_verdict(supabase):
    """Autonomy health snapshot. Default 'unknown' keeps behavior unchanged
    until rank4 starts writing real verdicts."""
    v = get_state(supabase, VERDICT_KEY, default=None) or {}
    return {
        'verdict': v.get('verdict', 'unknown'),
        'blockers': v.get('blockers', []),
    }


def get_mode_effectiveness(supabase):
    """Per (source, mode) avg PV-per-page map. Default {} keeps quotas static
    until rank3 starts aggregating real effectiveness."""
    return get_state(supabase, EFFECTIVENESS_KEY, default={}) or {}


def get_suppress(supabase):
    """Keywords/modes to disinvest from. Default [] suppresses nothing until
    rank3/rank9 populate it."""
    return get_state(supabase, SUPPRESS_KEY, default=[]) or []

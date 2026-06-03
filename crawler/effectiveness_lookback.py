"""
effectiveness_lookback — rank3. Aggregates per-mode PV effectiveness from the
snapshots lookback_agent already captures, and writes it to growth_state so the
budget allocator can tilt next run's quota toward what actually earns PV.

This is the second of the three dead feedback edges the 2026-06-03 audit found:
page_performance_lookback was written every day but only ever read to trigger a
single-page rewrite — never aggregated into "which mode should we do more of".

Causal order (UTC): lookback_agent 20:10 captures snapshots AND calls
aggregate_and_store here -> traffic_growth_agent 20:35 reads the result same
day. The snapshots themselves are aged (7/14/28d), so the signal is sound even
though the write/read happen minutes apart.

INVARIANT I2: the EFFECTIVENESS_KEY / SUPPRESS_KEY writes here have a turn-head
consumer landed in the same change — traffic_growth_agent.effectiveness_to_weights
and apply_suppress.
"""
import os
from collections import defaultdict
from datetime import datetime

from supabase import create_client

import growth_state
from config import SUPABASE_URL, SUPABASE_KEY

# page_performance_lookback.content_type -> budget mode.
CONTENT_TYPE_TO_MODE = {
    'seo_article': 'seo',
    'aeo_answer': 'aeo',
    'compare': 'compare',
}

# A mode needs at least this many aged pages before we trust a 0-PV verdict
# enough to suppress it — otherwise a single dud page would cut a whole mode.
SUPPRESS_MIN_SAMPLES = int(os.getenv("EFFECTIVENESS_SUPPRESS_MIN_SAMPLES", "5"))


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def aggregate_effectiveness(lookback_rows):
    """Pure: rows from page_performance_lookback -> (effectiveness, suppress).

    effectiveness = {'modes': {mode: {'avg_pv': float, 'samples': int}}}
    suppress      = [mode, ...] for modes with enough samples but zero PV.

    Dedupes by slug to the most mature snapshot so a page counted at 7/14/28d
    isn't triple-weighted.
    """
    by_slug = {}
    for r in lookback_rows:
        slug = r.get('slug')
        if not slug:
            continue
        cur = by_slug.get(slug)
        if not cur or (r.get('age_bucket') or 0) > (cur.get('age_bucket') or 0):
            by_slug[slug] = r

    agg = defaultdict(lambda: {'pv_sum': 0, 'samples': 0})
    for r in by_slug.values():
        mode = CONTENT_TYPE_TO_MODE.get(r.get('content_type'))
        if not mode:
            continue
        agg[mode]['pv_sum'] += r.get('pageviews') or 0
        agg[mode]['samples'] += 1

    modes = {}
    for mode, d in agg.items():
        avg = round(d['pv_sum'] / d['samples'], 2) if d['samples'] else 0.0
        modes[mode] = {'avg_pv': avg, 'samples': d['samples']}

    suppress = [
        mode for mode, d in modes.items()
        if d['samples'] >= SUPPRESS_MIN_SAMPLES and d['avg_pv'] == 0.0
    ]
    return {'modes': modes}, suppress


def aggregate_and_store(supabase):
    """Read snapshots, aggregate, persist to growth_state. Returns the summary."""
    rows = supabase.table('page_performance_lookback').select(
        'content_type, slug, age_bucket, pageviews'
    ).execute()
    effectiveness, mode_suppress = aggregate_effectiveness(rows.data or [])
    effectiveness['updated'] = datetime.utcnow().isoformat()
    growth_state.set_state(supabase, growth_state.EFFECTIVENESS_KEY, effectiveness)

    # Preserve keyword-level suppress entries (rank9 owns 'kw:' prefixed ones);
    # only refresh the mode-level suppressions we compute here.
    existing = growth_state.get_suppress(supabase)
    kw_suppress = [s for s in existing if isinstance(s, str) and s.startswith('kw:')]
    merged = sorted(set(kw_suppress) | set(mode_suppress))
    growth_state.set_state(supabase, growth_state.SUPPRESS_KEY, merged)

    return {'modes': effectiveness['modes'], 'suppress': mode_suppress}


if __name__ == "__main__":
    print("Aggregating per-mode PV effectiveness...")
    summary = aggregate_and_store(get_supabase())
    print(summary)

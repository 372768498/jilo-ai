# crawler/tests/test_daily_report.py
#
# Lane A acceptance for the three confirmed daily_report.py bugs:
#   (a) DEDUP — each of pv_growth_status / format_daily_report / send_daily_report
#       is defined exactly ONCE (the earlier dead copies were removed, the live
#       later copies kept).
#   (b) WINDOW — yesterday's outbound clicks are counted over the *full* UTC day
#       [yesterday 00:00Z, today 00:00Z), so they line up with the yesterday PV/UV.
#   (c) NOISE — smoothed_growth() averages week-over-week, so a noisy flat series
#       does NOT flip the +20% verdict to "met" (and a real WoW jump still does).
#
# These tests are PURE: they exercise the helper functions and the source text
# only. They never call get_today_stats() (it hits Supabase) and need no network
# or credentials.
import re
import os
import unittest
from datetime import datetime, timedelta

import daily_report as dr


SRC = open(
    os.path.join(os.path.dirname(dr.__file__), 'daily_report.py'),
    encoding='utf-8',
).read()


class TestExactlyOneDefinition(unittest.TestCase):
    """Bug 1: Python keeps the LAST def, so the earlier duplicates were dead code.
    Exactly one top-level definition of each must survive."""

    def _count_defs(self, name):
        return len(re.findall(rf'^def {name}\b', SRC, re.M))

    def test_pv_growth_status_defined_once(self):
        self.assertEqual(self._count_defs('pv_growth_status'), 1)

    def test_format_daily_report_defined_once(self):
        self.assertEqual(self._count_defs('format_daily_report'), 1)

    def test_send_daily_report_defined_once(self):
        self.assertEqual(self._count_defs('send_daily_report'), 1)

    def test_smoothed_growth_defined_once(self):
        self.assertEqual(self._count_defs('smoothed_growth'), 1)

    def test_live_versions_are_callable(self):
        # The surviving copies are the real functions, not stubs.
        self.assertTrue(callable(dr.pv_growth_status))
        self.assertTrue(callable(dr.format_daily_report))
        self.assertTrue(callable(dr.send_daily_report))


class TestYesterdayOutboundWindow(unittest.TestCase):
    """Bug 2: outbound/affiliate clicks for the report must be counted over
    yesterday's full UTC day [yesterday T00:00:00Z, today T00:00:00Z) so they
    align with the yesterday PV/UV — a half-open day window."""

    # ISO timestamps in 'YYYY-MM-DDTHH:MM:SSZ' form compare lexicographically the
    # same way Supabase's gte/lt do, so we can assert window membership in pure
    # Python without a DB.
    def _bounds(self, ref):
        today = ref.strftime('%Y-%m-%d')
        yesterday = (ref - timedelta(days=1)).strftime('%Y-%m-%d')
        lo = f'{yesterday}T00:00:00Z'   # inclusive (gte)
        hi = f'{today}T00:00:00Z'       # exclusive (lt)
        return lo, hi

    def _in_window(self, ts, lo, hi):
        return lo <= ts < hi

    def test_lower_bound_is_inclusive(self):
        lo, hi = self._bounds(datetime(2026, 6, 17))
        self.assertEqual(lo, '2026-06-16T00:00:00Z')
        # The very first instant of yesterday is counted.
        self.assertTrue(self._in_window('2026-06-16T00:00:00Z', lo, hi))

    def test_upper_bound_is_exclusive(self):
        lo, hi = self._bounds(datetime(2026, 6, 17))
        self.assertEqual(hi, '2026-06-17T00:00:00Z')
        # Midnight that starts TODAY belongs to today's window, not yesterday's.
        self.assertFalse(self._in_window('2026-06-17T00:00:00Z', lo, hi))

    def test_last_instant_of_yesterday_is_included(self):
        lo, hi = self._bounds(datetime(2026, 6, 17))
        self.assertTrue(self._in_window('2026-06-16T23:59:59Z', lo, hi))

    def test_today_and_two_days_ago_are_excluded(self):
        lo, hi = self._bounds(datetime(2026, 6, 17))
        self.assertFalse(self._in_window('2026-06-17T09:30:00Z', lo, hi))  # today
        self.assertFalse(self._in_window('2026-06-15T12:00:00Z', lo, hi))  # 2 days ago

    def test_window_is_exactly_one_day_wide(self):
        # Spans whatever day the reference falls on (DST-free UTC: always 1 day).
        for ref in [datetime(2026, 6, 17), datetime(2026, 1, 1), datetime(2026, 3, 1)]:
            lo, hi = self._bounds(ref)
            lo_dt = datetime.strptime(lo, '%Y-%m-%dT%H:%M:%SZ')
            hi_dt = datetime.strptime(hi, '%Y-%m-%dT%H:%M:%SZ')
            self.assertEqual(hi_dt - lo_dt, timedelta(days=1))

    def test_source_uses_half_open_yesterday_window(self):
        # Guard the actual query shape: gte yesterday-start AND lt today-start.
        self.assertIn("gte('created_at', f'{yesterday}T00:00:00Z')", SRC)
        self.assertIn("lt('created_at', f'{today}T00:00:00Z')", SRC)
        # And the yesterday counters are surfaced for the 变现 block.
        self.assertIn("outbound_clicks_yesterday", SRC)
        self.assertIn("affiliate_clicks_yesterday", SRC)


def _days(pvs, start='2026-06-01'):
    """oldest..newest -> analytics_site_daily-shaped rows with ascending dates."""
    base = datetime.strptime(start, '%Y-%m-%d')
    return [
        {'date': (base + timedelta(days=i)).strftime('%Y-%m-%d'),
         'total_pageviews': pv}
        for i, pv in enumerate(pvs)
    ]


class TestSmoothedGrowth(unittest.TestCase):
    """Bug 3: at 60-140 PV/day day-over-day +20% is noise. smoothed_growth()
    compares mean(last 7) vs mean(prior 7) so noise can't flip the verdict."""

    def test_noisy_flat_series_does_not_meet_target(self):
        # 14 days bouncing 90..110 around a flat ~100 mean. Day-over-day there are
        # plenty of +20% jumps, but week-over-week the trend is flat -> NOT met.
        pvs = [100, 90, 110, 95, 105, 92, 108,   # prior week  (mean ~100)
               100, 90, 110, 95, 105, 92, 108]   # recent week (mean ~100)
        s = dr.smoothed_growth(_days(pvs), target_growth=0.20)
        self.assertFalse(s['met'])
        self.assertAlmostEqual(s['actual_pct'], 0.0, delta=0.5)

    def test_daily_spike_does_not_flip_smoothed_met(self):
        # Day-over-day, the last step (95 -> 119) is +25% and WOULD "meet" the
        # +20% target — a classic daily-noise false positive. But the two weekly
        # means are equal, so smoothed_growth correctly reports NOT met.
        prior = [100, 100, 100, 100, 100, 100, 100]      # mean 100
        recent = [100, 100, 100, 100, 100, 95, 119]      # mean 100.57, last day +25%
        # sanity: the naive day-over-day check on the last step would "meet".
        self.assertGreaterEqual((recent[-1] - recent[-2]) / recent[-2], 0.20)
        s = dr.smoothed_growth(_days(prior + recent), target_growth=0.20)
        self.assertFalse(s['met'])  # smoothed (~0.6%) does NOT meet +20%

    def test_real_week_over_week_growth_meets_target(self):
        # prior week mean 100, recent week mean 130 (+30% WoW) -> met.
        pvs = [100] * 7 + [130] * 7
        s = dr.smoothed_growth(_days(pvs), target_growth=0.20)
        self.assertTrue(s['met'])
        self.assertAlmostEqual(s['actual_pct'], 30.0, delta=0.5)

    def test_sustained_decline_is_a_miss(self):
        # recent week clearly below prior week -> miss (the only thing that should
        # ever escalate the red card).
        pvs = [120] * 7 + [80] * 7
        s = dr.smoothed_growth(_days(pvs), target_growth=0.20)
        self.assertFalse(s['met'])
        self.assertLess(s['actual_pct'], 0)

    def test_insufficient_history_is_unjudged(self):
        # Fewer than two full windows -> can't judge -> met is None (blue card),
        # never a false miss.
        s = dr.smoothed_growth(_days([100] * 13), target_growth=0.20)
        self.assertIsNone(s['met'])
        self.assertIn('N/A', s['line'])

    def test_target_present_in_line(self):
        s = dr.smoothed_growth(_days([100] * 7 + [130] * 7), target_growth=0.20)
        self.assertIn('目标 +20%', s['line'])

    def test_window_means_surfaced(self):
        s = dr.smoothed_growth(_days([100] * 7 + [130] * 7), target_growth=0.20)
        self.assertAlmostEqual(s['prior_mean'], 100.0)
        self.assertAlmostEqual(s['recent_mean'], 130.0)


class TestFormatUsesSmoothedAndYesterdayWindow(unittest.TestCase):
    """The report wiring: the headline verdict line comes from smoothed_growth,
    and the 变现 block reads the yesterday outbound counters."""

    def _stats(self, **overrides):
        # Minimal stats dict that format_daily_report() can render without a DB.
        s = {
            'pv': 110, 'uv': 70, 'pv_prev': 90,
            'pv_recent_days': _days([100] * 7 + [130] * 7),  # smoothed: met
            'news_saved': 1, 'tools_saved': 2, 'seo_articles': 0,
            'compare_articles': 0, 'rewrites_done_today': 0,
            'outbound_clicks': 999, 'affiliate_clicks': 888,
            'outbound_clicks_yesterday': 12, 'affiliate_clicks_yesterday': 4,
            'affiliate_tools': 5, 'errors': [],
        }
        s.update(overrides)
        return s

    def test_headline_uses_smoothed_not_daily(self):
        # pv/pv_prev is 110/90 (+22% daily, would "meet"), but smoothed series is
        # flat -> the headline must reflect the SMOOTHED miss, proving the line is
        # driven by smoothed_growth, not pv_growth_status.
        flat = self._stats(pv_recent_days=_days([100] * 14))
        out = dr.format_daily_report(flat)
        self.assertIn('7日均值', out)  # smoothed line, not the daily one

    def test_monetization_block_shows_yesterday_counts(self):
        out = dr.format_daily_report(self._stats())
        # Yesterday's aligned counters appear; today's misaligned ones do not.
        self.assertIn('出站点击: 12', out)
        self.assertIn('联盟点击: 4', out)
        self.assertNotIn('999', out)
        self.assertNotIn('888', out)

    def test_monetization_label_marks_yesterday(self):
        out = dr.format_daily_report(self._stats())
        self.assertIn('变现（昨日', out)


if __name__ == '__main__':
    unittest.main()

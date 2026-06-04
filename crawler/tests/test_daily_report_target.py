# crawler/tests/test_daily_report_target.py
#
# rank8 acceptance (A8): the +20% target is visible as target/actual/gap, the
# report knows whether it was met, and a sustained miss is countable for
# escalation.
import unittest

import daily_report as dr


class TestPvGrowthStatus(unittest.TestCase):
    def test_met_when_growth_at_or_above_target(self):
        s = dr.pv_growth_status(120, 100, target_growth=0.20)
        self.assertTrue(s['met'])
        self.assertIn('达标', s['line'])
        self.assertIn('+20%', s['line'])

    def test_missed_shows_gap(self):
        s = dr.pv_growth_status(108, 100, target_growth=0.20)  # +8%, target +20%
        self.assertFalse(s['met'])
        self.assertIn('缺口', s['line'])
        self.assertIn('目标 +20%', s['line'])

    def test_negative_growth_is_a_miss(self):
        s = dr.pv_growth_status(90, 100, target_growth=0.20)
        self.assertFalse(s['met'])

    def test_no_baseline_is_unjudged(self):
        s = dr.pv_growth_status(120, 0, target_growth=0.20)
        self.assertIsNone(s['met'])
        self.assertIn('N/A', s['line'])

    def test_target_always_present_in_line(self):
        # The whole point of rank8: the target is in the report, not just a delta.
        for pv, prev in [(120, 100), (108, 100), (90, 100)]:
            self.assertIn('目标 +20%', dr.pv_growth_status(pv, prev)['line'])


class TestConsecutiveMisses(unittest.TestCase):
    def _days(self, pvs):
        # oldest..newest -> rows with ascending dates
        return [{'date': f'2026-06-{i + 1:02d}', 'total_pageviews': pv}
                for i, pv in enumerate(pvs)]

    def test_counts_recent_miss_streak(self):
        # 100 ->105 (+5%, miss) ->108 (+~3%, miss) ; both miss target 20%
        rows = self._days([100, 105, 108])
        self.assertEqual(dr.count_consecutive_misses(rows, 0.20), 2)

    def test_streak_breaks_on_a_hit(self):
        # last step 100->130 (+30%) meets target -> streak 0
        rows = self._days([80, 100, 130])
        self.assertEqual(dr.count_consecutive_misses(rows, 0.20), 0)

    def test_hit_then_misses_counts_only_recent(self):
        # 100->130 hit, 130->131 miss, 131->132 miss -> streak 2 (stops at the hit)
        rows = self._days([100, 130, 131, 132])
        self.assertEqual(dr.count_consecutive_misses(rows, 0.20), 2)

    def test_escalation_threshold_reached(self):
        rows = self._days([100, 101, 102, 103])  # 3 consecutive tiny-growth misses
        self.assertGreaterEqual(dr.count_consecutive_misses(rows, 0.20),
                                dr.MISS_STREAK_ESCALATE)


if __name__ == '__main__':
    unittest.main()

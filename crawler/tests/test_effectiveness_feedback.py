# crawler/tests/test_effectiveness_feedback.py
#
# rank3 acceptance (A3): per-mode PV effectiveness feeds back into the budget
# (invariant I2 — the EFFECTIVENESS_KEY / SUPPRESS_KEY writes have live
# consumers). A3b: aggregation produces a real signal, not a hardcoded string.
import unittest

import effectiveness_lookback as el
import traffic_growth_agent as tga


def _row(content_type, slug, pv, age=7):
    return {'content_type': content_type, 'slug': slug, 'age_bucket': age, 'pageviews': pv}


class TestAggregateEffectiveness(unittest.TestCase):
    def test_per_mode_average_pv(self):
        rows = [
            _row('aeo_answer', 'a1', 20), _row('aeo_answer', 'a2', 10),
            _row('seo_article', 's1', 4),
            _row('compare', 'c1', 6),
        ]
        eff, suppress = el.aggregate_effectiveness(rows)
        self.assertEqual(eff['modes']['aeo']['avg_pv'], 15.0)
        self.assertEqual(eff['modes']['aeo']['samples'], 2)
        self.assertEqual(eff['modes']['seo']['avg_pv'], 4.0)
        self.assertEqual(suppress, [])

    def test_dedupe_by_slug_keeps_most_mature(self):
        rows = [_row('aeo_answer', 'a1', 5, age=7), _row('aeo_answer', 'a1', 30, age=28)]
        eff, _ = el.aggregate_effectiveness(rows)
        # only the 28d snapshot counts, not both
        self.assertEqual(eff['modes']['aeo']['samples'], 1)
        self.assertEqual(eff['modes']['aeo']['avg_pv'], 30.0)

    def test_zero_pv_mode_with_enough_samples_is_suppressed(self):
        rows = [_row('compare', f'c{i}', 0) for i in range(el.SUPPRESS_MIN_SAMPLES)]
        rows += [_row('aeo_answer', 'a1', 12)]
        _, suppress = el.aggregate_effectiveness(rows)
        self.assertIn('compare', suppress)
        self.assertNotIn('aeo', suppress)

    def test_zero_pv_below_sample_floor_not_suppressed(self):
        rows = [_row('compare', 'c1', 0), _row('compare', 'c2', 0)]  # < SUPPRESS_MIN_SAMPLES
        _, suppress = el.aggregate_effectiveness(rows)
        self.assertEqual(suppress, [])


class TestEffectivenessToWeights(unittest.TestCase):
    def test_no_data_falls_back_to_static(self):
        self.assertIsNone(tga.effectiveness_to_weights({}))
        self.assertIsNone(tga.effectiveness_to_weights({'modes': {}}))

    def test_high_pv_mode_boosted_above_base(self):
        eff = {'modes': {
            'aeo': {'avg_pv': 20, 'samples': 5},
            'seo': {'avg_pv': 5, 'samples': 5},
            'compare': {'avg_pv': 5, 'samples': 5},
        }}
        w = tga.effectiveness_to_weights(eff)
        self.assertGreater(w['aeo'], tga.MODE_WEIGHTS['aeo'])   # above-mean -> boosted
        self.assertLess(w['seo'], tga.MODE_WEIGHTS['seo'])      # below-mean -> cut

    def test_budget_shifts_toward_high_pv_mode(self):
        # I2 proof: changing the effectiveness seed changes the budget.
        eff = {'modes': {
            'aeo': {'avg_pv': 20, 'samples': 5},
            'seo': {'avg_pv': 5, 'samples': 5},
            'compare': {'avg_pv': 5, 'samples': 5},
        }}
        static = tga.compute_growth_budget(30, 5, weights=None)
        boosted = tga.compute_growth_budget(30, 5, weights=tga.effectiveness_to_weights(eff))
        self.assertGreater(boosted['aeo'], static['aeo'])


class TestApplySuppress(unittest.TestCase):
    def test_suppressed_mode_forced_to_zero(self):
        budget = tga.compute_growth_budget(5000, 5)  # all at caps
        out = tga.apply_suppress(budget, ['compare'])
        self.assertEqual(out['compare'], 0)
        self.assertEqual(out['aeo'], budget['aeo'])  # others untouched

    def test_keyword_suppress_entries_ignored_for_modes(self):
        budget = tga.compute_growth_budget(100, 5)
        out = tga.apply_suppress(budget, ['kw:some-dead-query'])
        self.assertEqual(out, budget)  # 'kw:' entries don't match modes


if __name__ == '__main__':
    unittest.main()

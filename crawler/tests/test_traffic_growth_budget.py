# crawler/tests/test_traffic_growth_budget.py
#
# rank1 acceptance (A1): the PV deficit is a gradient budget, not a boolean
# switch (invariant I4).
#   - deficit <= 0          -> all modes zero
#   - small deficit         -> per-mode floors
#   - large deficit         -> per-mode caps
#   - monotonic non-decreasing in deficit
#   - A1b: rewrite budget rises with deficit too
import unittest

import traffic_growth_agent as tga


class TestComputeGrowthBudget(unittest.TestCase):
    def test_zero_deficit_is_all_zero(self):
        b = tga.compute_growth_budget(0, 5)
        self.assertEqual(set(b.values()), {0})

    def test_small_deficit_hits_floors(self):
        # deficit 5 / 5 pv-per-page = 1 page -> everything clamps up to floors.
        b = tga.compute_growth_budget(5, 5)
        self.assertEqual(b['aeo'], tga.MODE_FLOORS['aeo'])
        self.assertEqual(b['seo'], tga.MODE_FLOORS['seo'])
        self.assertEqual(b['compare'], tga.MODE_FLOORS['compare'])
        self.assertEqual(b['rewrite'], tga.MODE_FLOORS['rewrite'])

    def test_large_deficit_hits_caps(self):
        b = tga.compute_growth_budget(5000, 5)
        self.assertEqual(b['aeo'], tga.MODE_CAPS['aeo'])
        self.assertEqual(b['seo'], tga.MODE_CAPS['seo'])
        self.assertEqual(b['compare'], tga.MODE_CAPS['compare'])
        self.assertEqual(b['rewrite'], tga.MODE_CAPS['rewrite'])

    def test_monotonic_non_decreasing(self):
        prev = {m: -1 for m in tga.MODE_CAPS}
        for deficit in range(0, 6000, 137):
            b = tga.compute_growth_budget(deficit, 5)
            for mode in tga.MODE_CAPS:
                self.assertGreaterEqual(
                    b[mode], prev[mode] if deficit else 0,
                    f"{mode} dropped at deficit={deficit}",
                )
            if deficit:
                prev = b

    def test_rewrite_budget_rises_with_deficit(self):
        small = tga.compute_growth_budget(50, 5)['rewrite']
        big = tga.compute_growth_budget(2000, 5)['rewrite']
        self.assertLess(small, big)

    def test_caps_are_upper_bound_not_fixed_output(self):
        # The whole point of I4: output is no longer the static MAX_* constant.
        mid = tga.compute_growth_budget(120, 5)  # 24 pages
        self.assertLess(mid['seo'], tga.MODE_CAPS['seo'])
        self.assertGreater(mid['seo'], tga.MODE_FLOORS['seo'])


if __name__ == '__main__':
    unittest.main()

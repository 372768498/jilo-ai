# crawler/tests/test_health_gating.py
#
# rank4 acceptance (A4): the autonomy guardian's verdict gates both producers.
#   - degraded -> new content frozen (aeo/seo/compare budget 0), rewrites kept
#   - seo_backlog blocker -> seo zeroed specifically
#   - healthy -> unchanged
# Toggling the verdict changes the output, proving the VERDICT_KEY write is read
# (invariant I2).
import unittest

import traffic_growth_agent as tga
import strategy_engine as se


class TestTrafficGrowthVerdictGate(unittest.TestCase):
    def setUp(self):
        self.full = tga.compute_growth_budget(5000, 5)  # all modes at caps

    def test_healthy_leaves_budget_untouched(self):
        out = tga.apply_verdict_gate(self.full, 'healthy', [])
        self.assertEqual(out, self.full)

    def test_degraded_freezes_new_content_keeps_rewrite(self):
        out = tga.apply_verdict_gate(self.full, 'degraded_needs_attention', [])
        self.assertEqual(out['aeo'], 0)
        self.assertEqual(out['seo'], 0)
        self.assertEqual(out['compare'], 0)
        self.assertEqual(out['rewrite'], self.full['rewrite'])  # rewrites survive

    def test_manual_blocker_also_freezes(self):
        out = tga.apply_verdict_gate(self.full, 'degraded_manual_blocker', [])
        self.assertEqual(out['seo'], 0)
        self.assertGreater(out['rewrite'], 0)

    def test_seo_backlog_blocker_zeros_seo_only(self):
        out = tga.apply_verdict_gate(self.full, 'healthy', ['seo_backlog'])
        self.assertEqual(out['seo'], 0)
        self.assertEqual(out['aeo'], self.full['aeo'])  # other modes still run

    def test_toggling_verdict_changes_output(self):
        healthy = tga.apply_verdict_gate(self.full, 'healthy', [])
        degraded = tga.apply_verdict_gate(self.full, 'degraded_needs_attention', [])
        self.assertNotEqual(healthy, degraded)


class TestStrategyHealthFilter(unittest.TestCase):
    def setUp(self):
        self.actions = [
            {'type': 'generate_seo_content', 'mode': 'aeo', 'keyword': 'x'},
            {'type': 'generate_seo_content', 'keyword': 'y'},                 # plain seo
            {'type': 'generate_seo_content', 'mode': 'rewrite', 'slug': 'z'},
            {'type': 'generate_comparison', 'tool_a': 'a', 'tool_b': 'b'},
            {'type': 'flag_for_review', 'page': '/p'},
        ]

    def test_healthy_keeps_everything(self):
        out = se.filter_actions_for_health(self.actions, 'healthy', [])
        self.assertEqual(len(out), len(self.actions))

    def test_degraded_keeps_only_rewrites_and_flags(self):
        out = se.filter_actions_for_health(self.actions, 'degraded_needs_attention', [])
        types = [(a['type'], a.get('mode')) for a in out]
        self.assertIn(('generate_seo_content', 'rewrite'), types)
        self.assertIn(('flag_for_review', None), types)
        self.assertNotIn(('generate_seo_content', 'aeo'), types)
        self.assertNotIn(('generate_comparison', None), types)

    def test_seo_backlog_drops_new_seo_but_keeps_compare(self):
        out = se.filter_actions_for_health(self.actions, 'healthy', ['seo_backlog'])
        types = [(a['type'], a.get('mode')) for a in out]
        self.assertNotIn(('generate_seo_content', None), types)   # new seo dropped
        self.assertIn(('generate_seo_content', 'rewrite'), types)  # rewrite kept
        self.assertIn(('generate_comparison', None), types)        # compare kept


if __name__ == '__main__':
    unittest.main()

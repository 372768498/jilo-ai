# crawler/tests/test_hotfile_rank2_6_9.py
#
# rank6 (A6): the AEO structure gate keeps citeable structure on rewrites (I3).
# rank2 (A2): monetization gaps become content actions.
# rank9 (A9b): noise-resistant PV baseline.
import unittest

import quality_gates as qg
import strategy_engine as se
import traffic_growth_agent as tga


GOOD_AEO = (
    '<section class="aeo-short-answer"><h2>Short answer</h2><p>Yes.</p></section>'
    '<table><tr><td>a</td></tr></table>'
    '<h3>Q1?</h3><p>a</p><h3>Q2?</h3><p>b</p><h3>Q3?</h3><p>c</p>'
    '<a href="/en/tools/runway">Runway</a><a href="/en/tools/pika">Pika</a>'
    '<p>Last updated 2026</p>'
)


class TestAeoStructureGate(unittest.TestCase):
    def test_well_formed_aeo_passes(self):
        self.assertTrue(qg._aeo_structure({'content_en': GOOD_AEO}).ok)

    def test_long_form_seo_article_is_rejected(self):
        # A 5000-word markdown SEO article has no table/short-answer/FAQ HTML.
        seo = "# Heading\n\nLots of prose. " * 200
        r = qg._aeo_structure({'content_en': seo})
        self.assertFalse(r.ok)
        self.assertIn('AEO structure', r.reason)

    def test_missing_table_flagged(self):
        no_table = GOOD_AEO.replace('<table><tr><td>a</td></tr></table>', '')
        self.assertFalse(qg._aeo_structure({'content_en': no_table}).ok)

    def test_too_few_internal_links_flagged(self):
        one_link = GOOD_AEO.replace('<a href="/en/tools/pika">Pika</a>', '')
        self.assertFalse(qg._aeo_structure({'content_en': one_link}).ok)

    def test_aeo_rewrite_skips_dup_but_runs_structure(self):
        # skip_dup path still enforces structure (so a flattened rewrite fails).
        bad = {'title_en': 'T', 'content_en': 'plain', 'content_zh': '简',
               'meta_description_en': 'x' * 120, 'meta_description_zh': 'y' * 60,
               'title_zh': 'T', 'target_keyword': 'k'}
        r = qg.check_aeo_answer(bad, supabase=None, skip_dup=True)
        self.assertFalse(r.ok)


class TestMonetizationOpportunities(unittest.TestCase):
    def test_affiliate_tool_with_clicks_becomes_action(self):
        tools = [{'slug': 'runway', 'name_en': 'Runway', 'click_count': 30,
                  'affiliate_url': 'https://runway.com/?ref=jilo'}]
        actions = se._monetization_actions_from_tools(tools)
        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]['source'], 'monetization')
        self.assertEqual(actions[0]['type'], 'generate_seo_content')

    def test_no_affiliate_is_skipped(self):
        tools = [{'slug': 'x', 'name_en': 'X', 'click_count': 30, 'affiliate_url': ''}]
        self.assertEqual(se._monetization_actions_from_tools(tools), [])

    def test_low_clicks_skipped(self):
        tools = [{'slug': 'x', 'name_en': 'X', 'click_count': 1,
                  'affiliate_url': 'https://x.com/?ref=jilo'}]
        self.assertEqual(se._monetization_actions_from_tools(tools), [])

    def test_respects_limit(self):
        tools = [{'slug': f's{i}', 'name_en': f'T{i}', 'click_count': 50,
                  'affiliate_url': 'https://t.com/?ref=jilo'} for i in range(20)]
        self.assertLessEqual(len(se._monetization_actions_from_tools(tools)), se.MONETIZATION_MAX_PER_RUN)


class TestRobustBaseline(unittest.TestCase):
    def test_uses_yesterday_when_growing(self):
        # newest-first: growing series -> previous is yesterday
        latest, prev = tga.robust_baseline([130, 100, 95, 90])
        self.assertEqual(latest, 130)
        self.assertEqual(prev, 100)

    def test_dip_day_does_not_inflate_growth(self):
        # yesterday dipped to 50 but 7-day avg is higher -> baseline stays high
        latest, prev = tga.robust_baseline([60, 50, 100, 100, 100])
        self.assertGreater(prev, 50)  # not fooled by the dip

    def test_drops_zero_days(self):
        latest, prev = tga.robust_baseline([120, 0, 100])
        self.assertEqual(latest, 120)
        self.assertEqual(prev, 100)  # the 0 day is ignored

    def test_insufficient_data(self):
        self.assertEqual(tga.robust_baseline([100]), (None, None))
        self.assertEqual(tga.robust_baseline([0, 0]), (None, None))


if __name__ == '__main__':
    unittest.main()

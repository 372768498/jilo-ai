# crawler/tests/test_monetization_kit.py
#
# Monetization half-automation: rank leaks by expected revenue (not raw clicks)
# and produce a submit-ready application pack. The only un-automatable step is
# the human applying + pasting the tracking link.
import unittest

import monetization_kit as mk


class TestEpcAndRoi(unittest.TestCase):
    def test_category_epc_known_and_default(self):
        self.assertEqual(mk.category_epc('Coding'), mk.CATEGORY_EPC['Coding'])
        self.assertEqual(mk.category_epc('NoSuchCategory'), mk.DEFAULT_EPC)
        self.assertEqual(mk.category_epc(None), mk.DEFAULT_EPC)

    def test_roi_is_clicks_times_epc(self):
        tool = {'click_count': 10, 'category': 'Coding'}  # 10 * 1.5
        self.assertEqual(mk.roi_score(tool), 15.0)

    def test_roi_ranks_revenue_over_raw_clicks(self):
        # Fewer clicks but higher EPC can outrank more clicks at low EPC.
        high_epc = {'click_count': 12, 'category': 'Coding'}   # 12*1.5 = 18
        many_clicks = {'click_count': 20, 'category': 'Chatbot'}  # 20*0.7 = 14
        self.assertGreater(mk.roi_score(high_epc), mk.roi_score(many_clicks))

    def test_priority_thresholds(self):
        self.assertEqual(mk.priority_from_roi(25), 'high')
        self.assertEqual(mk.priority_from_roi(10), 'medium')
        self.assertEqual(mk.priority_from_roi(3), 'low')


class TestApplicationPack(unittest.TestCase):
    def setUp(self):
        self.tool = {
            'name_en': 'ElevenLabs', 'slug': 'elevenlabs', 'category': 'Audio',
            'click_count': 46, 'official_url': 'https://elevenlabs.io',
        }

    def test_pack_has_everything_needed_to_apply(self):
        pack = mk.build_application_pack(self.tool, site_pv_monthly=2000)
        self.assertEqual(pack['tool'], 'ElevenLabs')
        self.assertIn('elevenlabs', pack['our_page'])
        self.assertEqual(pack['outbound_clicks'], 46)
        self.assertEqual(pack['est_revenue_at_risk_usd'], round(46 * mk.category_epc('Audio'), 2))
        self.assertTrue(pack['where_to_apply'])          # has application targets
        self.assertIn('ElevenLabs', pack['pitch'])       # ready-to-paste pitch
        self.assertIn('2000', pack['pitch'])             # site stats included
        self.assertIn('affiliate_url', pack['next_step'])  # the human's one step

    def test_pitch_omits_pv_when_unknown(self):
        pack = mk.build_application_pack(self.tool, site_pv_monthly=None)
        self.assertNotIn('pageviews/month', pack['pitch'])


if __name__ == '__main__':
    unittest.main()

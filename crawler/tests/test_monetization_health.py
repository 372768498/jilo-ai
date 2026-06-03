# crawler/tests/test_monetization_health.py
#
# rank12 acceptance (A12): a non-empty affiliate_url is not proof of
# monetization — only a tracked link counts (invariant I5). A generic official
# URL must stay flagged, not falsely resolve.
import unittest

import monitor_agent as ma


class TestIsValidAffiliateUrl(unittest.TestCase):
    def test_generic_official_url_is_invalid(self):
        self.assertFalse(ma.is_valid_affiliate_url('https://runwayml.com'))
        self.assertFalse(ma.is_valid_affiliate_url('https://www.tool.com/pricing'))

    def test_empty_is_invalid(self):
        self.assertFalse(ma.is_valid_affiliate_url(''))
        self.assertFalse(ma.is_valid_affiliate_url(None))

    def test_non_http_is_invalid(self):
        self.assertFalse(ma.is_valid_affiliate_url('tool.com?ref=jilo'))  # no scheme

    def test_ref_param_is_valid(self):
        self.assertTrue(ma.is_valid_affiliate_url('https://tool.com/?ref=jilo'))

    def test_known_affiliate_domain_is_valid(self):
        self.assertTrue(ma.is_valid_affiliate_url('https://tool.sjv.io/abc123'))
        self.assertTrue(ma.is_valid_affiliate_url('https://impact.com/c/jilo/xyz'))

    def test_utm_and_partner_markers_valid(self):
        self.assertTrue(ma.is_valid_affiliate_url('https://tool.com/?utm_source=jilo&partner=1'))


if __name__ == '__main__':
    unittest.main()

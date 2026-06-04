# crawler/tests/test_aeo_classification.py
#
# Regression: the AEO intent classifier was English-only, so the site's single
# largest demand cluster — Chinese ChatGPT/Sora access & how-to queries (~900
# GSC impressions/mo) — was routed to low-priority SEO instead of citeable AEO
# answer pages. is_aeo_query must now recognize Chinese access/how-to/pricing
# intent, without over-claiming comparisons or bare brand/category queries.
import unittest

import traffic_growth_agent as t


class TestAeoClassification(unittest.TestCase):
    def test_chinese_access_intent_is_aeo(self):
        for q in [
            'chatgpt 怎么用', 'chatgpt 充值', 'chatgpt 国内怎么用',
            'chatgpt plus 订阅', 'chatgpt 镜像站', 'chatgpt 多少钱',
            'sora 怎么用', 'midjourney 怎么注册', 'chatgpt 怎么开通会员',
        ]:
            self.assertTrue(t.is_aeo_query(q), f"expected AEO: {q}")

    def test_english_aeo_still_recognized(self):
        self.assertTrue(t.is_aeo_query('how to use chatgpt in china'))
        self.assertTrue(t.is_aeo_query('is notion ai worth it'))

    def test_comparisons_are_not_aeo(self):
        # vs queries are comparison pages, not answer pages
        self.assertFalse(t.is_aeo_query('sora vs runway'))
        self.assertFalse(t.is_aeo_query('notion vs obsidian'))

    def test_bare_brand_and_category_not_aeo(self):
        # no how-to/access/pricing intent -> stays SEO, not over-claimed as AEO
        self.assertFalse(t.is_aeo_query('elevenlabs'))
        self.assertFalse(t.is_aeo_query('best ai video editor'))

    def test_empty_is_not_aeo(self):
        self.assertFalse(t.is_aeo_query(''))
        self.assertFalse(t.is_aeo_query(None))


if __name__ == '__main__':
    unittest.main()

# crawler/tests/test_brand_alternatives.py
#
# Content-side growth: competitor-brand queries we rank 20-33 for (phind,
# marketmuse, ...) get reframed into a directory-native "best <brand>
# alternatives" page instead of a thin brand-titled page.
import unittest

import strategy_engine as se


class TestBrandAlternativesKeyword(unittest.TestCase):
    def test_single_brand_reframed(self):
        self.assertEqual(se.brand_alternatives_keyword('phind'), 'best phind alternatives')
        self.assertEqual(se.brand_alternatives_keyword('marketmuse'), 'best marketmuse alternatives')

    def test_our_own_brand_not_reframed(self):
        self.assertEqual(se.brand_alternatives_keyword('jilo'), 'jilo')

    def test_generic_phrase_not_reframed(self):
        self.assertEqual(se.brand_alternatives_keyword('best ai video editor'), 'best ai video editor')
        self.assertEqual(se.brand_alternatives_keyword('free tools'), 'free tools')

    def test_category_query_left_to_hub(self):
        # 'video' routes to a hub, so it must not become an alternatives page
        self.assertEqual(se.brand_alternatives_keyword('video'), 'video')

    def test_already_alternatives_unchanged(self):
        self.assertEqual(se.brand_alternatives_keyword('notion alternatives'), 'notion alternatives')

    def test_too_long_or_nonalpha_unchanged(self):
        self.assertEqual(se.brand_alternatives_keyword('a b c d'), 'a b c d')
        self.assertEqual(se.brand_alternatives_keyword('gpt4'), 'gpt4')  # has digit

    def test_reframed_dedup_key_differs_from_bare_brand(self):
        # ensures the alternatives page won't collide with a legacy bare-brand page
        kw = se.brand_alternatives_keyword('phind')
        self.assertNotEqual(se._slugify(kw), se._slugify('phind'))


if __name__ == '__main__':
    unittest.main()

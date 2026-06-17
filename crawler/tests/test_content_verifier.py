# crawler/tests/test_content_verifier.py
#
# PURE unit tests for the pre-publish verifier. No supabase/openai/creds.
# One test per gate: 5 known-bad samples (each should BLOCK / NEEDS_FIX as
# appropriate) plus 1 good sample that PASSes.
import unittest

import content_verifier as cv


# A long, genuinely Chinese body that clears the thin + cjk-ratio gates.
GOOD_ZH = (
    "这是一篇关于人工智能写作工具的详细中文文章。"
    "本文介绍了该工具的核心功能、适用人群以及使用场景，"
    "并且对它的优点和不足进行了客观的比较和分析。"
    "我们还讨论了如何根据自身需求选择合适的工具，"
    "包括定价层级、上手难度以及与其他产品的差异。"
) * 20

# A long, genuinely English body that clears the thin gate for en content.
GOOD_EN = (
    "This is a detailed English article about AI writing tools. "
    "It explains what the tool does, who it is for, and how to choose. "
    "We compare features, pricing tiers, pros, cons, and real use cases. "
) * 40


class TestRealTranslationGate(unittest.TestCase):
    """BAD sample 1: fake-bilingual — English text masquerading as content_zh
    (the content_zh<-content_en fallback). Must BLOCK on real_translation."""

    def test_english_as_zh_is_blocked(self):
        item = {
            'content_en': GOOD_EN,
            'content_zh': GOOD_EN,  # identical English fallback
            'target_keyword': 'ai writing assistant for teams',
        }
        result = cv.verify_publishable(item, 'seo_article')
        self.assertFalse(result['ok'])
        self.assertEqual(result['verdict'], 'BLOCK')
        self.assertIn('real_translation', result['failed_gates'])


class TestDirtySourceGate(unittest.TestCase):
    """BAD sample 2: profanity / dirty source. Must BLOCK on dirty_source."""

    def test_profanity_is_blocked(self):
        item = {
            'content_en': GOOD_EN + " this tool is fucking garbage spam ",
            'content_zh': GOOD_ZH,
            'target_keyword': 'ai note taking app for students',
        }
        result = cv.verify_publishable(item, 'seo_article')
        self.assertFalse(result['ok'])
        self.assertEqual(result['verdict'], 'BLOCK')
        self.assertIn('dirty_source', result['failed_gates'])


class TestThinGate(unittest.TestCase):
    """BAD sample 3: thin tool page (~name + tagline only). Must BLOCK on thin."""

    def test_thin_tool_page_is_blocked(self):
        item = {
            'name_en': 'Acme AI',
            'long_description_en': 'Acme AI — the best AI tool.',  # ~name+tagline
        }
        result = cv.verify_publishable(item, 'tool')
        self.assertFalse(result['ok'])
        self.assertEqual(result['verdict'], 'BLOCK')
        self.assertIn('thin', result['failed_gates'])


class TestComplianceGate(unittest.TestCase):
    """BAD sample 4: gray-market compliance hit on the zh-access lane.
    Must BLOCK on compliance."""

    def test_graymarket_access_is_blocked(self):
        item = {
            'title_zh': 'ChatGPT Plus 代充值与合租共享账号教程',
            'content_zh': (
                '本文教你如何通过代充值和合租的方式共享账号，'
                '以及如何绕区使用，省钱又方便。' * 10
            ),
        }
        result = cv.verify_publishable(item, 'access')
        self.assertFalse(result['ok'])
        self.assertEqual(result['verdict'], 'BLOCK')
        self.assertIn('compliance', result['failed_gates'])

    def test_compliant_access_framing_passes(self):
        # Allowed framing: 适合谁 / 风险披露 / compare — no gray-market patterns.
        item = {
            'title_zh': '海外 AI 订阅怎么选：适合谁与风险披露',
            'content_zh': (
                '本文从适合谁的角度比较了几种海外 AI 订阅方案，'
                '并对各自的风险披露进行了说明，帮助你做出合规的选择。' * 10
            ),
        }
        result = cv.verify_publishable(item, 'access')
        self.assertNotIn('compliance', result['failed_gates'])


class TestRankableGate(unittest.TestCase):
    """BAD sample 5: unwinnable DA80 head term. Advisory NEEDS_FIX (not ok)."""

    def test_da80_head_term_needs_fix(self):
        item = {
            'content_en': GOOD_EN,
            'content_zh': GOOD_ZH,
            'target_keyword': 'best ai tools',  # DA80 head term
        }
        result = cv.verify_publishable(item, 'seo_article')
        self.assertFalse(result['ok'])
        self.assertEqual(result['verdict'], 'NEEDS_FIX')
        self.assertIn('rankable', result['failed_gates'])


class TestDedupGate(unittest.TestCase):
    """Dedup: an exact content_hash collision against the existing corpus
    must BLOCK."""

    def test_exact_duplicate_is_blocked(self):
        item = {
            'content_en': GOOD_EN,
            'content_zh': GOOD_ZH,
            'target_keyword': 'ai resume builder for engineers',
        }
        existing = {cv.content_hash(GOOD_EN)}
        result = cv.verify_publishable(item, 'seo_article', existing_hashes=existing)
        self.assertFalse(result['ok'])
        self.assertEqual(result['verdict'], 'BLOCK')
        self.assertIn('dedup', result['failed_gates'])


class TestGoodSamplePasses(unittest.TestCase):
    """GOOD sample: real bilingual, substantive, clean, niche keyword. PASS."""

    def test_good_article_passes(self):
        item = {
            'content_en': GOOD_EN,
            'content_zh': GOOD_ZH,
            'target_keyword': 'ai writing assistant for legal contracts',
        }
        result = cv.verify_publishable(item, 'seo_article')
        self.assertTrue(result['ok'], msg=result)
        self.assertEqual(result['verdict'], 'PASS')
        self.assertEqual(result['failed_gates'], [])


if __name__ == '__main__':
    unittest.main()

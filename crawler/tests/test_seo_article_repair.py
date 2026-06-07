import unittest

import quality_gates as qg
import seo_article_generator as sag


def base_article():
    content_en = " ".join(["This practical AI tools guide compares options and workflows."] * 80)
    content_zh = " ".join(["这是一份实用的 AI 工具指南，用于比较选项和工作流。"] * 80)
    return {
        "title_en": "Best AI Tools Guide",
        "meta_description_en": "Compare practical AI tools, use cases, tradeoffs, pricing tiers, and next steps before choosing the right platform.",
        "content_en": content_en,
        "title_zh": "最佳 AI 工具指南",
        "meta_description_zh": "比较实用 AI 工具、使用场景、取舍、价格层级和下一步选择。",
        "content_zh": content_zh,
        "target_keyword": "best AI tools",
    }


class TestSeoArticleRepair(unittest.TestCase):
    def test_repairs_overlong_seo_title(self):
        article = base_article()
        article["title_en"] = "Kling AI vs Runway Gen-3 vs Luma Dream Machine vs Sora Complete Comparison Guide"

        repaired, gate, changed = sag.check_with_repair(
            article,
            supabase=None,
            check_fn=qg.check_seo_article,
            article_type="seo",
            skip_dup=True,
        )

        self.assertTrue(changed)
        self.assertTrue(gate.ok)
        self.assertLessEqual(len(repaired["title_en"]), 70)

    def test_repairs_short_meta_description(self):
        article = base_article()
        article["meta_description_en"] = "Too short."

        repaired, gate, changed = sag.check_with_repair(
            article,
            supabase=None,
            check_fn=qg.check_seo_article,
            article_type="seo",
            skip_dup=True,
        )

        self.assertTrue(changed)
        self.assertTrue(gate.ok)
        self.assertGreaterEqual(len(repaired["meta_description_en"]), 100)
        self.assertLessEqual(len(repaired["meta_description_en"]), 170)

    def test_repairs_missing_chinese_fields_from_english_fallback(self):
        article = base_article()
        article["title_zh"] = ""
        article["meta_description_zh"] = ""
        article["content_zh"] = ""

        repaired, gate, changed = sag.check_with_repair(
            article,
            supabase=None,
            check_fn=qg.check_seo_article,
            article_type="seo",
            skip_dup=True,
        )

        self.assertTrue(changed)
        self.assertTrue(gate.ok)
        self.assertTrue(repaired["title_zh"])
        self.assertTrue(repaired["meta_description_zh"])
        self.assertTrue(repaired["content_zh"])

    def test_generation_none_retries_once(self):
        calls = {"count": 0}

        def generate():
            calls["count"] += 1
            return None if calls["count"] == 1 else base_article()

        article, retried = sag.generate_with_retry(generate, "generation failed")

        self.assertTrue(retried)
        self.assertEqual(calls["count"], 2)
        self.assertEqual(article["title_en"], "Best AI Tools Guide")


if __name__ == "__main__":
    unittest.main()

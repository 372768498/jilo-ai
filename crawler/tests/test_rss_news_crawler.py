# crawler/tests/test_rss_news_crawler.py
import unittest
from unittest.mock import patch, MagicMock

class TestSlugAndHash(unittest.TestCase):
    def test_generate_slug(self):
        from rss_news_crawler import generate_slug
        self.assertEqual(generate_slug("Hello World!"), "hello-world")
        self.assertEqual(generate_slug("OpenAI Launches GPT-5"), "openai-launches-gpt-5")
        # Long title truncated
        long_title = "A" * 200
        slug = generate_slug(long_title)
        self.assertLessEqual(len(slug), 100)

    def test_generate_content_hash(self):
        from rss_news_crawler import generate_content_hash
        h1 = generate_content_hash("Title A", "https://example.com/a")
        h2 = generate_content_hash("Title B", "https://example.com/b")
        self.assertNotEqual(h1, h2)
        # Same input = same hash
        h3 = generate_content_hash("Title A", "https://example.com/a")
        self.assertEqual(h1, h3)

class TestClassifyNews(unittest.TestCase):
    def test_classify_product_launch(self):
        from rss_news_crawler import classify_news
        tags = classify_news("OpenAI launches new GPT model", "OpenAI announced the launch of their latest model")
        self.assertIn("product_launch", tags)

    def test_classify_funding(self):
        from rss_news_crawler import classify_news
        tags = classify_news("AI startup raises $100M Series B", "The funding round was led by Sequoia")
        self.assertIn("funding", tags)

    def test_classify_research(self):
        from rss_news_crawler import classify_news
        tags = classify_news("New paper on transformer architecture", "Researchers published findings on attention mechanisms")
        self.assertIn("research", tags)

if __name__ == '__main__':
    unittest.main()

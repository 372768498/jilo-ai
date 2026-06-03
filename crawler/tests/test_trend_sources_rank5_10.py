# crawler/tests/test_trend_sources_rank5_10.py
#
# rank5 (A5): GSC breakout query detection.
# rank10 (A10): real engagement parsing + competitor sitemap diff-by-lastmod.
import unittest
from datetime import datetime

import trend_agent as ta
import trend_sources as ts


class TestEmergingQueries(unittest.TestCase):
    def _rows(self):
        # 6 dated days; "ai video editor" jumps from ~0 to high in the recent 3.
        rows = []
        # prior window (older 3 days): query barely present
        for d in ['2026-05-25', '2026-05-26', '2026-05-27']:
            rows.append({'date': d, 'query': 'ai video editor', 'impressions': 0, 'position': 28})
            rows.append({'date': d, 'query': 'stable query', 'impressions': 50, 'position': 12})
        # recent window (latest 3 days): breakout
        for d in ['2026-05-28', '2026-05-29', '2026-05-30']:
            rows.append({'date': d, 'query': 'ai video editor', 'impressions': 40, 'position': 18})
            rows.append({'date': d, 'query': 'stable query', 'impressions': 50, 'position': 12})
        return rows

    def test_detects_breakout_from_zero(self):
        emerging = ta.detect_emerging_queries(self._rows())
        keys = [e['query'] for e in emerging]
        self.assertIn('ai video editor', keys)

    def test_ignores_flat_query(self):
        emerging = ta.detect_emerging_queries(self._rows())
        keys = [e['query'] for e in emerging]
        self.assertNotIn('stable query', keys)  # no growth -> not emerging

    def test_position_filter_excludes_deep_results(self):
        rows = [
            {'date': '2026-05-28', 'query': 'deep q', 'impressions': 40, 'position': 80},
            {'date': '2026-05-29', 'query': 'deep q', 'impressions': 40, 'position': 80},
            {'date': '2026-05-30', 'query': 'deep q', 'impressions': 40, 'position': 80},
        ]
        self.assertEqual(ta.detect_emerging_queries(rows), [])


class TestParseCount(unittest.TestCase):
    def test_parses_stars_with_comma(self):
        self.assertEqual(ts._parse_count('1,234 stars today'), 1234)

    def test_no_number_is_zero(self):
        self.assertEqual(ts._parse_count('stars today'), 0)


class TestCompetitorSitemap(unittest.TestCase):
    SITEMAP = """<?xml version="1.0"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://rival.com/best-ai-video-tools</loc><lastmod>2026-05-30</lastmod></url>
      <url><loc>https://rival.com/old-ai-page</loc><lastmod>2026-01-01</lastmod></url>
      <url><loc>https://rival.com/no-mod</loc></url>
    </urlset>"""

    def test_only_recent_pages_returned(self):
        now = datetime(2026, 6, 1)
        pages = ts.parse_sitemap_recent(self.SITEMAP, now=now, recent_days=7)
        urls = [p['url'] for p in pages]
        self.assertIn('https://rival.com/best-ai-video-tools', urls)
        self.assertNotIn('https://rival.com/old-ai-page', urls)   # too old
        self.assertNotIn('https://rival.com/no-mod', urls)        # no lastmod

    def test_slug_becomes_keyword(self):
        now = datetime(2026, 6, 1)
        pages = ts.parse_sitemap_recent(self.SITEMAP, now=now, recent_days=7)
        self.assertEqual(pages[0]['keyword'], 'best ai video tools')


if __name__ == '__main__':
    unittest.main()

# crawler/tests/test_gsc_rising_keyword.py
#
# GSC-rising fix: breakout queries that were being thrown away (0 enqueued from
# 4 detected) now convert into actionable keywords. Competitor-brand demand
# becomes an alternatives page; our own brand / generic noise is still dropped.
import unittest

import trend_agent as ta


class TestGscActionableKeyword(unittest.TestCase):
    def test_competitor_brand_becomes_alternatives(self):
        # 'marketmuse' (pos 22 in real GSC) -> a monetizable alternatives page
        self.assertEqual(ta._gsc_actionable_keyword('marketmuse'), 'best marketmuse alternatives')

    def test_clean_two_token_competitor_brand(self):
        # two non-generic alpha tokens reframe; 'X ai' is dropped (the 'ai'
        # stopword + it's a dup of the bare-brand page that already covers it)
        self.assertEqual(ta._gsc_actionable_keyword('perplexity pages'), 'best perplexity pages alternatives')
        self.assertIsNone(ta._gsc_actionable_keyword('marketmuse ai'))

    def test_own_brand_is_dropped(self):
        self.assertIsNone(ta._gsc_actionable_keyword('jilo'))
        self.assertIsNone(ta._gsc_actionable_keyword('jilo chat'))

    def test_buyer_intent_query_passes_through(self):
        self.assertEqual(ta._gsc_actionable_keyword('best ai video editor'), 'best ai video editor')

    def test_empty_is_none(self):
        self.assertIsNone(ta._gsc_actionable_keyword(''))
        self.assertIsNone(ta._gsc_actionable_keyword(None))

    def test_previously_rejected_queries_now_capture_competitor_demand(self):
        # The 4 real queries from the live run (was 0 enqueued). Own-brand drops;
        # 'marketmuse ai' is a dup of 'marketmuse'. Net: the marketmuse competitor
        # demand is now captured by one alternatives page (0 -> 1, non-duplicative).
        live = ['jilo', 'jilo chat', 'marketmuse', 'marketmuse ai']
        kws = [ta._gsc_actionable_keyword(q) for q in live]
        self.assertEqual(kws, [None, None, 'best marketmuse alternatives', None])


if __name__ == '__main__':
    unittest.main()

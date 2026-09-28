import unittest
from datetime import date
from unittest.mock import MagicMock, patch
import lookback_agent as lookback
import traffic_growth_agent as traffic
from data_health import analytics_health


class TestFreshnessConsumers(unittest.TestCase):
    def health_db(self, ga, gsc=None, marker=None):
        db = MagicMock()
        def table(name):
            q = MagicMock()
            q.select.return_value = q.order.return_value = q.limit.return_value = q.like.return_value = q
            if name == 'growth_state':
                q.execute.return_value.data = [{'value': {'date': marker, 'data_state': 'final'}}] if marker else []
            else:
                value = ga if name == 'analytics_site_daily' else gsc
                q.execute.return_value.data = [{'date': value}] if value else []
            return q
        db.table.side_effect = table
        return db

    def test_fresh_ga_and_lagged_gsc_are_ready(self):
        result = analytics_health(self.health_db('2026-09-27', '2026-09-24', '2026-09-24'), date(2026, 9, 28))
        self.assertTrue(result['ready'])

    def test_completed_zero_row_gsc_day_counts_as_observed(self):
        result = analytics_health(self.health_db('2026-09-27', marker='2026-09-25'), date(2026, 9, 28))
        self.assertTrue(result['ready'])
        self.assertEqual(result['gsc_date'], '2026-09-25')

    def test_missing_gsc_cannot_hide_behind_fresh_ga(self):
        self.assertFalse(analytics_health(self.health_db('2026-09-27'), date(2026, 9, 28))['ready'])

    def test_partial_gsc_rows_without_completion_marker_are_not_ready(self):
        self.assertFalse(analytics_health(self.health_db('2026-09-27', '2026-09-25'), date(2026, 9, 28))['ready'])

    def test_pv_pair_preserves_true_zero(self):
        db = MagicMock()
        db.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value.data = [
            {'date': '2026-09-27', 'total_pageviews': 0}, {'date': '2026-09-26', 'total_pageviews': 100}]
        latest, previous = traffic.latest_pv_pair(db, expected_date='2026-09-27')
        self.assertEqual(latest, {'date': '2026-09-27', 'pv': 0})
        self.assertEqual(previous['pv'], 100)

    def test_pv_pair_never_bridges_a_month_long_gap(self):
        db = MagicMock()
        db.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value.data = [
            {'date': '2026-09-27', 'total_pageviews': 0}, {'date': '2026-08-14', 'total_pageviews': 150}, {'date': '2026-08-13', 'total_pageviews': 100}]
        self.assertEqual(traffic.latest_pv_pair(db, expected_date='2026-09-27'), (None, None))

    def test_real_zero_pageviews_can_be_saved_when_collection_is_fresh(self):
        db = MagicMock()
        from datetime import datetime, timedelta
        pub = (datetime.utcnow().date() - timedelta(days=1)).isoformat()
        pages = [{'content_type': 'seo_article', 'slug': 'zero', 'published_at': pub + 'T00:00:00Z'}]
        with patch.object(lookback, 'require_fresh_analytics', return_value={'ga_date': pub, 'gsc_date': pub}), patch.object(lookback, '_collect_pages', return_value=pages), patch.object(lookback, '_gsc_snapshot', return_value=None), patch.object(lookback, '_ga_pageviews', return_value=0):
            self.assertEqual(lookback.capture_due_snapshots(db), 1)
        self.assertEqual(db.table.return_value.upsert.call_args.args[0]['pageviews'], 0)

    def stale_db(self):
        db = MagicMock()
        db.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value.data = [{'date': '2026-08-14', 'total_pageviews': 80}]
        return db

    def test_stale_analytics_never_writes_a_zero_lookback(self):
        db = self.stale_db()
        with patch.object(lookback, '_collect_pages', return_value=[]):
            with self.assertRaisesRegex(RuntimeError, 'analytics'):
                lookback.capture_due_snapshots(db)
        db.table.return_value.upsert.assert_not_called()

    def test_stale_analytics_does_not_enqueue_growth_actions(self):
        db = self.stale_db()
        with patch.object(traffic, 'get_supabase', return_value=db), patch.object(traffic, 'enqueue_gsc_growth_actions') as enqueue:
            with self.assertRaisesRegex(RuntimeError, 'analytics'):
                traffic.run()
        enqueue.assert_not_called()


if __name__ == '__main__': unittest.main()

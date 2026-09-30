import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

import daily_report as dr
import failure_chain as fc
from fake_database import Database


class ReportRecoveryTests(unittest.TestCase):
    def test_queue_read_failure_is_not_reported_as_zero(self):
        db = Database()
        original = db.table
        def table(name):
            if name in ('action_queue', 'page_performance_lookback'):
                raise RuntimeError('database unavailable')
            return original(name)
        with patch.object(db,'table',side_effect=table), patch.object(dr,'create_client',return_value=db):
            stats = dr.get_today_stats()
        text = dr.format_daily_report(stats)
        self.assertIn('队列读取失败',text)
        self.assertIn('回看读取失败',text)
        self.assertNotIn('捕获 0 个',text)
        self.assertNotIn('待执行 0 条',text)

    def test_nested_auth_failure_is_permission_blocker(self):
        with patch('failure_chain.aq.enqueue', return_value=True) as enqueue:
            fc.enqueue_ops_failure(None, 'seo_articles', 'saved=0 failed=1', {
                'failure_reasons': ['503 auth_unavailable: HMAC signature cannot be verified']})
        self.assertEqual(enqueue.call_args.kwargs['payload']['subtype'], 'system_env_invalid')

    def test_midnight_report_preserves_missing_and_previous_failure(self):
        today = datetime.utcnow().strftime('%Y-%m-%d')
        yesterday = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')
        older = (datetime.utcnow() - timedelta(days=2)).strftime('%Y-%m-%d')
        db = Database(analytics_site_daily=[{'date': older, 'total_pageviews': 120, 'total_users': 126}],
                      ops_logs=[{'id': 'fail', 'job_name': 'seo_articles', 'status': 'error',
                                 'message': 'auth_unavailable', 'created_at': yesterday + 'T23:57:00Z',
                                 'details': {'saved': 1, 'failed': 1}}])
        with patch.object(dr, 'create_client', return_value=db):
            stats = dr.get_today_stats()
        self.assertIsNone(stats['pv'])
        self.assertIsNone(stats['uv'])
        self.assertTrue(any('seo_articles' in e for e in stats['errors']))
        self.assertEqual(stats['seo_articles'], 1)
        rendered = dr.format_daily_report(stats)
        self.assertIn('缺测', rendered)
        self.assertIn(yesterday, rendered)
        self.assertNotIn('PV: 0', rendered)

    def test_gapped_week_is_not_growth_evidence(self):
        rows = [{'date': (datetime(2026, 9, 1) + timedelta(days=i * 2)).strftime('%Y-%m-%d'),
                 'total_pageviews': 100} for i in range(14)]
        self.assertIsNone(dr.smoothed_growth(rows)['met'])


if __name__ == '__main__': unittest.main()

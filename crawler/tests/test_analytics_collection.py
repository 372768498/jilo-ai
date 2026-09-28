import unittest
from types import SimpleNamespace as NS
from unittest.mock import MagicMock, patch
import analytics_collector as ac


def ga_row(dimensions, metrics):
    return NS(dimension_values=[NS(value=v) for v in dimensions],
              metric_values=[NS(value=str(v)) for v in metrics])


class TestAnalyticsCollection(unittest.TestCase):
    def test_ga_paginates_and_writes_site_total_after_details(self):
        client = MagicMock()
        page = ga_row(['/a', 'Organic Search'], [2, 1, 3.0, 0.0])
        site = ga_row([], [4, 1, 1])
        client.run_report.side_effect = [NS(rows=[page], row_count=2),
                                       NS(rows=[page], row_count=2),
                                       NS(rows=[site], row_count=1),
                                       NS(rows=[], row_count=0)]
        db = MagicMock()
        with patch.object(ac, 'get_google_credentials'), patch.object(ac, 'BetaAnalyticsDataClient', return_value=client), patch.object(ac, 'create_client', return_value=db):
            self.assertEqual(ac.collect_ga_data('2026-08-29'), 2)
        requests = [c.args[0] for c in client.run_report.call_args_list]
        self.assertEqual([r.offset for r in requests[:2]], [0, 1])
        self.assertEqual(requests[0].date_ranges[0].start_date, '2026-08-29')
        self.assertEqual(db.table.call_args_list[-1].args[0], 'analytics_site_daily')

    def test_gsc_paginates_until_empty_tail(self):
        row = {'keys': ['ai', 'https://www.jilo.ai/en', '2026-08-29'], 'clicks': 1, 'impressions': 2, 'ctr': .5, 'position': 1}
        responses = []
        for data in [[row], []]:
            r = MagicMock(); r.json.return_value = {'rows': data}; responses.append(r)
        with patch.object(ac, 'GSC_PAGE_SIZE', 1), patch.object(ac, 'get_google_credentials'), patch.object(ac, 'create_client'), patch.object(ac.http_requests, 'post', side_effect=responses) as post:
            self.assertEqual(ac.collect_gsc_data('2026-08-29', '2026-08-29'), 1)
        self.assertEqual([c.kwargs['json']['startRow'] for c in post.call_args_list], [0, 1])

    def test_gsc_partial_write_never_publishes_completion_marker(self):
        row = {'keys': ['ai', 'https://example.com/a', '2026-08-29'], 'clicks': 1, 'impressions': 2, 'ctr': .5, 'position': 1}
        response = MagicMock(); response.json.return_value = {'rows': [row]}
        db = MagicMock()
        with patch.object(ac, 'GSC_PAGE_SIZE', 1), patch.object(ac, 'get_google_credentials'), patch.object(ac, 'create_client', return_value=db), patch.object(ac.http_requests, 'post', side_effect=[response, RuntimeError('page two failed')]), self.assertRaisesRegex(RuntimeError, 'page two failed'):
            ac.collect_gsc_data('2026-08-29', '2026-08-29')
        self.assertEqual([c.args[0] for c in db.table.call_args_list], ['search_console_daily'])

    def test_ai_referrer_write_failure_prevents_completion(self):
        db = MagicMock(); db.table.return_value.upsert.return_value.execute.side_effect = RuntimeError('referrer write failed')
        client = MagicMock(); client.run_report.side_effect = [NS(rows=[], row_count=0), NS(rows=[ga_row([], [1, 1, 1])], row_count=1), NS(rows=[ga_row(['/a', 'chatgpt.com / referral'], [1, 1, 1])], row_count=1)]
        with patch.object(ac, 'get_google_credentials'), patch.object(ac, 'BetaAnalyticsDataClient', return_value=client), patch.object(ac, 'create_client', return_value=db), self.assertRaisesRegex(RuntimeError, 'referrer write failed'):
            ac.collect_ga_data('2026-08-29')
        self.assertNotIn('analytics_site_daily', [c.args[0] for c in db.table.call_args_list])

    def test_no_configuration_is_a_failure(self):
        with patch.object(ac, 'GA_PROPERTY_ID', ''), patch.object(ac, 'GSC_SITE_URL', ''), patch.object(ac, 'log_operation'), patch.object(ac, 'FEISHU_WEBHOOK_URL', ''):
            self.assertEqual(ac.main([]), 1)

    def test_rejects_one_sided_reversed_and_unbounded_backfills(self):
        for start, end in [('2026-08-29', None), ('2026-09-01', '2026-08-29'), ('2025-01-01', '2026-09-01')]:
            with self.subTest(start=start, end=end), self.assertRaises(ValueError):
                ac.validate_window(start, end)

    def test_backfill_requires_explicit_dates_before_network(self):
        with patch.dict('os.environ', {'ANALYTICS_START_DATE': '', 'ANALYTICS_END_DATE': ''}), patch.object(ac, 'get_google_credentials') as credentials, patch.object(ac, 'log_operation'), patch.object(ac, 'FEISHU_WEBHOOK_URL', ''):
            self.assertEqual(ac.main(['--require-window']), 1)
        credentials.assert_not_called()

    def test_explicit_range_includes_both_days(self):
        with patch.object(ac, 'GA_PROPERTY_ID', '1'), patch.object(ac, 'GSC_SITE_URL', 'sc-domain:example.com'), patch.object(ac, 'get_google_credentials'), patch.object(ac, 'collect_ga_data', return_value=1) as ga, patch.object(ac, 'collect_gsc_data', return_value=2) as gsc, patch.object(ac, 'log_operation', return_value=True):
            self.assertEqual(ac.main(['--start-date', '2026-08-29', '--end-date', '2026-08-30']), 0)
        self.assertEqual([c.args[0] for c in ga.call_args_list], ['2026-08-29', '2026-08-30'])
        gsc.assert_called_once_with('2026-08-29', '2026-08-30')

    def test_site_write_failure_propagates(self):
        db = MagicMock(); db.table.return_value.upsert.return_value.execute.side_effect = RuntimeError('DB write failed')
        client = MagicMock(); client.run_report.side_effect = [NS(rows=[], row_count=0), NS(rows=[ga_row([], [0, 0, 0])], row_count=1), NS(rows=[], row_count=0)]
        with patch.object(ac, 'get_google_credentials'), patch.object(ac, 'BetaAnalyticsDataClient', return_value=client), patch.object(ac, 'create_client', return_value=db), self.assertRaisesRegex(RuntimeError, 'DB write failed'):
            ac.collect_ga_data('2026-08-29')


if __name__ == '__main__': unittest.main()

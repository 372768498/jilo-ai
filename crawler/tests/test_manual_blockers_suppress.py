# crawler/tests/test_manual_blockers_suppress.py
#
# rank11 acceptance (A11b / I6): the manual-blockers card is suppressed when
# there's nothing to act on — no daily empty "nothing to do" noise.
import unittest
from unittest.mock import patch

import manual_blockers_report as mbr


class TestManualBlockersSuppression(unittest.TestCase):
    @patch('manual_blockers_report.FEISHU_WEBHOOK_URL', 'https://hook')
    @patch('manual_blockers_report.send_feishu_card')
    @patch('manual_blockers_report.log_operation')
    @patch('manual_blockers_report.load_manual_blockers')
    def test_empty_blockers_are_not_sent(self, mock_load, mock_log, mock_send):
        mock_load.return_value = {'schema_flags': [], 'system_flags': [], 'monetization_flags': []}
        result = mbr.send_manual_blockers_report()
        self.assertFalse(result)
        mock_send.assert_not_called()  # suppressed, no card

    @patch('manual_blockers_report.FEISHU_WEBHOOK_URL', 'https://hook')
    @patch('manual_blockers_report.send_feishu_card', return_value=True)
    @patch('manual_blockers_report.log_operation')
    @patch('manual_blockers_report.load_manual_blockers')
    def test_nonempty_blockers_are_sent(self, mock_load, mock_log, mock_send):
        mock_load.return_value = {
            'schema_flags': [],
            'monetization_flags': [{'name': 'Runway', 'slug': 'runway', 'click_count': 12, 'priority': 'high'}],
        }
        result = mbr.send_manual_blockers_report()
        self.assertTrue(result)
        mock_send.assert_called_once()

    @patch('manual_blockers_report.FEISHU_WEBHOOK_URL', 'https://hook')
    @patch('manual_blockers_report.send_feishu_card', return_value=True)
    @patch('manual_blockers_report.log_operation')
    @patch('manual_blockers_report.load_manual_blockers')
    def test_system_failure_blockers_are_sent(self, mock_load, mock_log, mock_send):
        mock_load.return_value = {
            'schema_flags': [],
            'system_flags': [{
                'priority': 'high',
                'job_name': 'seo_articles',
                'subtype': 'system_env_invalid',
                'summary': 'OPENAI_API_KEY is invalid',
                'repair_hint': 'Replace OPENAI_API_KEY.',
                'message': 'invalid_api_key',
            }],
            'monetization_flags': [],
        }
        result = mbr.send_manual_blockers_report()
        self.assertTrue(result)
        content = mock_send.call_args.args[2]
        self.assertIn('系统失败责任链', content)
        self.assertIn('seo_articles', content)

    def test_only_true_manual_system_subtypes_are_reported(self):
        self.assertIn('system_env_invalid', mbr.MANUAL_SYSTEM_SUBTYPES)
        self.assertIn('system_external_access', mbr.MANUAL_SYSTEM_SUBTYPES)
        self.assertNotIn('system_action_failed', mbr.MANUAL_SYSTEM_SUBTYPES)
        self.assertNotIn('system_partial_failure', mbr.MANUAL_SYSTEM_SUBTYPES)


if __name__ == '__main__':
    unittest.main()

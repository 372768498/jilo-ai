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
        mock_load.return_value = {'schema_flags': [], 'monetization_flags': []}
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


if __name__ == '__main__':
    unittest.main()

# crawler/tests/test_feishu_bot.py
import unittest
from unittest.mock import patch, MagicMock

class TestFeishuBot(unittest.TestCase):
    @patch('feishu_bot.requests.post')
    def test_send_card_message(self, mock_post):
        mock_post.return_value = MagicMock(status_code=200, json=lambda: {"StatusCode": 0})

        from feishu_bot import send_feishu_card
        result = send_feishu_card(
            webhook_url="https://open.feishu.cn/open-apis/bot/v2/hook/test",
            title="Test Report",
            content="**PV:** 1234\n**UV:** 567"
        )
        self.assertTrue(result)

        call_json = mock_post.call_args[1]["json"]
        self.assertEqual(call_json["msg_type"], "interactive")
        self.assertIn("Test Report", call_json["card"]["header"]["title"]["content"])

    @patch('feishu_bot.requests.post')
    def test_send_alert(self, mock_post):
        mock_post.return_value = MagicMock(status_code=200, json=lambda: {"StatusCode": 0})

        from feishu_bot import send_feishu_alert
        result = send_feishu_alert(
            webhook_url="https://open.feishu.cn/open-apis/bot/v2/hook/test",
            title="Error Alert",
            message="Job failed: news_crawler",
            level="error"
        )
        self.assertTrue(result)

    @patch('feishu_bot.requests.post')
    def test_send_fails_gracefully(self, mock_post):
        mock_post.side_effect = Exception("Network error")

        from feishu_bot import send_feishu_card
        result = send_feishu_card("https://example.com", "Title", "Content")
        self.assertFalse(result)

if __name__ == '__main__':
    unittest.main()

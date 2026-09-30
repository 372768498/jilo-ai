import unittest
from unittest.mock import MagicMock, patch
import llm_client
import trend_agent


class PreflightTests(unittest.TestCase):
    @patch('ops_logger.log_operation', return_value=True)
    @patch('llm_client.get_openai_client')
    def test_auth_error_is_sanitized_and_not_success(self, client, log):
        client.side_effect = RuntimeError('HMAC signature cannot be verified: apikey: SECRET')
        with self.assertRaisesRegex(RuntimeError, 'authentication unavailable'):
            llm_client.check_llm_health()
        self.assertNotIn('SECRET', str(log.call_args))
        self.assertEqual(log.call_args.args[1], 'error')

    def test_trend_failed_model_zero_output_is_error(self):
        with patch.object(trend_agent,'log_operation',return_value=True) as log:
            result = trend_agent.record_trend_result(0, 0, [], 'auth_unavailable', [])
        self.assertEqual(result,1)
        self.assertEqual(log.call_args.args[1],'error')

    def test_optional_source_failure_does_not_erase_real_output(self):
        with patch.object(trend_agent,'log_operation',return_value=True) as log:
            result = trend_agent.record_trend_result(2, 0, [], None, [{'source':'reddit','error':'403'}])
        self.assertEqual(result,0)
        self.assertEqual(log.call_args.args[1],'success')
        self.assertEqual(log.call_args.args[3]['source_failures'][0]['source'],'reddit')


if __name__ == '__main__': unittest.main()

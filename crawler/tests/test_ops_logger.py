# crawler/tests/test_ops_logger.py
import unittest
from unittest.mock import MagicMock, patch

class TestOpsLogger(unittest.TestCase):
    @patch('ops_logger.create_client')
    def test_log_success(self, mock_create):
        mock_supabase = MagicMock()
        mock_create.return_value = mock_supabase
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "1"}])

        from ops_logger import log_operation
        log_operation("test_job", "success", "All good", {"count": 5})

        mock_supabase.table.assert_called_with("ops_logs")
        call_args = mock_supabase.table.return_value.insert.call_args[0][0]
        self.assertEqual(call_args["job_name"], "test_job")
        self.assertEqual(call_args["status"], "success")
        self.assertEqual(call_args["message"], "All good")
        self.assertEqual(call_args["details"], {"count": 5})

    @patch('ops_logger.create_client')
    def test_log_error_does_not_raise(self, mock_create):
        mock_create.side_effect = Exception("DB down")

        from ops_logger import log_operation
        # Should not raise
        log_operation("test_job", "error", "Failed")

if __name__ == '__main__':
    unittest.main()

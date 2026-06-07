import unittest
from unittest.mock import patch

import ops_heartbeat_chain as ohc


class TestOpsHeartbeatChain(unittest.TestCase):
    @patch("ops_heartbeat_chain._insert_flag", return_value=True)
    @patch("ops_heartbeat_chain._active_flag_exists", return_value=False)
    @patch("ops_heartbeat_chain._resolve_job_flags", return_value=0)
    def test_failed_github_job_enters_responsibility_chain(self, mock_resolve, mock_exists, mock_insert):
        result = ohc.enqueue_failed_jobs(
            {
                "seo-articles": {"result": "failure"},
                "trend-agent": {"result": "success"},
                "weekly-report": {"result": "skipped"},
            },
            "service-key",
            {
                "workflow": "Daily Ops Pipeline",
                "run_id": "123",
                "run_attempt": "1",
                "run_url": "https://github.com/o/r/actions/runs/123",
                "event_name": "schedule",
                "schedule": "0 2 * * *",
            },
        )

        self.assertEqual(result, {"opened": 1, "resolved": 0})
        payload = mock_insert.call_args.args[1]
        self.assertEqual(payload["action_type"], "flag_for_review")
        self.assertEqual(payload["priority"], "high")
        self.assertEqual(payload["payload"]["subtype"], "system_github_actions_job_failed")
        self.assertEqual(payload["payload"]["job_name"], "seo-articles")
        self.assertIn("GitHub Actions job", payload["reason"])
        mock_resolve.assert_called_once_with("service-key", "trend-agent", "123")

    @patch("ops_heartbeat_chain._insert_flag")
    @patch("ops_heartbeat_chain._active_flag_exists", return_value=True)
    @patch("ops_heartbeat_chain._resolve_job_flags", return_value=0)
    def test_active_failure_flag_is_deduped(self, mock_resolve, mock_exists, mock_insert):
        result = ohc.enqueue_failed_jobs(
            {"seo-articles": {"result": "failure"}},
            "service-key",
            {"workflow": "Daily Ops Pipeline", "run_id": "123"},
        )
        self.assertEqual(result, {"opened": 0, "resolved": 0})
        mock_insert.assert_not_called()

    @patch("ops_heartbeat_chain._insert_flag")
    @patch("ops_heartbeat_chain._active_flag_exists")
    @patch("ops_heartbeat_chain._resolve_job_flags", return_value=2)
    def test_success_resolves_prior_github_failure_flags(self, mock_resolve, mock_exists, mock_insert):
        result = ohc.enqueue_failed_jobs(
            {"seo-articles": {"result": "success"}},
            "service-key",
            {"workflow": "Daily Ops Pipeline", "run_id": "124"},
        )
        self.assertEqual(result, {"opened": 0, "resolved": 2})
        mock_insert.assert_not_called()
        mock_exists.assert_not_called()


if __name__ == "__main__":
    unittest.main()

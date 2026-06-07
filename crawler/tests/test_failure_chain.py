import unittest
from unittest.mock import MagicMock, patch

import action_queue as aq
import failure_chain


class TestFailureChain(unittest.TestCase):
    def test_classifies_missing_schema_as_high_priority(self):
        info = failure_chain.classify_failure(
            "analytics_collector",
            "Could not find the table 'public.analytics_site_daily' in the schema cache",
        )
        self.assertEqual(info["subtype"], "system_schema_missing")
        self.assertEqual(info["priority"], "high")

    def test_classifies_invalid_openai_key_as_env_blocker(self):
        info = failure_chain.classify_failure(
            "seo_articles",
            "Error code: 401 - invalid_api_key: Incorrect API key provided",
        )
        self.assertEqual(info["subtype"], "system_env_invalid")
        self.assertEqual(info["priority"], "high")

    @patch("failure_chain.aq.enqueue", return_value=True)
    def test_ops_error_enqueues_review_flag(self, mock_enqueue):
        supabase = MagicMock()
        result = failure_chain.enqueue_ops_failure(
            supabase,
            "seo_articles",
            "OPENAI_API_KEY not configured",
            {"run_id": "123"},
        )
        self.assertTrue(result)
        kwargs = mock_enqueue.call_args.kwargs
        self.assertEqual(kwargs["action_type"], "flag_for_review")
        self.assertEqual(kwargs["payload"]["subtype"], "system_env_missing")
        self.assertEqual(kwargs["payload"]["job_name"], "seo_articles")
        self.assertEqual(kwargs["priority"], "high")
        self.assertTrue(kwargs["dedup_key"].startswith("flag:system:"))

    @patch("failure_chain.aq.enqueue", return_value=True)
    def test_terminal_action_failure_enqueues_review_flag(self, mock_enqueue):
        supabase = MagicMock()
        action = {
            "id": "a1",
            "action_type": "generate_seo_content",
            "dedup_key": "seo:test",
            "priority": "high",
            "payload": {"keyword": "test"},
        }
        result = failure_chain.enqueue_action_failure(supabase, action, "title too long")
        self.assertTrue(result)
        kwargs = mock_enqueue.call_args.kwargs
        self.assertEqual(kwargs["action_type"], "flag_for_review")
        self.assertEqual(kwargs["payload"]["subtype"], "system_action_failed")
        self.assertEqual(kwargs["payload"]["source_action_dedup_key"], "seo:test")
        self.assertEqual(kwargs["dedup_key"], "flag:action_failed:seo:test")

    @patch("failure_chain.aq.enqueue", return_value=True)
    def test_partial_failure_enqueues_review_flag(self, mock_enqueue):
        supabase = MagicMock()
        result = failure_chain.enqueue_partial_failure(
            supabase,
            "seo_articles",
            "saved=1 failed=3 skipped=1",
            {"saved": 1, "failed": 3, "skipped": 1},
        )
        self.assertTrue(result)
        kwargs = mock_enqueue.call_args.kwargs
        self.assertEqual(kwargs["action_type"], "flag_for_review")
        self.assertEqual(kwargs["payload"]["subtype"], "system_partial_failure")
        self.assertEqual(kwargs["payload"]["failed_count"], 3)
        self.assertEqual(kwargs["priority"], "medium")


class TestActionQueueFailureHooks(unittest.TestCase):
    @patch("failure_chain.enqueue_action_failure")
    def test_mark_failed_terminal_enters_responsibility_chain(self, mock_enqueue):
        supabase = MagicMock()
        action = {
            "id": "a1",
            "action_type": "generate_seo_content",
            "dedup_key": "seo:test",
            "attempts": 3,
            "max_attempts": 3,
            "priority": "high",
        }
        aq.mark_failed(supabase, action, "generation returned None")
        mock_enqueue.assert_called_once_with(supabase, action, "generation returned None")

    @patch("failure_chain.enqueue_action_failure")
    def test_mark_failed_retry_does_not_open_extra_flag(self, mock_enqueue):
        supabase = MagicMock()
        action = {
            "id": "a1",
            "action_type": "generate_seo_content",
            "dedup_key": "seo:test",
            "attempts": 1,
            "max_attempts": 3,
        }
        aq.mark_failed(supabase, action, "temporary failure")
        mock_enqueue.assert_not_called()

    @patch("failure_chain.resolve_action_failure")
    def test_mark_done_resolves_prior_action_failure(self, mock_resolve):
        supabase = MagicMock()
        action = {"id": "a1", "dedup_key": "seo:test"}
        aq.mark_done(supabase, action, {"saved": True})
        mock_resolve.assert_called_once_with(supabase, action)


if __name__ == "__main__":
    unittest.main()

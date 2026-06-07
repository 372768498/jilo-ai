import unittest
from unittest.mock import MagicMock

import action_queue as aq


class TestActionQueueOrdering(unittest.TestCase):
    def test_repair_actions_win_within_same_priority(self):
        rows = [
            {
                "id": "old-normal",
                "priority": "high",
                "created_at": "2026-06-01T00:00:00",
                "payload": {"keyword": "old"},
            },
            {
                "id": "new-repair",
                "priority": "high",
                "created_at": "2026-06-07T00:00:00",
                "payload": {"source_repair": {"failed_action_id": "a1"}},
            },
            {
                "id": "medium-repair",
                "priority": "medium",
                "created_at": "2026-05-01T00:00:00",
                "payload": {"source_repair": {"failed_action_id": "a2"}},
            },
        ]

        ordered = sorted(rows, key=aq._pick_sort_key)

        self.assertEqual([row["id"] for row in ordered], [
            "new-repair",
            "old-normal",
            "medium-repair",
        ])

    def test_release_pending_refunds_claim_attempt(self):
        supabase = MagicMock()
        action = {"id": "a1", "attempts": 2, "status": "in_progress"}

        aq.release_pending(supabase, action, "blocked")

        update_payload = supabase.table.return_value.update.call_args[0][0]
        self.assertEqual(update_payload["status"], "pending")
        self.assertEqual(update_payload["attempts"], 1)
        self.assertIsNone(update_payload["picked_at"])
        self.assertEqual(action["status"], "pending")
        self.assertEqual(action["attempts"], 1)


if __name__ == "__main__":
    unittest.main()

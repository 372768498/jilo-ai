import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
import cloud_watchdog as watchdog


class TestCloudWatchdog(unittest.TestCase):
    def test_inactivity_repair_enables_then_verifies_and_requests_cloud_check(self):
        calls = []
        def gh(args):
            calls.append(args)
            if args[:2] == ['workflow', 'enable'] or args[:2] == ['workflow', 'run']:
                return ''
            return {'state': 'disabled_inactivity' if len(calls) == 1 else 'active'}
        with patch.object(watchdog, 'gh', side_effect=gh):
            result = watchdog.check(repair=True)
        self.assertEqual(result['state'], 'recovery_requested')
        self.assertEqual([c[1] for c in calls if c[0] == 'workflow'], ['enable', 'run'])

    def test_manually_disabled_workflow_is_never_reenabled(self):
        with patch.object(watchdog, 'gh', return_value={'state': 'disabled_manually'}) as gh:
            self.assertEqual(watchdog.check(repair=True)['state'], 'disabled_manually')
        self.assertEqual(gh.call_count, 1)

    def test_stale_scheduled_success_is_unhealthy(self):
        old = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        with patch.object(watchdog, 'gh', side_effect=[{'state': 'active'}, {'workflow_runs': [{'created_at': old}]}]):
            self.assertEqual(watchdog.check()['state'], 'schedule_stale')

    def test_recent_schedule_is_healthy(self):
        now = datetime.now(timezone.utc).isoformat()
        with patch.object(watchdog, 'gh', side_effect=[{'state': 'active'}, {'workflow_runs': [{'created_at': now}]}]):
            self.assertEqual(watchdog.check()['state'], 'healthy')

    def test_api_failure_never_becomes_healthy(self):
        with patch.object(watchdog, 'gh', side_effect=RuntimeError('API unavailable')), self.assertRaises(RuntimeError):
            watchdog.check()


if __name__ == '__main__': unittest.main()

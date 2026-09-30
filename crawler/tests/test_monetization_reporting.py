import unittest
from unittest.mock import patch
from datetime import date
from fake_database import Database
import manual_blockers_report as manual
import monitor_agent as monitor
import monetization_kit as kit


class MonetizationReportingTests(unittest.TestCase):
    def setUp(self):
        clock = patch('affiliate_registry.date')
        self.clock = clock.start()
        self.clock.today.return_value = date(2026,9,30)
        self.clock.fromisoformat.side_effect = date.fromisoformat
        self.addCleanup(clock.stop)

    def test_broken_nonempty_link_remains_actionable(self):
        db = Database(action_queue=[{'id':'broken','action_type':'flag_for_review','status':'pending',
                         'payload':{'subtype':'affiliate_link_broken','slug':'gamma'}}],
                      tools=[{'slug':'gamma','name_en':'Gamma','status':'published',
                              'click_count':100,'affiliate_url':'https://gamma.app'}])
        with patch.object(manual,'get_supabase',return_value=db):
            report = manual.load_manual_blockers()
        self.assertEqual(len(report['monetization_flags']),1)
        self.assertIn('待修正',manual.format_message(report))

    def test_unknown_application_is_not_submit_ready(self):
        with patch('affiliate_registry.program_for', return_value=None):
            pack = kit.build_application_pack({'slug':'unknown','name_en':'Unknown','click_count':945})
        self.assertFalse(pack['application_ready'])
        text = manual.format_message({'monetization_flags':[{'name':'Unknown','slug':'unknown',
                         'click_count':945,'priority':'high','roi':661.5,'pack':pack}]})
        self.assertNotIn('点提交即可',text)
        self.assertNotIn('漏钱 $',text)
        self.assertIn('估算',text)

    def test_report_refreshes_old_click_snapshot_and_classifies_auth(self):
        db = Database(action_queue=[
            {'id':'old','action_type':'flag_for_review','status':'pending','priority':'high',
             'payload':{'subtype':'monetization_gap','slug':'gamma','click_count':30}},
            {'id':'auth','action_type':'flag_for_review','status':'pending','priority':'high',
             'payload':{'subtype':'system_error','job_name':'seo_articles','message':'auth_unavailable'}}],
            tools=[{'slug':'gamma','name_en':'Gamma','status':'published','click_count':1623}])
        with patch.object(manual,'get_supabase',return_value=db):
            report = manual.load_manual_blockers()
        self.assertEqual(report['monetization_flags'][0]['click_count'],1623)
        self.assertEqual(report['system_flags'][0]['subtype'],'system_env_invalid')

    def test_monitor_refreshes_existing_flag_without_duplicate(self):
        db = Database(tools=[{'slug':'gamma','name_en':'Gamma','status':'published','click_count':1623}],
            action_queue=[{'id':'old','action_type':'flag_for_review','status':'pending',
                           'dedup_key':'flag:monetization:gamma',
                           'payload':{'subtype':'monetization_gap','slug':'gamma','click_count':30}}])
        monitor.check_monetization_gaps(db)
        self.assertEqual(len(db.tables['action_queue']),1)
        self.assertEqual(db.tables['action_queue'][0]['payload']['click_count'],1623)


if __name__ == '__main__': unittest.main()

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

    def test_recovered_model_auth_is_not_a_manual_permission_request(self):
        flag = {'id':'auth','action_type':'flag_for_review','status':'pending',
                'created_at':'2026-09-30T08:00:00+08:00',
                'payload':{'subtype':'system_action_failed','queue_action_type':'generate_seo_content',
                           'message':'auth_unavailable'}}
        health = {'job_name':'llm_health','status':'success','created_at':'2026-09-30T01:00:00Z'}
        for status,at,expected in [('success','2026-09-30T01:00:00Z',0),
                                   ('error','2026-09-30T01:00:00Z',1),
                                   ('success','2026-09-29T23:00:00Z',1)]:
            with self.subTest(status=status,at=at):
                db = Database(action_queue=[flag],tools=[],ops_logs=[dict(health,status=status,created_at=at)])
                with patch.object(manual,'get_supabase',return_value=db):
                    report = manual.load_manual_blockers()
                self.assertEqual(len(report['system_flags']),expected)
                self.assertEqual(db.tables['action_queue'][0]['status'],'pending')

    def test_auth_recovery_never_hides_schema_or_invalid_dates(self):
        health = {'status':'success','created_at':'2026-09-30T01:00:00Z'}
        row = {'created_at':'2026-09-30T00:00:00Z','payload':{
            'subtype':'system_action_failed','queue_action_type':'generate_seo_content',
            'message':'auth_unavailable PGRST205 Could not find table'}}
        self.assertFalse(manual.historical_model_auth_recovered(row,health))
        row['payload']['message'] = 'auth_not_found: no auth available'
        self.assertTrue(manual.historical_model_auth_recovered(row,health))
        row['payload']['message'] = 'auth_unavailable'
        for invalid in (None, 123, '', 'bad-date'):
            self.assertFalse(manual.historical_model_auth_recovered(dict(row,created_at=invalid),health))


if __name__ == '__main__': unittest.main()

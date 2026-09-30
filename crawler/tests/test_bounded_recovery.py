import unittest
from datetime import datetime, timezone
from unittest.mock import patch
from reporting_data import latest_job_logs, job_succeeded

from fake_database import Database
import self_iteration_agent as si
import action_queue as aq
import traffic_growth_agent as growth


class RecoveryTests(unittest.TestCase):
    def test_empty_queue_does_not_erase_last_error(self):
        db = Database(ops_logs=[
            {'job_name':'seo_articles','status':'error','message':'auth','created_at':'2026-09-29T10:00:00Z'},
            {'job_name':'seo_articles','status':'success','message':'No pending actions',
             'created_at':'2026-09-30T10:00:00Z','details':{'reason':'queue_empty'}}])
        self.assertEqual(latest_job_logs(db, ('seo_articles',))[0]['status'],'error')

    def test_legacy_replacement_success_closes_only_proven_source(self):
        db = Database(action_queue=[
            {'id':'old','action_type':'generate_seo_content','status':'failed','dedup_key':'seo:x'},
            {'id':'replacement','action_type':'generate_seo_content','status':'done','dedup_key':'seo:x',
             'result':{'slug':'x'},'payload':{'source_repair':{'failed_action_id':'old'}}},
            {'id':'flag','action_type':'flag_for_review','status':'pending','dedup_key':'flag:action_failed:seo:x',
             'payload':{'subtype':'system_action_failed','source_action_id':'old'}}])
        si.resolve_recovered_system_flags(db)
        self.assertEqual(db.tables['action_queue'][0]['status'],'skipped')
        self.assertEqual(db.tables['action_queue'][2]['status'],'done')
        self.assertEqual(db.tables['action_queue'][2]['result']['replacement_action_id'],'replacement')
        # 模拟源动作已写完，但 flag 写入中断；下一轮必须可重入。
        db.tables['action_queue'][2]['status']='pending'
        si.resolve_recovered_system_flags(db)
        self.assertEqual(db.tables['action_queue'][2]['status'],'done')

    def test_success_before_latest_error_does_not_close_flag(self):
        db = Database(ops_logs=[
            {'job_name':'seo_articles','status':'success','created_at':'2026-09-30T11:00:00Z'},
            {'job_name':'seo_articles','status':'error','created_at':'2026-09-30T12:00:00Z'}],
            action_queue=[{'id':'flag','action_type':'flag_for_review','status':'pending',
                           'created_at':'2026-09-30T10:00:00Z',
                           'payload':{'subtype':'system_error','job_name':'seo_articles'}}])
        si.resolve_recovered_system_flags(db)
        self.assertEqual(db.tables['action_queue'][0]['status'], 'pending')

    def test_auth_recovery_is_bounded_and_source_success_closes_flag(self):
        now = datetime.now(timezone.utc).isoformat()
        actions = [{'id':str(i),'action_type':'generate_seo_content','status':'failed',
                    'attempts':3,'max_attempts':3,'dedup_key':f'seo:{i}',
                    'payload':{'keyword':f'topic {i}'}, 'created_at':'2026-07-01',
                    'error_reason':'503 auth_unavailable', 'updated_at':'2026-07-02'} for i in range(8)]
        actions.append({'id':'flag','action_type':'flag_for_review','status':'pending',
                        'dedup_key':'flag:action_failed:seo:0',
                        'payload':{'subtype':'system_action_failed','source_action_id':'0'}})
        db = Database(action_queue=actions,ops_logs=[{'job_name':'llm_health','status':'success',
                                                      'created_at':now,'details':{}}])
        self.assertEqual(si.requeue_repairable_seo_failures(db),5)
        self.assertEqual(db.tables['action_queue'][-1]['status'],'pending')
        first = db.tables['action_queue'][0]
        self.assertEqual(first['attempts'],3)
        self.assertEqual(first['max_attempts'],6)
        self.assertEqual(first['payload']['source_repair']['previous_attempts'],3)
        aq.mark_done(db, first, {'slug':'topic-0'})
        self.assertEqual(db.tables['action_queue'][-1]['status'],'done')
        # 已恢复过又失败，不能无限重置重试次数。
        first['status']='failed'
        si.requeue_repairable_seo_failures(db)
        self.assertEqual(first['status'],'failed')

    def test_no_model_health_proof_no_auth_retries(self):
        db = Database(action_queue=[{'id':'1','action_type':'generate_seo_content','status':'failed',
                                      'error_reason':'auth_unavailable','payload':{},'dedup_key':'seo:1'}])
        self.assertEqual(si.requeue_repairable_seo_failures(db),0)

    def test_review_only_backlog_keeps_bounded_new_content(self):
        budget = growth.apply_verdict_gate({'aeo':3,'seo':3,'compare':2,'rewrite':3},
                                          'degraded_needs_attention',['review_backlog'])
        self.assertEqual(budget['aeo'],1)
        self.assertEqual(budget['seo'],1)
        blocked = growth.apply_verdict_gate(budget,'degraded_needs_attention',['active_job_failure'])
        self.assertEqual(blocked['seo'],0)


if __name__ == '__main__': unittest.main()

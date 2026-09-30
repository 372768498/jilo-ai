"""通过真实命令入口验证批次失败能被调度器看到。外部边界全部替换。"""
import runpy
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch
from fake_database import Database


class TestGeneratorExit(unittest.TestCase):
    def test_seo_hub_auth_loss_stops_all_claimed_actions(self):
        actions = [{'id':str(i),'payload':{'mode':'hub','keyword':'AI','category_slug':'coding'},
                    'priority':'high','attempts':1,'max_attempts':3} for i in range(2)]
        db=Database(categories=[{'slug':'coding','name_en':'Coding'}])
        with patch('supabase.create_client', return_value=db), \
             patch('action_queue.pick_pending',return_value=actions), \
             patch('action_queue.mark_failed') as failed, \
             patch('action_queue.release_pending') as release, \
             patch('llm_client.check_llm_health',return_value=True), \
             patch('llm_client.get_openai_client',side_effect=RuntimeError('auth_unavailable')) as model, \
             patch('ops_logger.log_operation',return_value=True), patch('time.sleep'):
            with self.assertRaises(SystemExit):
                runpy.run_path(str(Path(__file__).parents[1]/'seo_article_generator.py'),run_name='__main__')
        self.assertEqual(model.call_count,1)
        self.assertEqual(release.call_count,2)
        failed.assert_not_called()

    def test_compare_auth_loss_after_probe_releases_claims_and_stops(self):
        actions = [{'id':str(i),'payload':{'tool_a':'A','tool_b':'B'},'priority':'high',
                    'attempts':1,'max_attempts':3} for i in range(2)]
        with patch('supabase.create_client', return_value=Database()), \
             patch('action_queue.pick_pending',return_value=actions), \
             patch('action_queue.mark_failed') as failed, \
             patch('action_queue.release_pending') as release, \
             patch('llm_client.check_llm_health',return_value=True), \
             patch('llm_client.get_openai_client',side_effect=RuntimeError('auth_unavailable')) as model, \
             patch('ops_logger.log_operation',return_value=True), patch('time.sleep'):
            with self.assertRaises(SystemExit) as exc:
                runpy.run_path(str(Path(__file__).parents[1]/'compare_article_generator.py'),run_name='__main__')
        self.assertEqual(exc.exception.code,1)
        self.assertEqual(model.call_count,1)
        self.assertEqual(release.call_count,2)
        failed.assert_not_called()

    def test_failed_queue_action_exits_nonzero(self):
        for script in ['seo_article_generator.py', 'compare_article_generator.py']:
            with self.subTest(script=script), \
                 patch('supabase.create_client', return_value=MagicMock()), \
                 patch('action_queue.pick_pending', return_value=[{'id': 'bad', 'payload': {}}]), \
                 patch('action_queue.mark_failed') as mark_failed, \
                 patch('ops_logger.log_operation', return_value=True), \
                 patch('llm_client.check_llm_health', return_value=True), \
                 patch('time.sleep'):
                with self.assertRaises(SystemExit) as exc:
                    runpy.run_path(str(Path(__file__).parents[1] / script), run_name='__main__')
                self.assertEqual(exc.exception.code, 1)
                mark_failed.assert_called_once()


if __name__ == '__main__':
    unittest.main()

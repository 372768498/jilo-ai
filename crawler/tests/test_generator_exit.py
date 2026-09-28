"""通过真实命令入口验证批次失败能被调度器看到。外部边界全部替换。"""
import runpy
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch


class TestGeneratorExit(unittest.TestCase):
    def test_failed_queue_action_exits_nonzero(self):
        for script in ['seo_article_generator.py', 'compare_article_generator.py']:
            with self.subTest(script=script), \
                 patch('supabase.create_client', return_value=MagicMock()), \
                 patch('action_queue.pick_pending', return_value=[{'id': 'bad', 'payload': {}}]), \
                 patch('action_queue.mark_failed') as mark_failed, \
                 patch('ops_logger.log_operation', return_value=True), \
                 patch('time.sleep'):
                with self.assertRaises(SystemExit) as exc:
                    runpy.run_path(str(Path(__file__).parents[1] / script), run_name='__main__')
                self.assertEqual(exc.exception.code, 1)
                mark_failed.assert_called_once()


if __name__ == '__main__':
    unittest.main()

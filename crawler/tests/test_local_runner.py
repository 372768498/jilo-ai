"""Run the real PowerShell entry point in an isolated checkout with fake processes."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


@unittest.skipUnless(os.name == 'nt', 'Windows task scheduler entry point')
class TestLocalRunner(unittest.TestCase):
    def run_fixture(self, code):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'scripts').mkdir()
            source = Path(__file__).resolve().parents[2] / 'scripts' / 'run-autonomous-growth.ps1'
            target = root / 'scripts' / source.name
            shutil.copyfile(source, target)
            fake = root / 'fake-python.cmd'
            fake.write_text('@echo off\nif "%~1"=="-c" exit /b 0\necho fixture-step\nexit /b ' + str(code) + '\n')
            env = os.environ.copy()
            env.pop('FEISHU_WEBHOOK_URL', None)
            proc = subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass',
                                   '-File', str(target), '-PythonExecutable', str(fake)],
                                  env=env, capture_output=True, timeout=40)
            logs = list((root / 'logs').glob('autonomous-growth-*.log'))
            text = logs[0].read_text(encoding='utf-8-sig') if logs else ''
            return proc.returncode, text

    def test_failed_children_propagate_failure_to_scheduler(self):
        code, log = self.run_fixture(7)
        self.assertEqual(code, 1)
        self.assertIn('ExitCode: 7', log)
        self.assertIn('数据采集', log)
        self.assertNotIn('\x00', log)

    def test_successful_children_return_zero(self):
        code, log = self.run_fixture(0)
        self.assertEqual(code, 0)
        self.assertIn('ExitCode: 0', log)
        self.assertIn('自驱动总控', log)


if __name__ == '__main__': unittest.main()

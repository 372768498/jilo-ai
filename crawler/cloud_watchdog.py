"""Windows 兜底任务中的独立监督器；不依赖被监督的 GitHub schedule。"""
import argparse
import json
import subprocess
from datetime import datetime, timezone

REPOSITORY = '372768498/jilo-ai'
WORKFLOW = 'daily-ops.yml'
MAX_SCHEDULE_AGE_HOURS = 30


def gh(args):
    result = subprocess.run(['gh', *args], capture_output=True, text=True, encoding='utf-8', timeout=60)
    if result.returncode:
        # gh 错误输出可能含 URL/账号信息，只报告退出码。
        raise RuntimeError(f'GitHub CLI failed (exit={result.returncode})')
    return json.loads(result.stdout) if args[0] == 'api' else result.stdout


def check(repair=False):
    endpoint = f'repos/{REPOSITORY}/actions/workflows/{WORKFLOW}'
    workflow = gh(['api', endpoint])
    state = workflow['state']
    if state == 'disabled_inactivity' and repair:
        gh(['workflow', 'enable', WORKFLOW, '--repo', REPOSITORY])
        if gh(['api', endpoint])['state'] != 'active':
            raise RuntimeError('Workflow enable did not restore active state')
        # 只请求健康检查；不以启用/dispatch 成功冒充定时运行或飞书成功。
        gh(['workflow', 'run', WORKFLOW, '--repo', REPOSITORY, '-f', 'job=autonomy'])
        return {'state': 'recovery_requested', 'workflow': 'active',
                'message': 'Workflow enabled; cloud guardian requested; scheduled recovery unverified'}
    if state != 'active':
        # 人工停用具有明确意图，绝不擅自恢复。
        return {'state': state, 'message': 'Workflow disabled'}
    runs = gh(['api', endpoint + '/runs?event=schedule&status=success&per_page=1'])['workflow_runs']
    if not runs:
        return {'state': 'schedule_missing', 'message': 'No successful scheduled run'}
    stamp = datetime.fromisoformat(runs[0]['created_at'].replace('Z', '+00:00'))
    age = (datetime.now(timezone.utc) - stamp).total_seconds() / 3600
    return {'state': 'healthy' if 0 <= age <= MAX_SCHEDULE_AGE_HOURS else 'schedule_stale',
            'latest_scheduled_success': runs[0]['created_at'], 'age_hours': round(age, 1)}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repair', action='store_true', help='Enable inactivity-disabled workflow and request guardian')
    args = parser.parse_args(argv)
    try:
        result = check(repair=args.repair)
    except Exception as exc:
        result = {'state': 'check_failed', 'error_type': type(exc).__name__}
    print(json.dumps(result, ensure_ascii=True))
    return 0 if result['state'] == 'healthy' else 1


if __name__ == '__main__':
    raise SystemExit(main())

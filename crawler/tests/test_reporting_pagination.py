"""使用项目实际 PostgREST SDK 生成的 Range 头，避免替身掩盖端点语义。"""
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from postgrest import SyncPostgrestClient
from reporting_data import fetch_all


class PaginationTests(unittest.TestCase):
    def test_real_sdk_range_reads_every_row(self):
        records = [{'id': i} for i in range(1205)]
        client = SyncPostgrestClient('https://example.invalid/rest/v1')
        try:
            query = client.from_('action_queue').select('id').order('id')
            def execute():
                start, end = map(int, query.headers['Range'].split('-'))
                return SimpleNamespace(data=records[start:end + 1])
            with patch.object(query, 'execute', side_effect=execute):
                result = fetch_all(query)
            self.assertEqual(len(result),1205)
            self.assertEqual([r['id'] for r in result],list(range(1205)))
        finally:
            client.session.close()


if __name__ == '__main__': unittest.main()

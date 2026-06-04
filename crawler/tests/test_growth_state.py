# crawler/tests/test_growth_state.py
#
# G0 acceptance evidence (spec docs/jilo-growth-commander-upgrade-spec-2026-06-03.md):
#   - upsert a row then read it back (roundtrip) against an in-memory fake that
#     mimics the PostgREST chained builder growth_state.py actually uses;
#   - typed accessors return safe defaults when the table is empty/absent;
#   - reads/writes never raise when the backend errors (graceful degradation).
import unittest

import growth_state


# --- Minimal in-memory fake of the supabase/PostgREST query builder ---------
# Supports exactly the chains growth_state.py uses:
#   table(t).select(cols).eq(c, v).limit(n).execute()
#   table(t).select(cols).execute()
#   table(t).upsert(row).execute()

class _Resp:
    def __init__(self, data):
        self.data = data


class _Query:
    def __init__(self, table):
        self._table = table
        self._filters = []
        self._limit = None

    def select(self, *_cols):
        return self

    def eq(self, col, val):
        self._filters.append((col, val))
        return self

    def limit(self, n):
        self._limit = n
        return self

    def execute(self):
        rows = self._table.rows
        for col, val in self._filters:
            rows = [r for r in rows if r.get(col) == val]
        if self._limit is not None:
            rows = rows[: self._limit]
        return _Resp([dict(r) for r in rows])


class _UpsertQuery:
    def __init__(self, table, row):
        self._table = table
        self._row = row

    def execute(self):
        key = self._row.get('key')
        for r in self._table.rows:
            if r.get('key') == key:
                r.update(self._row)
                return _Resp([dict(r)])
        self._table.rows.append(dict(self._row))
        return _Resp([dict(self._row)])


class _Table:
    def __init__(self):
        self.rows = []

    def select(self, *cols):
        return _Query(self).select(*cols)

    def upsert(self, row):
        return _UpsertQuery(self, row)


class FakeClient:
    def __init__(self):
        self._tables = {}

    def table(self, name):
        return self._tables.setdefault(name, _Table())


class _BrokenClient:
    """Every table access raises — simulates the table not existing yet."""
    def table(self, _name):
        raise RuntimeError("relation \"growth_state\" does not exist")


class TestGrowthStateRoundtrip(unittest.TestCase):
    def test_set_then_get_roundtrips(self):
        sb = FakeClient()
        self.assertTrue(growth_state.set_state(sb, 'k1', {'a': 1}))
        self.assertEqual(growth_state.get_state(sb, 'k1'), {'a': 1})

    def test_upsert_overwrites_same_key(self):
        sb = FakeClient()
        growth_state.set_state(sb, 'k1', {'a': 1})
        growth_state.set_state(sb, 'k1', {'a': 2})
        self.assertEqual(growth_state.get_state(sb, 'k1'), {'a': 2})
        # No duplicate row created on the PK.
        self.assertEqual(len(sb.table('growth_state').rows), 1)

    def test_get_missing_returns_default(self):
        sb = FakeClient()
        self.assertEqual(growth_state.get_state(sb, 'nope', default=7), 7)

    def test_read_all_snapshot(self):
        sb = FakeClient()
        growth_state.set_state(sb, 'a', 1)
        growth_state.set_state(sb, 'b', 2)
        self.assertEqual(growth_state.read_all(sb), {'a': 1, 'b': 2})


class TestTypedDefaults(unittest.TestCase):
    def test_verdict_default_is_unknown(self):
        sb = FakeClient()
        self.assertEqual(
            growth_state.get_verdict(sb),
            {'verdict': 'unknown', 'blockers': []},
        )

    def test_verdict_reads_written_value(self):
        sb = FakeClient()
        growth_state.set_state(sb, growth_state.VERDICT_KEY,
                               {'verdict': 'degraded', 'blockers': ['seo_backlog']})
        self.assertEqual(
            growth_state.get_verdict(sb),
            {'verdict': 'degraded', 'blockers': ['seo_backlog']},
        )

    def test_effectiveness_default_empty(self):
        self.assertEqual(growth_state.get_mode_effectiveness(FakeClient()), {})

    def test_suppress_default_empty(self):
        self.assertEqual(growth_state.get_suppress(FakeClient()), [])


class TestGracefulDegradation(unittest.TestCase):
    def test_reads_never_raise_when_table_absent(self):
        sb = _BrokenClient()
        self.assertEqual(growth_state.get_state(sb, 'k', default='d'), 'd')
        self.assertEqual(growth_state.read_all(sb), {})
        self.assertEqual(growth_state.get_verdict(sb), {'verdict': 'unknown', 'blockers': []})
        self.assertEqual(growth_state.get_mode_effectiveness(sb), {})
        self.assertEqual(growth_state.get_suppress(sb), [])

    def test_write_never_raises_when_table_absent(self):
        self.assertFalse(growth_state.set_state(_BrokenClient(), 'k', {'a': 1}))


if __name__ == '__main__':
    unittest.main()

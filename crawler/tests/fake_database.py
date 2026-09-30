"""In-memory PostgREST boundary for state-transition regression tests."""
from copy import deepcopy
from types import SimpleNamespace


class Database:
    def __init__(self, **tables):
        self.tables = deepcopy(tables)

    def table(self, name):
        return Query(self.tables.setdefault(name, []))


class Query:
    def __init__(self, rows):
        self.rows, self.filters, self.orders = rows, [], []
        self.start, self.stop, self.values = 0, None, None
        self.page_limit = None

    def select(self, *args, **kwargs): return self
    def eq(self, k, v): self.filters.append(lambda r: r.get(k) == v); return self
    def neq(self, k, v): self.filters.append(lambda r: r.get(k) != v); return self
    def ilike(self, k, v): self.filters.append(lambda r: v.strip('%').lower() in str(r.get(k,'')).lower()); return self
    def in_(self, k, v): self.filters.append(lambda r: r.get(k) in v); return self
    def gte(self, k, v): self.filters.append(lambda r: (r.get(k) or '') >= v); return self
    def gt(self, k, v): self.filters.append(lambda r: (r.get(k) or '') > v); return self
    def lt(self, k, v): self.filters.append(lambda r: (r.get(k) or '') < v); return self
    def lte(self, k, v): self.filters.append(lambda r: (r.get(k) or '') <= v); return self
    def order(self, k, desc=False): self.orders.append((k, desc)); return self
    def limit(self, n): self.page_limit = n; return self
    def offset(self, n): self.start = n; return self
    def range(self, start, end): self.start, self.stop = start, end; return self
    def update(self, values): self.values = values; return self
    def insert(self, values):
        self.rows.append(dict(id=f'new-{len(self.rows)}', status='pending', **values))
        return self
    def execute(self):
        found = [r for r in self.rows if all(f(r) for f in self.filters)]
        for key, desc in reversed(self.orders):
            found.sort(key=lambda r: r.get(key) or '', reverse=desc)
        found = found[self.start:self.start+self.page_limit if self.page_limit is not None else self.stop]
        if self.values is not None:
            for r in found: r.update(deepcopy(self.values))
        return SimpleNamespace(data=deepcopy(found), count=len(found))

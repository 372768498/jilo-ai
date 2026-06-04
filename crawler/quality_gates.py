"""
Quality gates — deterministic checks between executor output and publish.

Each gate returns a GateResult:
    ok=True                       → pass
    ok=False, terminal=False      → fail (retry until max_attempts)
    ok=False, terminal=True       → skip (don't retry; duplicate, etc.)

Pipelines (check_seo_article, check_compare_article) run gates in order
and short-circuit on first failure so the failure reason is specific.
"""
import hashlib
import re


class GateResult:
    __slots__ = ('ok', 'reason', 'terminal')

    def __init__(self, ok, reason="", terminal=False):
        self.ok = ok
        self.reason = reason
        self.terminal = terminal


OK = GateResult(True)


def _len(s):
    return len(s or '')


def _required(article, fields):
    missing = [f for f in fields if not (article.get(f) or '').strip()]
    if missing:
        return GateResult(False, f"missing/empty fields: {','.join(missing)}")
    return OK


def _title_max(article, field, max_len):
    n = _len(article.get(field))
    if n > max_len:
        return GateResult(False, f"{field} {n} chars > {max_len} max")
    return OK


def _meta_desc_range(article, field, lo, hi):
    n = _len(article.get(field))
    if n < lo or n > hi:
        return GateResult(False, f"{field} {n} chars out of [{lo},{hi}]")
    return OK


def _content_min(article, field, lo):
    n = _len(article.get(field))
    if n < lo:
        return GateResult(False, f"{field} {n} chars < {lo} min")
    return OK


def _no_unrequested_stale_year(article, field):
    text = article.get(field) or ''
    keyword = article.get('target_keyword') or ''
    stale_years = re.findall(r'\b20(?:2[0-5])\b', text)
    for year in stale_years:
        if year not in keyword:
            return GateResult(False, f"{field} contains stale year {year} not present in target keyword")
    return OK


def _bilingual_parity(article, en_field, zh_field, min_ratio):
    en_n = _len(article.get(en_field))
    zh_n = _len(article.get(zh_field))
    if en_n == 0:
        return GateResult(False, f"{en_field} empty for parity check")
    ratio = zh_n / en_n
    if ratio < min_ratio:
        return GateResult(
            False,
            f"{zh_field} too short vs {en_field}: ratio {ratio:.2f} < {min_ratio} (zh={zh_n}, en={en_n})",
        )
    return OK


def _aeo_structure(article, field='content_en'):
    """rank6 (invariant I3): an AEO answer page must keep the citeable structure
    answer engines quote — short answer, a decision table, an FAQ, a freshness
    line, and internal links. Enforced especially on rewrites so an AEO page is
    never flattened into a plain long-form SEO article."""
    html = (article.get(field) or '')
    low = html.lower()
    problems = []
    if low.count('<table') < 1:
        problems.append('no comparison table')
    if low.count('<h3') < 3:
        problems.append('fewer than 3 FAQ (<h3>) entries')
    if 'aeo-short-answer' not in low and 'short answer' not in low:
        problems.append('no short-answer section')
    if 'last updated' not in low and 'updated' not in low:
        problems.append('no "last updated"/freshness line')
    if low.count('/en/tools/') < 2:
        problems.append('fewer than 2 internal tool links')
    if problems:
        return GateResult(False, 'AEO structure: ' + '; '.join(problems))
    return OK


def _set_news_hash(article):
    """Compute and stash the content hash the saver will persist."""
    h = hashlib.md5(
        f"{article['title_en']}{article.get('target_keyword', '')}".encode()
    ).hexdigest()
    article['_content_hash'] = h
    return h


def _no_dup_news(supabase, article):
    """News table dedup by content_hash of (title_en + target_keyword)."""
    h = _set_news_hash(article)
    existing = supabase.table('news').select('id').eq('content_hash', h).limit(1).execute()
    if existing.data:
        return GateResult(False, f"duplicate news content_hash {h[:8]}", terminal=True)
    return OK


def _no_dup_compare(supabase, article):
    """compare_articles dedup by slug (en row)."""
    existing = supabase.table('compare_articles').select('id').eq(
        'slug', article['slug']
    ).limit(1).execute()
    if existing.data:
        return GateResult(False, f"duplicate compare slug {article['slug']}", terminal=True)
    return OK


REQUIRED_BILINGUAL = [
    'title_en', 'content_en', 'meta_description_en',
    'title_zh', 'content_zh', 'meta_description_zh',
]


def check_seo_article(article, supabase, skip_dup=False):
    """
    skip_dup=True for rewrites: the page already exists under the same
    title/keyword, so the duplicate check would wrongly reject it. The
    content hash is still computed so the saver can persist it.
    """
    gates = [
        lambda: _required(article, REQUIRED_BILINGUAL),
        lambda: _title_max(article, 'title_en', 70),
        lambda: _meta_desc_range(article, 'meta_description_en', 100, 170),
        lambda: _content_min(article, 'content_en', 3000),
        lambda: _bilingual_parity(article, 'content_en', 'content_zh', 0.3),
    ]
    for g in gates:
        r = g()
        if not r.ok:
            return r
    if skip_dup:
        _set_news_hash(article)
        return OK
    return _no_dup_news(supabase, article)


def check_aeo_answer(article, supabase, skip_dup=False):
    """skip_dup=True for AEO rewrites: the page already exists under the same
    title/keyword, so the dup check would wrongly reject it (mirrors
    check_seo_article). The content hash is still computed for the saver."""
    gates = [
        lambda: _required(article, REQUIRED_BILINGUAL),
        lambda: _title_max(article, 'title_en', 80),
        lambda: _no_unrequested_stale_year(article, 'title_en'),
        lambda: _meta_desc_range(article, 'meta_description_en', 100, 170),
        lambda: _content_min(article, 'content_en', 1200),
        lambda: _bilingual_parity(article, 'content_en', 'content_zh', 0.25),
        lambda: _aeo_structure(article, 'content_en'),
    ]
    for g in gates:
        r = g()
        if not r.ok:
            return r
    if skip_dup:
        _set_news_hash(article)
        return OK
    return _no_dup_news(supabase, article)


def check_compare_article(article, supabase):
    required = REQUIRED_BILINGUAL + ['slug']
    gates = [
        lambda: _required(article, required),
        lambda: _title_max(article, 'title_en', 80),
        lambda: _meta_desc_range(article, 'meta_description_en', 100, 170),
        lambda: _content_min(article, 'content_en', 1500),
        lambda: _bilingual_parity(article, 'content_en', 'content_zh', 0.3),
        lambda: _no_dup_compare(supabase, article),
    ]
    for g in gates:
        r = g()
        if not r.ok:
            return r
    return OK

# crawler/content_verifier.py
#
# Pre-publish content evaluator — the independent, skeptical "say no" gate
# (maker-checker). Default verdict is BLOCK unless an item proves itself
# publishable. This module is DEPENDENCY-LIGHT and PURE: it imports nothing
# from supabase/openai/config, so it is fully unit-testable without creds.
#
# Public API:
#   verify_publishable(item, content_type) -> {
#       'ok': bool,
#       'verdict': 'PASS'|'BLOCK'|'NEEDS_FIX',
#       'failed_gates': [...],
#       'evidence': {...},
#   }
#   content_hash(text) / shingles(text) helpers for callers that want to run
#   the dedup gate against an existing corpus.
#
# Each gate is skipped GRACEFULLY when the field it inspects is absent for the
# given content_type — a missing field never silently passes a present field.
import hashlib
import re
import unicodedata


# --- character helpers -------------------------------------------------------

_CJK_RANGES = (
    (0x4E00, 0x9FFF),    # CJK Unified Ideographs
    (0x3400, 0x4DBF),    # CJK Extension A
    (0xF900, 0xFAFF),    # CJK Compatibility Ideographs
    (0x3000, 0x303F),    # CJK symbols and punctuation
    (0xFF00, 0xFFEF),    # fullwidth forms
)


def _is_cjk(ch):
    cp = ord(ch)
    return any(lo <= cp <= hi for lo, hi in _CJK_RANGES)


def _strip_html_md(text):
    """Best-effort plain text: drop HTML tags and light markdown noise."""
    text = re.sub(r'<[^>]+>', ' ', text or '')
    text = re.sub(r'[#*_`>\[\]()|-]+', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def cjk_ratio(text):
    """Fraction of non-space characters that are CJK. 0.0 for empty/None."""
    plain = _strip_html_md(text)
    non_space = [c for c in plain if not c.isspace()]
    if not non_space:
        return 0.0
    cjk = sum(1 for c in non_space if _is_cjk(c))
    return cjk / len(non_space)


# --- dedup helpers (exposed so callers can build an existing-hash set) --------

def content_hash(text):
    """Stable md5 of normalized plain text — for exact/near-exact dedup."""
    plain = _strip_html_md(text).lower()
    plain = re.sub(r'\s+', ' ', plain).strip()
    return hashlib.md5(plain.encode('utf-8')).hexdigest()


def shingles(text, k=5):
    """Set of k-word shingles for near-duplicate detection."""
    words = re.findall(r'\w+', (_strip_html_md(text) or '').lower())
    if len(words) < k:
        return {' '.join(words)} if words else set()
    return {' '.join(words[i:i + k]) for i in range(len(words) - k + 1)}


def jaccard(a, b):
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


# --- gate configuration ------------------------------------------------------

# Minimum substantive plain-text length per content_type. Tool pages must carry
# real body copy — not just name + tagline.
_MIN_LEN = {
    'tool': 250,
    'tool_seo': 250,
    'seo_article': 2000,
    'aeo_answer': 700,
    'compare': 1000,
    'news': 80,
    'access': 120,
}
_DEFAULT_MIN_LEN = 120

# zh translation must clear this CJK ratio to count as "actually Chinese".
_ZH_CJK_THRESHOLD = 0.30

# Basic profanity / dirty-source list (lowercased, word-ish match).
_PROFANITY = (
    'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'nigger', 'faggot',
    'motherfucker', 'bastard', 'slut', 'whore',
)

# zh-access compliance: gray-market patterns that must never be published.
_GRAYMARKET = (
    '代充值', '代充', '合租', '共享账号', '账号共享', '绕区', '破解', '外挂',
    '钓鱼', '绕过风控', '风控绕过', '盗号', '黑卡',
)

# Advisory: unwinnable DA80 head terms.
_DA80_HEAD_TERMS = (
    'best ai tools', 'best ai tool', 'best ai video editor',
    'best ai image generator', 'best ai chatbot', 'best ai writer',
    'ai tools', 'chatgpt', 'best ai software', 'best ai',
)


def _field(item, *names):
    """Return the first present, stringy field value among names ('' if none)."""
    for n in names:
        v = item.get(n)
        if isinstance(v, str):
            return v
    return ''


def _has(item, *names):
    return any(isinstance(item.get(n), str) and item.get(n).strip() for n in names)


# --- individual gates --------------------------------------------------------
# Each gate appends to failed_gates and writes evidence; returns the worst
# verdict it produced ('PASS' if it had nothing to object to / was skipped).

def _gate_real_translation(item, content_type, failed, evidence):
    """If a zh field is present it must be ACTUAL Chinese, not an English
    fallback (the content_zh<-content_en fallback in seo_article_generator must
    be caught here). BLOCKs the zh locale on failure."""
    zh = _field(item, 'content_zh', 'long_description_zh', 'summary_zh', 'description_zh')
    if not zh.strip():
        return 'PASS'  # no zh field for this type -> skip gracefully
    en = _field(item, 'content_en', 'long_description_en', 'summary_en', 'description_en')
    ratio = cjk_ratio(zh)
    evidence['cjk_ratio'] = round(ratio, 3)
    # Identical to the English body = the known fallback path.
    if en.strip() and zh.strip() == en.strip():
        failed.append('real_translation')
        evidence['real_translation'] = 'content_zh equals content_en (English fallback)'
        return 'BLOCK'
    if ratio < _ZH_CJK_THRESHOLD:
        failed.append('real_translation')
        evidence['real_translation'] = (
            f'content_zh CJK ratio {ratio:.2f} < {_ZH_CJK_THRESHOLD} (English masquerading as zh)'
        )
        return 'BLOCK'
    return 'PASS'


def _gate_dedup(item, content_type, failed, evidence, existing_hashes=None,
                existing_shingles=None):
    """Near-duplicate check against an optional corpus supplied by the caller.
    Exact hash match OR high shingle Jaccard -> BLOCK."""
    body = _field(item, 'content_en', 'long_description_en', 'summary_en', 'description_en')
    if not body.strip():
        return 'PASS'
    h = content_hash(body)
    evidence['content_hash'] = h[:12]
    if existing_hashes and h in existing_hashes:
        failed.append('dedup')
        evidence['dedup'] = f'exact content_hash collision {h[:8]}'
        return 'BLOCK'
    if existing_shingles:
        sh = shingles(body)
        for other in existing_shingles:
            sim = jaccard(sh, other)
            if sim >= 0.8:
                failed.append('dedup')
                evidence['dedup'] = f'near-duplicate shingle Jaccard {sim:.2f} >= 0.8'
                return 'BLOCK'
    return 'PASS'


def _gate_thin(item, content_type, failed, evidence):
    """Enforce a minimum substantive body length per content_type. Tool pages
    especially must not be ~name+tagline only."""
    body = _field(
        item,
        'content_en', 'long_description_en', 'summary_en', 'description_en',
    )
    # For tool types, do not let a long tagline masquerade as a body.
    if content_type in ('tool', 'tool_seo'):
        body = _field(item, 'long_description_en', 'content_en', 'description_en')
    if not body.strip():
        # No body field present for this type at all -> can't judge, skip.
        if content_type in ('tool', 'tool_seo', 'seo_article', 'aeo_answer', 'compare'):
            failed.append('thin')
            evidence['thin'] = 'no substantive body field present'
            return 'BLOCK'
        return 'PASS'
    plain = _strip_html_md(body)
    n = len(plain)
    minimum = _MIN_LEN.get(content_type, _DEFAULT_MIN_LEN)
    evidence['body_len'] = n
    if n < minimum:
        failed.append('thin')
        evidence['thin'] = f'body {n} chars < {minimum} min for {content_type}'
        return 'BLOCK'
    return 'PASS'


def _gate_dirty_source(item, content_type, failed, evidence):
    """Reject profanity / control-char garbage in any visible text field."""
    parts = []
    for k, v in item.items():
        if isinstance(v, str) and not k.startswith('_'):
            parts.append(v)
    blob = '\n'.join(parts)
    # Control chars (excluding common whitespace) = garbage / corrupted source.
    ctrl = [c for c in blob if unicodedata.category(c) == 'Cc' and c not in '\t\n\r']
    if ctrl:
        failed.append('dirty_source')
        evidence['dirty_source'] = f'{len(ctrl)} control char(s) in text'
        return 'BLOCK'
    low = blob.lower()
    # Match the stem at a word start so inflected forms (fuck->fucking) are
    # caught, without firing on innocent substrings (e.g. "Scunthorpe").
    hits = [w for w in _PROFANITY if re.search(r'\b' + re.escape(w), low)]
    if hits:
        failed.append('dirty_source')
        evidence['dirty_source'] = f'profanity: {",".join(sorted(set(hits)))}'
        return 'BLOCK'
    return 'PASS'


def _gate_compliance(item, content_type, failed, evidence):
    """zh-access lane: gray-market patterns (代充值/合租/共享账号/绕区/破解/外挂/
    钓鱼/绕过风控/账号共享) -> BLOCK. compare/适合谁/风险披露 framing is allowed."""
    if content_type not in ('access', 'access_zh'):
        return 'PASS'
    blob = '\n'.join(
        v for k, v in item.items()
        if isinstance(v, str) and not k.startswith('_')
    )
    hits = [p for p in _GRAYMARKET if p and p in blob]
    if hits:
        failed.append('compliance')
        evidence['compliance'] = f'gray-market patterns: {",".join(sorted(set(hits)))}'
        return 'BLOCK'
    return 'PASS'


def _gate_rankable(item, content_type, failed, evidence):
    """Advisory: an unwinnable DA80 head term as the target keyword -> NEEDS_FIX
    (does not block on its own, but downgrades the verdict)."""
    kw = _field(item, 'target_keyword', 'keyword').strip().lower()
    if not kw:
        return 'PASS'
    if kw in _DA80_HEAD_TERMS:
        failed.append('rankable')
        evidence['rankable'] = f'target keyword "{kw}" is an unwinnable DA80 head term'
        return 'NEEDS_FIX'
    return 'PASS'


def _gate_seo_hygiene(item, content_type, failed, evidence):
    """Advisory SEO hygiene checks. Placeholder — kept non-blocking for now."""
    return 'PASS'


# verdict precedence: BLOCK is the strongest, then NEEDS_FIX, then PASS.
_RANK = {'PASS': 0, 'NEEDS_FIX': 1, 'BLOCK': 2}


def _worst(a, b):
    return a if _RANK[a] >= _RANK[b] else b


def verify_publishable(item, content_type, existing_hashes=None,
                       existing_shingles=None):
    """Independent skeptical verifier. Default = BLOCK unless proven publishable.

    Args:
        item: dict of candidate content fields (content_en/content_zh/...).
        content_type: 'tool' | 'tool_seo' | 'seo_article' | 'aeo_answer' |
                      'compare' | 'news' | 'access'.
        existing_hashes: optional set of content_hash() values to dedup against.
        existing_shingles: optional iterable of shingle-sets to dedup against.

    Returns dict: {'ok', 'verdict', 'failed_gates', 'evidence'}.
    """
    item = item or {}
    failed = []
    evidence = {}
    verdict = 'PASS'

    verdict = _worst(verdict, _gate_real_translation(item, content_type, failed, evidence))
    verdict = _worst(verdict, _gate_dedup(
        item, content_type, failed, evidence,
        existing_hashes=existing_hashes, existing_shingles=existing_shingles,
    ))
    verdict = _worst(verdict, _gate_thin(item, content_type, failed, evidence))
    verdict = _worst(verdict, _gate_dirty_source(item, content_type, failed, evidence))
    verdict = _worst(verdict, _gate_compliance(item, content_type, failed, evidence))
    verdict = _worst(verdict, _gate_rankable(item, content_type, failed, evidence))
    verdict = _worst(verdict, _gate_seo_hygiene(item, content_type, failed, evidence))

    # ok ONLY when nothing objected. A NEEDS_FIX (advisory) is not publishable
    # by default — the gate says "no" unless the item proves itself.
    ok = verdict == 'PASS'
    return {
        'ok': ok,
        'verdict': verdict,
        'failed_gates': failed,
        'evidence': evidence,
    }

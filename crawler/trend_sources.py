# crawler/trend_sources.py
#
# Free, no-key, engagement-weighted signals for trend detection.
# Each source returns normalized items: {title, source, engagement, comments, url}.
# `engagement` is the platform's hotness number (HN points / Reddit upvotes) —
# a single high-engagement story is a real trend even without multi-source
# corroboration, which jilo's narrow RSS set can't provide on its own.
#
# Every fetch is wrapped so one dead source never sinks the whole agent.
import re
import time
from datetime import datetime, timedelta

import requests
from bs4 import BeautifulSoup

UA = "jilo-trend/1.0 (+https://jilo.ai)"
TIMEOUT = 20

COMPETITOR_RECENT_DAYS = 3  # a competitor page is "new" if lastmod is this fresh
LAST_FAILURES = []


def _record_failure(source, error):
    LAST_FAILURES.append({"source": source, "error": str(error)[:500]})


def get_last_failures():
    return list(LAST_FAILURES)


def _parse_count(text):
    """First integer in a string, commas tolerated. e.g. '1,234 stars today' -> 1234."""
    m = re.search(r'([\d,]+)', text or '')
    if not m:
        return 0
    try:
        return int(m.group(1).replace(',', ''))
    except ValueError:
        return 0

# Tool/launch-focused AI subreddits. Deliberately excludes meme-heavy
# communities (r/ChatGPT, r/singularity) whose top posts are jokes and
# philosophy, not tool signals.
DEFAULT_SUBREDDITS = [
    "LocalLLaMA", "OpenAI", "StableDiffusion", "artificial", "ClaudeAI",
    "ArtificialInteligence", "perplexity_ai", "SaaS", "SideProject",
]

AI_TERMS = [
    "ai", "agent", "llm", "gpt", "claude", "gemini", "perplexity",
    "copilot", "cursor", "runway", "sora", "kling", "midjourney",
    "stable diffusion", "chatbot", "automation", "voice", "video generator",
]


def fetch_hn(hours=24, min_points=50, query="AI", max_items=20):
    """Hacker News stories matching `query` in the last `hours`, points>=min_points."""
    since = int(time.time()) - hours * 3600
    url = (
        "https://hn.algolia.com/api/v1/search_by_date"
        f"?tags=story&query={query}"
        f"&numericFilters=created_at_i>{since},points>{min_points}"
        f"&hitsPerPage={max_items}"
    )
    items = []
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=TIMEOUT)
        r.raise_for_status()
        for h in r.json().get("hits", []):
            title = h.get("title")
            if not title:
                continue
            items.append({
                "title": title,
                "source": "Hacker News",
                "engagement": h.get("points") or 0,
                "comments": h.get("num_comments") or 0,
                "url": h.get("url") or f"https://news.ycombinator.com/item?id={h.get('objectID')}",
            })
    except Exception as e:
        _record_failure("Hacker News", e)
        print(f"  HN fetch failed: {e}")
    return items


def fetch_reddit(subreddits=None, min_score=80, limit=15):
    """Hot posts from AI subreddits with score>=min_score."""
    subreddits = subreddits or DEFAULT_SUBREDDITS
    items = []
    for sub in subreddits:
        try:
            r = requests.get(
                f"https://www.reddit.com/r/{sub}/hot.json?limit={limit}",
                headers={"User-Agent": UA}, timeout=TIMEOUT,
            )
            r.raise_for_status()
            for c in r.json().get("data", {}).get("children", []):
                p = c.get("data", {})
                if p.get("stickied") or (p.get("score") or 0) < min_score:
                    continue
                title = p.get("title")
                if not title:
                    continue
                items.append({
                    "title": title,
                    "source": f"reddit:r/{sub}",
                    "engagement": p.get("score") or 0,
                    "comments": p.get("num_comments") or 0,
                    "url": f"https://www.reddit.com{p.get('permalink', '')}",
                })
            time.sleep(1)  # be polite to the unauthenticated endpoint (10 req/min)
        except Exception as e:
            _record_failure(f"reddit:r/{sub}", e)
            print(f"  Reddit r/{sub} fetch failed: {e}")
    return items


def _looks_ai_related(text):
    t = (text or "").lower()
    return any(term in t for term in AI_TERMS)


def fetch_product_hunt(max_items=30):
    """Product Hunt launch feed. Good for fresh tools before they rank."""
    items = []
    try:
        r = requests.get("https://www.producthunt.com/feed", headers={"User-Agent": UA}, timeout=TIMEOUT)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "xml")
        for item in soup.find_all("item")[:max_items]:
            title = item.title.get_text(" ", strip=True) if item.title else ""
            desc = item.description.get_text(" ", strip=True) if item.description else ""
            if not _looks_ai_related(f"{title} {desc}"):
                continue
            link = item.link.get_text(strip=True) if item.link else "https://www.producthunt.com/"
            items.append({
                "title": title,
                "source": "Product Hunt",
                "engagement": 120,
                "comments": 0,
                "url": link,
            })
    except Exception as e:
        _record_failure("Product Hunt", e)
        print(f"  Product Hunt fetch failed: {e}")
    return items


def fetch_github_trending(max_items=20):
    """GitHub trending AI repos. Useful for developer/tooling searches."""
    items = []
    try:
        r = requests.get(
            "https://github.com/trending?since=daily&spoken_language_code=en",
            headers={"User-Agent": UA},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        for article in soup.select("article.Box-row")[:max_items]:
            title_el = article.select_one("h2 a")
            if not title_el:
                continue
            repo = " ".join(title_el.get_text(" ", strip=True).split())
            desc_el = article.select_one("p")
            desc = desc_el.get_text(" ", strip=True) if desc_el else ""
            if not _looks_ai_related(f"{repo} {desc}"):
                continue
            # rank10: use the real "stars today" count as engagement instead of a
            # flat constant, so a genuinely surging repo outranks a quiet one.
            stars_el = article.select_one("a[href$='/stargazers'], span.d-inline-block.float-sm-right")
            stars_today = _parse_count(stars_el.get_text(" ", strip=True)) if stars_el else 0
            items.append({
                "title": f"{repo}: {desc}" if desc else repo,
                "source": "GitHub Trending",
                "engagement": stars_today or 100,
                "comments": 0,
                "url": f"https://github.com{title_el.get('href', '')}",
            })
    except Exception as e:
        _record_failure("GitHub Trending", e)
        print(f"  GitHub Trending fetch failed: {e}")
    return items


def _slug_to_keyword(url):
    """Last meaningful path segment of a competitor URL -> a keyword guess."""
    path = re.sub(r'[?#].*$', '', url or '').rstrip('/')
    seg = path.rsplit('/', 1)[-1] if '/' in path else ''
    seg = re.sub(r'\.(html?|php|aspx)$', '', seg)
    return re.sub(r'[-_]+', ' ', seg).strip()


def parse_sitemap_recent(xml_text, now=None, recent_days=COMPETITOR_RECENT_DAYS):
    """Pure: sitemap XML -> [{'url', 'keyword'}] for <url>s whose <lastmod> is
    within recent_days. Diffing by lastmod avoids needing a seen-URL store."""
    now = now or datetime.utcnow()
    cutoff = now - timedelta(days=recent_days)
    soup = BeautifulSoup(xml_text or '', 'xml')
    out = []
    for url_el in soup.find_all('url'):
        loc = url_el.find('loc')
        lastmod = url_el.find('lastmod')
        if not loc or not lastmod:
            continue
        try:
            mod = datetime.fromisoformat(lastmod.get_text(strip=True).replace('Z', '+00:00'))
            mod = mod.replace(tzinfo=None)
        except Exception:
            continue
        if mod < cutoff:
            continue
        url = loc.get_text(strip=True)
        keyword = _slug_to_keyword(url)
        if keyword:
            out.append({'url': url, 'keyword': keyword})
    return out


def fetch_competitor_new_pages(sitemaps=None):
    """New competitor pages as mid-weight signals. Each carries the URL so the
    enqueue side can route it to a compare/rewrite rather than a plain generate."""
    if sitemaps is None:
        try:
            from config import COMPETITOR_SITEMAPS
            sitemaps = COMPETITOR_SITEMAPS
        except Exception:
            sitemaps = []
    items = []
    for sm in (sitemaps or []):
        try:
            r = requests.get(sm, headers={"User-Agent": UA}, timeout=TIMEOUT)
            r.raise_for_status()
            for page in parse_sitemap_recent(r.text):
                if not _looks_ai_related(page['keyword']):
                    continue
                items.append({
                    "title": page['keyword'],
                    "source": "Competitor New Page",
                    "engagement": 90,
                    "comments": 0,
                    "url": page['url'],
                    "competitor_page": True,
                })
        except Exception as e:
            _record_failure(f"Competitor sitemap {sm}", e)
            print(f"  Competitor sitemap {sm} fetch failed: {e}")
    return items


def gather_engagement_signals():
    """All free engagement sources combined, sorted by engagement desc."""
    LAST_FAILURES.clear()
    items = (fetch_hn() + fetch_reddit() + fetch_product_hunt()
             + fetch_github_trending() + fetch_competitor_new_pages())
    items.sort(key=lambda x: x.get("engagement", 0), reverse=True)
    return items

# crawler/trend_sources.py
#
# Free, no-key, engagement-weighted signals for trend detection.
# Each source returns normalized items: {title, source, engagement, comments, url}.
# `engagement` is the platform's hotness number (HN points / Reddit upvotes) —
# a single high-engagement story is a real trend even without multi-source
# corroboration, which jilo's narrow RSS set can't provide on its own.
#
# Every fetch is wrapped so one dead source never sinks the whole agent.
import time
import requests

UA = "jilo-trend/1.0 (+https://jilo.ai)"
TIMEOUT = 20

# Tool/launch-focused AI subreddits. Deliberately excludes meme-heavy
# communities (r/ChatGPT, r/singularity) whose top posts are jokes and
# philosophy, not tool signals.
DEFAULT_SUBREDDITS = [
    "LocalLLaMA", "OpenAI", "StableDiffusion", "artificial", "ClaudeAI",
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
            print(f"  Reddit r/{sub} fetch failed: {e}")
    return items


def gather_engagement_signals():
    """All free engagement sources combined, sorted by engagement desc."""
    items = fetch_hn() + fetch_reddit()
    items.sort(key=lambda x: x.get("engagement", 0), reverse=True)
    return items

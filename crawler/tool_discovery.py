# crawler/tool_discovery.py
# Sources: GitHub Trending (works reliably) + Hacker News "Show HN" AI posts
# NOTE: Product Hunt removed - it's a React SPA, requests.get() returns empty shell

import requests
import time
from bs4 import BeautifulSoup
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FEISHU_WEBHOOK_URL
from ops_logger import log_operation
from feishu_bot import send_feishu_alert

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; JiloBot/1.0; +https://jilo.ai)"}
AI_KEYWORDS = ['ai', 'llm', 'gpt', 'machine learning', 'neural', 'transformer',
               'diffusion', 'agent', 'language model', 'embedding', 'rag', 'claude',
               'openai', 'anthropic', 'gemini', 'inference', 'vector', 'chatbot']


def _get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    return OpenAI(api_key=OPENAI_API_KEY)


def crawl_github_trending():
    """Crawl GitHub trending repos filtered for AI/ML. Server-rendered, reliable."""
    tools = []
    try:
        url = "https://github.com/trending?since=daily&spoken_language_code=en"
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.content, 'html.parser')

        for row in soup.select('article.Box-row')[:25]:
            desc_el = row.select_one('p')
            desc = desc_el.text.strip() if desc_el else ''
            if not any(kw in desc.lower() for kw in AI_KEYWORDS):
                continue

            name_el = row.select_one('h2 a')
            if not name_el:
                continue

            repo_path = name_el.get('href', '').strip('/')
            repo_name = repo_path.split('/')[-1] if '/' in repo_path else repo_path
            # Skip vague names like "awesome-*" lists
            if repo_name.startswith('awesome-'):
                continue

            tools.append({
                'name': repo_name.replace('-', ' ').title(),
                'source_url': f"https://github.com/{repo_path}",
                'tagline': desc[:200],
                'source': 'GitHub Trending',
            })

        print(f"  GitHub Trending: {len(tools)} AI repos found")
    except Exception as e:
        print(f"  GitHub Trending error: {e}")
    return tools


def crawl_hackernews_show():
    """Crawl HN Show HN posts for AI tools via Algolia API - reliable JSON endpoint."""
    tools = []
    try:
        url = "https://hn.algolia.com/api/v1/search"
        params = {
            'query': 'Show HN AI tool',
            'tags': 'show_hn',
            'hitsPerPage': 20,
            'numericFilters': f'created_at_i>{int(time.time()) - 86400 * 3}',
        }
        resp = requests.get(url, params=params, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.json()

        for hit in data.get('hits', []):
            title = hit.get('title', '')
            url_val = hit.get('url', '')
            if not url_val or not title:
                continue

            title_lower = title.lower()
            if not any(kw in title_lower for kw in AI_KEYWORDS):
                continue
            if not title_lower.startswith('show hn'):
                continue

            # Extract tool name from "Show HN: ToolName – description"
            clean_title = title.replace('Show HN:', '').replace('Show HN -', '').strip()
            name_part = clean_title.split('–')[0].split(' - ')[0].strip()
            tool_name = name_part[:80] if len(name_part) >= 3 else clean_title[:80]

            if len(tool_name) < 3:
                continue

            tools.append({
                'name': tool_name,
                'source_url': url_val,
                'tagline': clean_title[:200],
                'source': 'Hacker News',
            })

        print(f"  Hacker News Show HN: {len(tools)} AI tools found")
    except Exception as e:
        print(f"  HN API error: {e}")
    return tools


def generate_tool_description(name, tagline, source_url):
    """Generate bilingual tool description with GPT-4o-mini (cost control)."""
    try:
        prompt = f"""You are describing an AI tool for a discovery platform.

Tool: {name}
Tagline: {tagline}
URL: {source_url}

Respond in this EXACT format (no extra text):
DESCRIPTION_EN: [150-200 word description: what it does, key features, who it's for]
DESCRIPTION_ZH: [Chinese translation of description]
CATEGORY: [exactly one of: Writing, Coding, Design, Video, Business, Image, Audio, Chatbot, Developer, Productivity, Research]
PRICING: [one of: free, freemium, paid, open_source]"""

        response = _get_openai_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a factual AI tool reviewer. Be concise and accurate."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=500
        )

        content = response.choices[0].message.content
        result = {}
        for line in content.split('\n'):
            for key in ['DESCRIPTION_EN', 'DESCRIPTION_ZH', 'CATEGORY', 'PRICING']:
                if line.startswith(f'{key}:'):
                    result[key.lower()] = line.split(':', 1)[1].strip()

        if not result.get('description_en') or len(result['description_en']) < 50:
            return {}
        return result
    except Exception as e:
        print(f"  AI description error: {e}")
        return {}


def save_tools_to_db(tools):
    """Save discovered tools to Supabase as drafts. Skip duplicates by slug and URL."""
    if not tools:
        return 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0

    for tool in tools:
        try:
            raw_name = tool['name']
            slug = raw_name.lower().replace(' ', '-').replace('/', '-')[:100]
            slug = ''.join(c for c in slug if c.isalnum() or c == '-')
            slug = '-'.join(filter(None, slug.split('-')))[:80]

            existing_slug = supabase.table('tools').select('id').eq('slug', slug).execute()
            if existing_slug.data:
                continue

            existing_url = supabase.table('tools').select('id').eq(
                'official_url', tool['source_url']
            ).execute()
            if existing_url.data:
                continue

            print(f"  Generating description for: {raw_name[:50]}...")
            ai_result = generate_tool_description(raw_name, tool['tagline'], tool['source_url'])

            if not ai_result:
                continue

            row = {
                'slug': slug,
                'name_en': raw_name[:100],
                'name_zh': raw_name[:100],
                'tagline_en': tool['tagline'][:200],
                'description_en': ai_result.get('description_en', ''),
                'description_zh': ai_result.get('description_zh', ''),
                'official_url': tool['source_url'],
                'category': ai_result.get('category', 'Productivity'),
                'pricing_type': ai_result.get('pricing', 'freemium'),
                'status': 'draft',
            }

            supabase.table('tools').insert(row).execute()
            saved += 1
            print(f"  Saved draft: {raw_name[:50]}")
            time.sleep(1)

        except Exception as e:
            print(f"  Error saving {tool.get('name', '?')[:40]}: {e}")
            continue

    return saved


if __name__ == "__main__":
    print("Starting AI tool discovery...")
    try:
        gh_tools = crawl_github_trending()
        hn_tools = crawl_hackernews_show()
        all_tools = gh_tools + hn_tools
        print(f"\nTotal found: {len(all_tools)} tools ({len(gh_tools)} GH, {len(hn_tools)} HN)")

        if not all_tools:
            log_operation("tool_discovery", "success", "No new tools found", {"saved": 0})
        else:
            saved = save_tools_to_db(all_tools)
            print(f"Saved {saved} new draft tools")
            log_operation("tool_discovery", "success", f"Saved {saved} tools", {
                "saved": saved, "gh_found": len(gh_tools), "hn_found": len(hn_tools),
            })

    except Exception as e:
        log_operation("tool_discovery", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "Tool Discovery Error", str(e), "error")
        raise

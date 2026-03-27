# crawler/tool_discovery.py
import requests
import time
from bs4 import BeautifulSoup
from supabase import create_client
from openai import OpenAI
from config import SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY
from ops_logger import log_operation
from feishu_bot import send_feishu_alert
from config import FEISHU_WEBHOOK_URL

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; JiloBot/1.0)"}


def _get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    return OpenAI(api_key=OPENAI_API_KEY)


def crawl_product_hunt():
    """Crawl Product Hunt AI topic for new tools."""
    tools = []
    try:
        url = "https://www.producthunt.com/topics/artificial-intelligence"
        resp = requests.get(url, headers=HEADERS, timeout=30)
        soup = BeautifulSoup(resp.content, 'html.parser')

        for article in soup.find_all('article')[:5]:
            title_el = article.find('h3')
            link_el = article.find('a')
            desc_el = article.find('p')
            if title_el and link_el:
                href = link_el.get('href', '')
                tools.append({
                    'name': title_el.text.strip()[:100],
                    'source_url': f"https://www.producthunt.com{href}" if not href.startswith('http') else href,
                    'tagline': desc_el.text.strip()[:200] if desc_el else '',
                    'source': 'Product Hunt',
                })
    except Exception as e:
        print(f"Product Hunt error: {e}")
    return tools


def crawl_github_trending():
    """Crawl GitHub trending repos filtered for AI/ML."""
    tools = []
    try:
        url = "https://github.com/trending?since=daily&spoken_language_code=en"
        resp = requests.get(url, headers=HEADERS, timeout=30)
        soup = BeautifulSoup(resp.content, 'html.parser')

        for row in soup.select('article.Box-row')[:20]:
            desc_el = row.select_one('p')
            desc = desc_el.text.strip() if desc_el else ''
            # Filter for AI-related repos
            ai_keywords = ['ai', 'llm', 'gpt', 'machine learning', 'neural', 'transformer', 'diffusion', 'agent']
            if not any(kw in desc.lower() for kw in ai_keywords):
                continue

            name_el = row.select_one('h2 a')
            if name_el:
                repo_path = name_el.get('href', '').strip('/')
                tools.append({
                    'name': repo_path.split('/')[-1] if '/' in repo_path else repo_path,
                    'source_url': f"https://github.com/{repo_path}",
                    'tagline': desc[:200],
                    'source': 'GitHub Trending',
                })
    except Exception as e:
        print(f"GitHub Trending error: {e}")
    return tools


def generate_tool_description(name, tagline, source_url):
    """Generate bilingual tool description with GPT-4o-mini."""
    try:
        prompt = f"""You are describing an AI tool for a discovery platform.

Tool: {name}
Tagline: {tagline}
URL: {source_url}

Respond in this exact format:
DESCRIPTION_EN: [150-200 word description: what it does, key features, who it's for]
DESCRIPTION_ZH: [Chinese translation of description]
CATEGORY: [exactly one of: Writing, Coding, Design, Video, Business, Image, Audio, Chatbot, Developer, Productivity]
PRICING: [one of: free, freemium, paid, open_source]"""

        response = _get_openai_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an AI tool reviewer. Be factual and concise."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=600
        )

        content = response.choices[0].message.content
        result = {}
        for line in content.split('\n'):
            for key in ['DESCRIPTION_EN', 'DESCRIPTION_ZH', 'CATEGORY', 'PRICING']:
                if line.startswith(f'{key}:'):
                    result[key.lower()] = line.split(':', 1)[1].strip()

        return result
    except Exception as e:
        print(f"  AI description error: {e}")
        return {}


def save_tools_to_db(tools):
    """Save discovered tools to Supabase, skip duplicates."""
    if not tools:
        return 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0

    for tool in tools:
        try:
            # Dedupe by name (case-insensitive)
            slug = tool['name'].lower().replace(' ', '-').replace('/', '-')[:100]
            slug = ''.join(c for c in slug if c.isalnum() or c == '-')

            existing = supabase.table('tools').select('id').eq('slug', slug).execute()
            if existing.data:
                continue

            # Generate AI description
            print(f"  Generating description for: {tool['name']}...")
            ai_result = generate_tool_description(tool['name'], tool['tagline'], tool['source_url'])

            if not ai_result:
                continue

            row = {
                'slug': slug,
                'name_en': tool['name'],
                'name_zh': tool['name'],  # Keep original for tool names
                'tagline_en': tool['tagline'],
                'description_en': ai_result.get('description_en', ''),
                'description_zh': ai_result.get('description_zh', ''),
                'official_url': tool['source_url'],
                'category': ai_result.get('category', 'Productivity'),
                'pricing_type': ai_result.get('pricing', 'freemium'),
                'status': 'draft',
            }

            supabase.table('tools').insert(row).execute()
            saved += 1
            print(f"  Saved: {tool['name']}")
            time.sleep(1)
        except Exception as e:
            print(f"  Error saving {tool['name']}: {e}")
            continue

    return saved


if __name__ == "__main__":
    print("Starting AI tool discovery...")
    try:
        ph_tools = crawl_product_hunt()
        gh_tools = crawl_github_trending()
        all_tools = ph_tools + gh_tools
        print(f"Found {len(all_tools)} tools ({len(ph_tools)} PH, {len(gh_tools)} GH)")

        saved = save_tools_to_db(all_tools)
        log_operation("tool_discovery", "success", f"Saved {saved} tools", {
            "saved": saved, "ph_found": len(ph_tools), "gh_found": len(gh_tools)
        })
    except Exception as e:
        log_operation("tool_discovery", "error", str(e))
        if FEISHU_WEBHOOK_URL:
            send_feishu_alert(FEISHU_WEBHOOK_URL, "Tool Discovery Error", str(e), "error")
        raise

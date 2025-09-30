import sys
import requests
from bs4 import BeautifulSoup
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY, SOURCES
from processors.translator import translate_text
from processors.cleaner import clean_tool_data
import time

def crawl_toolify():
    """爬取 Toolify.ai"""
    print("🔍 Crawling Toolify.ai...")
    
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(SOURCES["toolify"], headers=headers, timeout=30)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        tools = []
        tool_cards = soup.find_all('div', class_='tool-item')[:5]  # 抓取前5个
        
        for card in tool_cards:
            try:
                name = card.find('h3').text.strip() if card.find('h3') else ""
                desc = card.find('p').text.strip() if card.find('p') else ""
                link = card.find('a')['href'] if card.find('a') else ""
                
                if name and link:
                    tool = {
                        'name_en': name,
                        'tagline_en': desc[:200] if desc else "",
                        'official_url': link if link.startswith('http') else f"https://www.toolify.ai{link}",
                        'pricing_type': 'freemium',
                        'source': 'toolify'
                    }
                    tools.append(tool)
                    print(f"  ✓ Found: {name}")
            except Exception as e:
                print(f"  ✗ Error parsing card: {e}")
                continue
        
        return tools
    except Exception as e:
        print(f"❌ Toolify crawl error: {e}")
        return []

def save_to_database(tools):
    """保存到 Supabase"""
    if not tools:
        print("No tools to save")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0
    
    for tool in tools:
        try:
            # 清洗数据
            cleaned = clean_tool_data(tool)
            
            # 生成 slug
            slug = cleaned['name_en'].lower().replace(' ', '-').replace('/', '-')[:100]
            cleaned['slug'] = slug
            
            # 检查是否存在
            existing = supabase.table('tools').select('id').eq('slug', slug).execute()
            if existing.data:
                print(f"  ⏭️  Skip (exists): {cleaned['name_en']}")
                continue
            
            # 翻译
            print(f"  🌐 Translating: {cleaned['name_en']}")
            cleaned['name_zh'] = translate_text(cleaned['name_en'])
            if cleaned.get('tagline_en'):
                cleaned['tagline_zh'] = translate_text(cleaned['tagline_en'])
            
            # 插入数据库
            cleaned['status'] = 'draft'  # 待审核
            result = supabase.table('tools').insert(cleaned).execute()
            
            if result.data:
                saved += 1
                print(f"  ✅ Saved: {cleaned['name_en']}")
            
            time.sleep(1)  # 避免请求过快
            
        except Exception as e:
            print(f"  ❌ Error saving {tool.get('name_en')}: {e}")
    
    print(f"\n✅ Saved {saved}/{len(tools)} tools")

if __name__ == "__main__":
    print("🚀 Starting crawler...")
    tools = crawl_toolify()
    save_to_database(tools)
    print("🎉 Done!")
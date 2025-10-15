"""
AI工具爬虫 - 从多个来源抓取工具信息
"""
import requests
import time
from bs4 import BeautifulSoup
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY
import re
from urllib.parse import urlparse

def generate_slug(name):
    """生成URL友好的slug"""
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug[:100]

def get_favicon_url(url):
    """获取网站favicon"""
    try:
        domain = urlparse(url).netloc
        return f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
    except:
        return None

def crawl_producthunt_ai():
    """
    从Product Hunt抓取AI工具
    注意：这需要Product Hunt API key
    """
    print("\n🚀 Crawling Product Hunt AI tools...")
    
    # 这里使用Product Hunt API
    # 需要在 https://www.producthunt.com/v2/oauth/applications 申请API key
    
    api_key = os.getenv("PRODUCTHUNT_API_KEY")
    if not api_key:
        print("⚠️  No Product Hunt API key found. Skipping...")
        return []
    
    url = "https://api.producthunt.com/v2/api/graphql"
    
    query = """
    query {
      posts(topic: "artificial-intelligence", order: VOTES, first: 20) {
        edges {
          node {
            name
            tagline
            description
            url
            website
            votesCount
            createdAt
            topics {
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      }
    }
    """
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json={"query": query}, headers=headers)
        data = response.json()
        
        tools = []
        for edge in data['data']['posts']['edges']:
            node = edge['node']
            
            tool = {
                'name_en': node['name'],
                'tagline_en': node['tagline'],
                'description_en': node['description'][:500],
                'official_url': node['website'] or node['url'],
                'source': 'Product Hunt',
                'source_url': node['url'],
                'pricing_type': 'freemium',  # 默认值
                'category': 'AI Tool',
                'rating': min(5.0, node['votesCount'] / 100),  # 简单评分
                'status': 'draft'  # 需要人工审核
            }
            
            tools.append(tool)
        
        print(f"✅ Found {len(tools)} tools from Product Hunt")
        return tools
        
    except Exception as e:
        print(f"❌ Error crawling Product Hunt: {e}")
        return []

def crawl_theresanaiforthat():
    """
    从 There's An AI For That 抓取
    注意：这是简化的爬虫示例
    """
    print("\n🤖 Crawling There's An AI For That...")
    
    # 这个网站有反爬虫，需要使用headers和适当的延迟
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    tools = []
    
    try:
        # 抓取分类页面
        categories = ['writing', 'image', 'video', 'code', 'chatbot']
        
        for category in categories:
            url = f"https://theresanaiforthat.com/{category}"
            
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 这里需要根据实际HTML结构调整选择器
            # 这只是示例代码
            tool_cards = soup.select('.tool-card')[:5]  # 每个分类取5个
            
            for card in tool_cards:
                try:
                    name = card.select_one('.tool-name').text.strip()
                    tagline = card.select_one('.tool-tagline').text.strip()
                    url = card.select_one('a')['href']
                    
                    tool = {
                        'name_en': name,
                        'tagline_en': tagline,
                        'description_en': tagline,  # 初始描述
                        'official_url': url,
                        'source': "There's An AI For That",
                        'source_url': f"https://theresanaiforthat.com{url}",
                        'category': category.title(),
                        'pricing_type': 'freemium',
                        'status': 'draft'
                    }
                    
                    tools.append(tool)
                    
                except Exception as e:
                    continue
            
            time.sleep(2)  # 避免被封IP
        
        print(f"✅ Found {len(tools)} tools from There's An AI For That")
        return tools
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def crawl_futurepedia():
    """
    从Futurepedia抓取（简化示例）
    """
    print("\n🔮 Crawling Futurepedia...")
    
    # Futurepedia有API，可以直接调用
    # 这里是示例代码
    
    url = "https://www.futurepedia.io/api/tools"
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            tools = []
            
            for item in data.get('tools', [])[:20]:
                tool = {
                    'name_en': item.get('name', ''),
                    'tagline_en': item.get('tagline', ''),
                    'description_en': item.get('description', '')[:500],
                    'official_url': item.get('url', ''),
                    'source': 'Futurepedia',
                    'category': item.get('category', 'AI Tool'),
                    'pricing_type': item.get('pricing', 'freemium'),
                    'status': 'draft'
                }
                tools.append(tool)
            
            print(f"✅ Found {len(tools)} tools from Futurepedia")
            return tools
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return []

def save_tools_to_db(tools):
    """保存工具到数据库"""
    
    if not tools:
        print("No tools to save")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0
    skipped = 0
    
    for tool in tools:
        try:
            # 生成slug
            slug = generate_slug(tool['name_en'])
            tool['slug'] = slug
            
            # 添加logo_url
            if tool.get('official_url'):
                tool['logo_url'] = get_favicon_url(tool['official_url'])
            
            # 检查是否已存在
            existing = supabase.table('tools').select('id').eq('slug', slug).execute()
            
            if existing.data:
                print(f"⏭️  Skip (exists): {tool['name_en']}")
                skipped += 1
                continue
            
            # 插入
            result = supabase.table('tools').insert(tool).execute()
            
            if result.data:
                saved += 1
                print(f"✅ Saved: {tool['name_en']}")
            
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ Error saving {tool.get('name_en', 'unknown')}: {e}")
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Saved: {saved}")
    print(f"   ⏭️  Skipped: {skipped}")
    print(f"   📝 Total: {len(tools)}")

def main():
    """主函数"""
    
    print("🚀 Starting AI Tool Crawler")
    print("=" * 60)
    
    all_tools = []
    
    # 方法1: Product Hunt (需要API key)
    # all_tools.extend(crawl_producthunt_ai())
    
    # 方法2: There's An AI For That (需要爬虫)
    # all_tools.extend(crawl_theresanaiforthat())
    
    # 方法3: Futurepedia (如果有API)
    # all_tools.extend(crawl_futurepedia())
    
    # 由于这些网站都有反爬虫措施，推荐使用手动方式：
    print("\n💡 Recommendation:")
    print("   Instead of scraping, consider:")
    print("   1. Apply for API access (Product Hunt, etc.)")
    print("   2. Manual curation from these sources")
    print("   3. User submissions via your website")
    print("   4. RSS feeds from AI news sites")
    
    # 保存到数据库
    if all_tools:
        save_tools_to_db(all_tools)
    else:
        print("\n⚠️  No tools crawled. See recommendations above.")

if __name__ == "__main__":
    main()
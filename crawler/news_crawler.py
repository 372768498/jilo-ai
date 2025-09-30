import requests
from bs4 import BeautifulSoup
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY
from processors.translator import translate_text
import time

def crawl_ai_news():
    """爬取 AI 新闻（示例：从多个来源）"""
    print("📰 Crawling AI news...")
    
    news_list = []
    
    # 来源 1: Product Hunt AI 话题
    try:
        url = "https://www.producthunt.com/topics/artificial-intelligence"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=30)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        articles = soup.find_all('article')[:3]  # 前3条
        
        for article in articles:
            try:
                title = article.find('h3')
                link = article.find('a')
                
                if title and link:
                    news_item = {
                        'title_en': title.text.strip()[:200],
                        'source': 'Product Hunt',
                        'source_url': f"https://www.producthunt.com{link['href']}" if not link['href'].startswith('http') else link['href'],
                        'news_type': 'product_launch'
                    }
                    news_list.append(news_item)
                    print(f"  ✓ Found: {news_item['title_en'][:50]}")
            except:
                continue
                
    except Exception as e:
        print(f"  ✗ Product Hunt error: {e}")
    
    return news_list

def save_news_to_db(news_list):
    """保存新闻到数据库"""
    if not news_list:
        print("No news to save")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0
    
    for news in news_list:
        try:
            # 生成 slug
            slug = news['title_en'].lower().replace(' ', '-')[:100]
            slug = ''.join(c for c in slug if c.isalnum() or c == '-')
            
            # 检查是否存在
            existing = supabase.table('news').select('id').eq('slug', slug).execute()
            if existing.data:
                print(f"  ⏭️  Skip (exists): {news['title_en'][:50]}")
                continue
            
            # 翻译
            print(f"  🌐 Translating: {news['title_en'][:50]}")
            news['title_zh'] = translate_text(news['title_en'])
            
            # 添加其他字段
            news['slug'] = slug
            news['status'] = 'draft'  # 待审核
            
            # 插入
            result = supabase.table('news').insert(news).execute()
            if result.data:
                saved += 1
                print(f"  ✅ Saved: {news['title_en'][:50]}")
            
            time.sleep(1)
            
        except Exception as e:
            print(f"  ❌ Error saving {news.get('title_en', '')[:30]}: {e}")
    
    print(f"\n✅ Saved {saved}/{len(news_list)} news items")

if __name__ == "__main__":
    print("🚀 Starting news crawler...")
    news =


 news = crawl_ai_news()
    save_news_to_db(news)
    print("🎉 Done!")
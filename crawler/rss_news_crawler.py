import feedparser
import time
from datetime import datetime
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY
from processors.translator import translate_text
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

RSS_SOURCES = {
    'TechCrunch AI': 'https://techcrunch.com/tag/artificial-intelligence/feed/',
    'VentureBeat AI': 'https://venturebeat.com/category/ai/feed/',
    'The Verge AI': 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
    # 🆕 新增更多优质来源
    'MIT Tech Review AI': 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    'OpenAI Blog': 'https://openai.com/blog/rss/',
}

def parse_published_date(entry):
    """解析RSS条目的发布时间"""
    # 尝试多个时间字段
    for field in ['published_parsed', 'updated_parsed', 'created_parsed']:
        if hasattr(entry, field):
            time_struct = getattr(entry, field)
            if time_struct:
                return datetime(*time_struct[:6]).isoformat()
    
    # 如果都没有，使用当前时间
    return datetime.now().isoformat()

def rewrite_with_ai(title, summary, source_url):
    """用 AI 改写新闻，生成原创内容"""
    try:
        prompt = f"""
        Rewrite this AI news in your own words. Make it engaging and SEO-friendly.
        Keep it under 200 words. Focus on the key information.
        
        Original title: {title}
        Original summary: {summary[:500]}
        
        Provide:
        1. A new catchy title (max 100 chars)
        2. A rewritten summary (150-200 words)
        
        Format as:
        TITLE: [new title]
        SUMMARY: [new summary]
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # 🆕 改用gpt-4o-mini，更快更便宜
            messages=[
                {"role": "system", "content": "You are an AI news editor. Rewrite news to be original while keeping facts accurate."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=400
        )
        
        content = response.choices[0].message.content
        
        # 解析结果
        lines = content.split('\n')
        new_title = ""
        new_summary = ""
        
        for line in lines:
            if line.startswith('TITLE:'):
                new_title = line.replace('TITLE:', '').strip()
            elif line.startswith('SUMMARY:'):
                new_summary = line.replace('SUMMARY:', '').strip()
        
        return new_title, new_summary
        
    except Exception as e:
        print(f"AI rewrite error: {e}")
        return title, summary[:200]

def crawl_rss_news():
    """从 RSS 抓取并改写新闻"""
    print("📰 Crawling RSS news sources...")
    news_list = []
    
    for source, url in RSS_SOURCES.items():
        try:
            print(f"\n📡 Fetching from {source}...")
            feed = feedparser.parse(url)
            
            # 🆕 每个源取5条（原来是2条）
            for entry in feed.entries[:5]:
                try:
                    # 🆕 解析发布时间
                    published_at = parse_published_date(entry)
                    
                    # AI 改写
                    print(f"  ✍️  Rewriting: {entry.title[:50]}...")
                    new_title, new_summary = rewrite_with_ai(
                        entry.title,
                        entry.get('summary', entry.get('description', '')),
                        entry.link
                    )
                    
                    news_item = {
                        'title_en': new_title,
                        'summary_en': new_summary,
                        'source': source,
                        'source_url': entry.link,
                        'news_type': 'industry_news',
                        'published_at': published_at,  # 🆕 添加发布时间！
                        'status': 'published'  # 🆕 直接设置为已发布
                    }
                    
                    news_list.append(news_item)
                    print(f"  ✓ Rewritten: {new_title[:50]} | {published_at[:10]}")
                    time.sleep(1)  # 🆕 减少延迟（原来是2秒）
                    
                except Exception as e:
                    print(f"  ✗ Error processing entry: {e}")
                    continue
            
        except Exception as e:
            print(f"✗ Error fetching {source}: {e}")
            continue
    
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
            slug = news['title_en'].lower()[:80]
            slug = ''.join(c if c.isalnum() or c == ' ' else '' for c in slug)
            slug = slug.replace(' ', '-')[:100]
            
            # 去重检查
            existing = supabase.table('news').select('id').eq('slug', slug).execute()
            if existing.data:
                print(f"  ⏭️  Skip (exists): {news['title_en'][:50]}")
                continue
            
            # 翻译成中文
            print(f"  🌐 Translating: {news['title_en'][:50]}")
            news['title_zh'] = translate_text(news['title_en'])
            news['summary_zh'] = translate_text(news['summary_en'])
            
            # 添加字段
            news['slug'] = slug
            
            # 插入
            result = supabase.table('news').insert(news).execute()
            if result.data:
                saved += 1
                print(f"  ✅ Saved: {news['title_en'][:50]}")
            
            time.sleep(0.5)  # 🆕 减少延迟
            
        except Exception as e:
            print(f"  ❌ Error saving: {e}")
    
    print(f"\n✅ Successfully saved {saved}/{len(news_list)} news items")

if __name__ == "__main__":
    print("🚀 Starting RSS news crawler with AI rewriting...")
    news = crawl_rss_news()
    save_news_to_db(news)
    print("🎉 Done!")
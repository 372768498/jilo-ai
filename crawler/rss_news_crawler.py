import feedparser
import time
from datetime import datetime
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY
from processors.translator import translate_text
from openai import OpenAI
import os
import hashlib

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

RSS_SOURCES = {
    'TechCrunch AI': 'https://techcrunch.com/tag/artificial-intelligence/feed/',
    'VentureBeat AI': 'https://venturebeat.com/category/ai/feed/',
    'The Verge AI': 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
    'MIT Tech Review AI': 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    'OpenAI Blog': 'https://openai.com/blog/rss/',
}

def generate_slug(title):
    """生成 URL 友好的 slug"""
    slug = title.lower()[:80]
    slug = ''.join(c if c.isalnum() or c == ' ' else '' for c in slug)
    slug = slug.replace(' ', '-').strip('-')
    return slug[:100]

def generate_content_hash(title, source_url):
    """生成内容哈希，用于去重"""
    content = f"{title}{source_url}"
    return hashlib.md5(content.encode()).hexdigest()

def parse_published_date(entry):
    """解析RSS条目的发布时间"""
    for field in ['published_parsed', 'updated_parsed', 'created_parsed']:
        if hasattr(entry, field):
            time_struct = getattr(entry, field)
            if time_struct:
                return datetime(*time_struct[:6]).isoformat()
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
            model="gpt-4o-mini",
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
        
        return new_title or title, new_summary or summary[:200]
        
    except Exception as e:
        print(f"  ⚠️  AI rewrite error: {e}")
        return title, summary[:200]

def crawl_rss_news():
    """从 RSS 抓取并改写新闻"""
    print("📰 Crawling RSS news sources...")
    news_list = []
    
    for source, url in RSS_SOURCES.items():
        try:
            print(f"\n📡 Fetching from {source}...")
            feed = feedparser.parse(url)
            
            # 每个源取3条最新的
            for entry in feed.entries[:3]:
                try:
                    published_at = parse_published_date(entry)
                    
                    # AI 改写
                    print(f"  ✍️  Rewriting: {entry.title[:50]}...")
                    new_title, new_summary = rewrite_with_ai(
                        entry.title,
                        entry.get('summary', entry.get('description', '')),
                        entry.link
                    )
                    
                    # 生成唯一标识
                    content_hash = generate_content_hash(new_title, entry.link)
                    
                    news_item = {
                        'title_en': new_title,
                        'summary_en': new_summary,
                        'source': source,
                        'source_url': entry.link,
                        'news_type': 'industry_news',
                        'published_at': published_at,
                        'status': 'published',
                        'content_hash': content_hash  # 用于去重
                    }
                    
                    news_list.append(news_item)
                    print(f"  ✅ Rewritten: {new_title[:50]}")
                    time.sleep(1)
                    
                except Exception as e:
                    print(f"  ❌ Error processing entry: {e}")
                    continue
            
        except Exception as e:
            print(f"❌ Error fetching {source}: {e}")
            continue
    
    return news_list

def save_news_to_db(news_list):
    """保存新闻到数据库，避免重复"""
    if not news_list:
        print("No news to save")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0
    skipped = 0
    
    for news in news_list:
        try:
            # 使用 content_hash 去重
            existing = supabase.table('news').select('id').eq('content_hash', news['content_hash']).execute()
            if existing.data:
                print(f"  ⏭️  Skip (duplicate): {news['title_en'][:50]}")
                skipped += 1
                continue
            
            # 生成 slug
            slug = generate_slug(news['title_en'])
            
            # 翻译成中文
            print(f"  🌐 Translating: {news['title_en'][:50]}...")
            news['title_zh'] = translate_text(news['title_en'])
            news['summary_zh'] = translate_text(news['summary_en'])
            
            # 添加 slug
            news['slug'] = slug
            
            # 插入数据库
            result = supabase.table('news').insert(news).execute()
            if result.data:
                saved += 1
                print(f"  ✅ Saved: {news['title_en'][:50]}")
            
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  ❌ Error saving: {e}")
            continue
    
    print(f"\n📊 Summary:")
    print(f"  ✅ Saved: {saved}")
    print(f"  ⏭️  Skipped (duplicates): {skipped}")
    print(f"  📝 Total processed: {len(news_list)}")

if __name__ == "__main__":
    print("🚀 Starting RSS news crawler with AI rewriting...")
    print("=" * 60)
    news = crawl_rss_news()
    save_news_to_db(news)
    print("=" * 60)
    print("🎉 Done!")

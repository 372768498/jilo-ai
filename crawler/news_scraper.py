import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import hashlib
import re
from typing import List, Dict
from supabase import create_client
from openai import OpenAI

class NewsAggregator:
    def __init__(self):
        self.supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_KEY')
        )
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
    def generate_slug(self, title: str) -> str:
        slug = re.sub(r'[^\w\s-]', '', title.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug[:100]
    
    def translate_to_chinese(self, text: str) -> str:
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "你是一个专业的AI新闻翻译专家。将英文AI新闻翻译成地道的中文,保持专业术语准确。"},
                    {"role": "user", "content": f"请翻译以下内容:\n\n{text}"}
                ],
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"翻译失败: {e}")
            return text
    
    def scrape_techcrunch_ai(self) -> List[Dict]:
        news_list = []
        try:
            url = "https://techcrunch.com/category/artificial-intelligence/"
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            articles = soup.find_all('article', limit=5)
            for article in articles:
                try:
                    title_elem = article.find('h2') or article.find('h3')
                    link_elem = article.find('a', href=True)
                    summary_elem = article.find('p')
                    img_elem = article.find('img')
                    
                    if not title_elem or not link_elem:
                        continue
                    
                    news_item = {
                        'title': title_elem.get_text(strip=True),
                        'url': link_elem['href'],
                        'summary': summary_elem.get_text(strip=True)[:300] if summary_elem else '',
                        'image': img_elem.get('src', '') if img_elem else '',
                        'source': 'TechCrunch',
                        'category': 'AI News'
                    }
                    news_list.append(news_item)
                except Exception as e:
                    print(f"解析文章失败: {e}")
                    continue
        except Exception as e:
            print(f"抓取TechCrunch失败: {e}")
        
        return news_list
    
    def save_news(self, news_list: List[Dict]):
        for news in news_list:
            try:
                existing = self.supabase.table('news').select('id').eq('source_url', news['url']).execute()
                
                if existing.data:
                    print(f"新闻已存在,跳过: {news['title']}")
                    continue
                
                en_slug = self.generate_slug(news['title'])
                en_data = {
                    'title': news['title'],
                    'slug': en_slug,
                    'summary': news['summary'],
                    'content': f"<p>{news['summary']}</p>",
                    'source_url': news['url'],
                    'image_url': news['image'],
                    'category': news['category'],
                    'language': 'en',
                    'status': 'draft',
                    'published_at': datetime.now().isoformat()
                }
                
                self.supabase.table('news').insert(en_data).execute()
                print(f"✅ 保存英文新闻: {news['title']}")
                
                zh_title = self.translate_to_chinese(news['title'])
                zh_summary = self.translate_to_chinese(news['summary'])
                zh_slug = self.generate_slug(zh_title)
                
                zh_data = {
                    'title': zh_title,
                    'slug': zh_slug,
                    'summary': zh_summary,
                    'content': f"<p>{zh_summary}</p>",
                    'source_url': news['url'],
                    'image_url': news['image'],
                    'category': news['category'],
                    'language': 'zh',
                    'status': 'draft',
                    'published_at': datetime.now().isoformat()
                }
                
                self.supabase.table('news').insert(zh_data).execute()
                print(f"✅ 保存中文新闻: {zh_title}")
                
            except Exception as e:
                print(f"保存新闻失败: {e}")
                continue
    
    def run(self):
        print("🚀 开始抓取AI新闻...")
        all_news = []
        print("📰 抓取TechCrunch...")
        all_news.extend(self.scrape_techcrunch_ai())
        print(f"\n📊 共抓取 {len(all_news)} 条新闻")
        if all_news:
            print("\n💾 保存新闻到数据库...")
            self.save_news(all_news)
        print("\n✅ 新闻抓取完成!")

if __name__ == "__main__":
    aggregator = NewsAggregator()
    aggregator.run()

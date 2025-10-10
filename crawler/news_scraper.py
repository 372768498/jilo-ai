def save_news(self, news_list: List[Dict]):
        for news in news_list:
            try:
                # 🔧 修复：分别检查英文和中文记录是否存在
                existing_en = self.supabase.table('news').select('id').eq('source_url', news['url']).eq('language', 'en').execute()
                existing_zh = self.supabase.table('news').select('id').eq('source_url', news['url']).eq('language', 'zh').execute()
                
                # 保存英文新闻（如果不存在）
                if not existing_en.data:
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
                        'status': 'published',
                        'published_at': news['published_at']
                    }
                    
                    self.supabase.table('news').insert(en_data).execute()
                    print(f"✅ 保存英文新闻: {news['title']}")
                else:
                    print(f"⏭️ 英文新闻已存在,跳过: {news['title']}")
                
                # 保存中文新闻（如果不存在）
                if not existing_zh.data:
                    print(f"🔵 翻译中文新闻: {news['title']}")
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
                        'status': 'published',
                        'published_at': news['published_at']
                    }
                    
                    self.supabase.table('news').insert(zh_data).execute()
                    print(f"✅ 保存中文新闻: {zh_title}")
                else:
                    print(f"⏭️ 中文新闻已存在,跳过")
                
            except Exception as e:
                print(f"❌ 保存新闻失败: {e}")
                import traceback
                traceback.print_exc()
                continue
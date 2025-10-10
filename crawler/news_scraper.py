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
                        'title_en': news['title'],  # ✅ 使用正确的字段名
                        'slug': en_slug,
                        'summary_en': news['summary'],  # ✅ 使用正确的字段名
                        'content_en': f"<p>{news['summary']}</p>",  # ✅ 使用正确的字段名
                        'source_url': news['url'],
                        'cover_image_url': news['image'],  # ✅ 使用正确的字段名
                        'source': news['source'],  # ✅ 使用 source 而不是 category
                        'language': 'en',
                        'status': 'published',
                        'published_at': news['published_at']
                    }
                    
                    self.supabase.table('news').insert(en_data).execute()
                    print(f"✅ Saved English news: {news['title']}")
                else:
                    print(f"⏭️  English news exists, skipping: {news['title']}")
                
                # 保存中文新闻（如果不存在）
                if not existing_zh.data:
                    print(f"🔵 Translating to Chinese: {news['title']}")
                    zh_title = self.translate_to_chinese(news['title'])
                    zh_summary = self.translate_to_chinese(news['summary'])
                    zh_slug = self.generate_slug(zh_title)
                    
                    zh_data = {
                        'title_zh': zh_title,  # ✅ 使用正确的字段名
                        'slug': zh_slug,
                        'summary_zh': zh_summary,  # ✅ 使用正确的字段名
                        'content_zh': f"<p>{zh_summary}</p>",  # ✅ 使用正确的字段名
                        'source_url': news['url'],
                        'cover_image_url': news['image'],  # ✅ 使用正确的字段名
                        'source': news['source'],  # ✅ 使用 source 而不是 category
                        'language': 'zh',
                        'status': 'published',
                        'published_at': news['published_at']
                    }
                    
                    self.supabase.table('news').insert(zh_data).execute()
                    print(f"✅ Saved Chinese news: {zh_title}")
                else:
                    print(f"⏭️  Chinese news exists, skipping")
                
            except Exception as e:
                print(f"❌ Failed to save news: {e}")
                import traceback
                traceback.print_exc()
                continue
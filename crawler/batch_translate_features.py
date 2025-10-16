import os
import time
import json
from openai import OpenAI
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def translate_arrays(name, features, pros, cons, use_cases):
    """批量翻译数组内容"""
    try:
        content_to_translate = {
            "features": features or [],
            "pros": pros or [],
            "cons": cons or [],
            "use_cases": use_cases or []
        }
        
        prompt = f"""
Translate the following content for AI tool "{name}" to Chinese. Keep it natural and professional.

Content (JSON):
{json.dumps(content_to_translate, ensure_ascii=False, indent=2)}

Return ONLY valid JSON with Chinese translations in THE EXACT SAME structure:
{{
  "features_zh": [{{"title": "...", "description": "..."}}, ...],
  "pros_zh": ["...", "...", ...],
  "cons_zh": ["...", "...", ...],
  "use_cases_zh": [{{"title": "...", "description": "..."}}, ...]
}}

Important: Keep the same number of items and same order.
"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional translator. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        print(f"  ❌ Translation error: {e}")
        return None

def merge_bilingual_content(en_items, zh_items):
    """合并英文和中文内容为双语格式"""
    if not en_items or not zh_items:
        return en_items
    
    result = []
    for i, en_item in enumerate(en_items):
        if i >= len(zh_items):
            result.append(en_item)
            continue
            
        if isinstance(en_item, dict):
            # 对象数组（features, use_cases）
            merged = {
                "title_en": en_item.get("title", ""),
                "title_zh": zh_items[i].get("title", ""),
                "description_en": en_item.get("description", ""),
                "description_zh": zh_items[i].get("description", "")
            }
            result.append(merged)
        else:
            # 字符串数组（pros, cons）
            merged = {
                "en": en_item,
                "zh": zh_items[i]
            }
            result.append(merged)
    
    return result

def update_tool_bilingual(tool_id, features, pros, cons, use_cases):
    """更新工具为双语格式"""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        update_data = {
            'features': features,
            'pros': pros,
            'cons': cons,
            'use_cases': use_cases,
        }
        
        result = supabase.table('tools').update(update_data).eq('id', tool_id).execute()
        return result.data is not None
        
    except Exception as e:
        print(f"  ❌ Database error: {e}")
        return False

def process_all_tools():
    """处理所有工具"""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("📊 Fetching tools from database...")
    
    # 获取所有有features但还是英文格式的工具
    result = supabase.table('tools').select('id, name_en, features, pros, cons, use_cases').not_.is_('features', 'null').execute()
    
    tools = result.data
    
    # 过滤出还没有翻译的（检查features第一项是否有title_zh字段）
    tools_to_translate = []
    for tool in tools:
        if tool.get('features') and len(tool['features']) > 0:
            first_feature = tool['features'][0]
            # 如果是旧格式（只有title字段，没有title_en）
            if isinstance(first_feature, dict) and 'title' in first_feature and 'title_en' not in first_feature:
                tools_to_translate.append(tool)
    
    total = len(tools_to_translate)
    
    if total == 0:
        print("✅ All tools already have bilingual content!")
        return
    
    print(f"🎯 Found {total} tools needing translation\n")
    
    success = 0
    failed = 0
    
    for i, tool in enumerate(tools_to_translate, 1):
        name = tool.get('name_en', 'Unknown')
        print(f"[{i}/{total}] Processing: {name}")
        
        try:
            # 翻译内容
            print(f"  🌐 Translating content...")
            zh_content = translate_arrays(
                name,
                tool.get('features'),
                tool.get('pros'),
                tool.get('cons'),
                tool.get('use_cases')
            )
            
            if not zh_content:
                failed += 1
                continue
            
            # 合并为双语格式
            print(f"  🔄 Merging bilingual content...")
            features_bilingual = merge_bilingual_content(
                tool.get('features', []),
                zh_content.get('features_zh', [])
            )
            pros_bilingual = merge_bilingual_content(
                tool.get('pros', []),
                zh_content.get('pros_zh', [])
            )
            cons_bilingual = merge_bilingual_content(
                tool.get('cons', []),
                zh_content.get('cons_zh', [])
            )
            use_cases_bilingual = merge_bilingual_content(
                tool.get('use_cases', []),
                zh_content.get('use_cases_zh', [])
            )
            
            # 保存到数据库
            print(f"  💾 Saving to database...")
            if update_tool_bilingual(
                tool['id'],
                features_bilingual,
                pros_bilingual,
                cons_bilingual,
                use_cases_bilingual
            ):
                success += 1
                print(f"  ✅ Success! ({success}/{total})\n")
            else:
                failed += 1
                print(f"  ❌ Failed to save\n")
            
            time.sleep(2)
            
        except Exception as e:
            print(f"  ❌ Error: {e}\n")
            failed += 1
            continue
    
    print(f"\n{'='*50}")
    print(f"🎉 Processing complete!")
    print(f"✅ Success: {success}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total: {total}")
    print(f"💰 Estimated cost: ${success * 0.007:.2f}")
    print(f"{'='*50}")

if __name__ == "__main__":
    print("🚀 Starting batch translation...\n")
    process_all_tools()
    print("\n✨ Done!")
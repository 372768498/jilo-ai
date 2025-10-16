import os
import time
import json
from openai import OpenAI
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_seo_content(tool):
    """为单个工具生成所有SEO内容"""
    # 兼容不同的字段名
    name = tool.get('tool_name') or tool.get('name', '')
    description = tool.get('description_en', '')
    category = tool.get('category', '')
    website = tool.get('website_url', '')
    
    prompt = f"""
You are an AI tools expert. Generate comprehensive SEO content for this AI tool:

Tool Name: {name}
Category: {category}
Brief Description: {description}
Website: {website}

Generate the following in JSON format:

1. long_description (300-500 words): Detailed explanation of what the tool does, its technology, target users, and unique value proposition. Write naturally and engagingly.

2. features (5-8 items): Core features, each as a JSON object with:
   - "title": Feature name (max 50 chars)
   - "description": Feature explanation (80-120 chars)

3. pros (3-5 items): Advantages, each as a string (50-100 chars)

4. cons (2-4 items): Limitations or drawbacks, each as a string (50-100 chars)

5. use_cases (3-5 items): Real-world use cases, each as a JSON object with:
   - "title": Use case name (max 50 chars)
   - "description": Use case explanation (80-120 chars)

6. meta_title (max 60 chars): SEO-optimized page title

7. meta_description (150-160 chars): SEO-optimized meta description

Important:
- Be factual and accurate
- Write for humans, not just search engines
- Include relevant keywords naturally
- Be honest about limitations
- Focus on user value

Return ONLY valid JSON with this structure:
{{
  "long_description": "...",
  "features": [{{"title": "...", "description": "..."}}, ...],
  "pros": ["...", "...", ...],
  "cons": ["...", "...", ...],
  "use_cases": [{{"title": "...", "description": "..."}}, ...],
  "meta_title": "...",
  "meta_description": "..."
}}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an AI tools expert and SEO specialist. Generate accurate, engaging content in JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        content = json.loads(response.choices[0].message.content)
        return content
        
    except Exception as e:
        print(f"  ❌ Error generating content: {e}")
        return None

def translate_seo_content(content):
    """翻译SEO内容到中文"""
    try:
        prompt = f"""
Translate the following AI tool content to Chinese. Keep it natural and professional.

Original content (JSON):
{json.dumps(content, ensure_ascii=False, indent=2)}

Return ONLY valid JSON with Chinese translations:
{{
  "long_description_zh": "...",
  "features_zh": [{{"title": "...", "description": "..."}}, ...],
  "pros_zh": ["...", "...", ...],
  "cons_zh": ["...", "...", ...],
  "use_cases_zh": [{{"title": "...", "description": "..."}}, ...],
  "meta_title_zh": "...",
  "meta_description_zh": "..."
}}
"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional translator specializing in tech content. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        translated = json.loads(response.choices[0].message.content)
        return translated
        
    except Exception as e:
        print(f"  ❌ Translation error: {e}")
        return None

def update_tool_in_db(tool_id, en_content, zh_content):
    """更新工具的SEO内容到数据库"""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        update_data = {
            # 英文内容
            'long_description_en': en_content['long_description'],
            'features': en_content['features'],
            'pros': en_content['pros'],
            'cons': en_content['cons'],
            'use_cases': en_content['use_cases'],
            'meta_title_en': en_content['meta_title'],
            'meta_description_en': en_content['meta_description'],
            
            # 中文内容
            'long_description_zh': zh_content['long_description_zh'],
            'meta_title_zh': zh_content['meta_title_zh'],
            'meta_description_zh': zh_content['meta_description_zh'],
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
    
    # 先获取所有工具，不限制字段
    try:
        result = supabase.table('tools').select('*').limit(5).execute()
        
        if not result.data:
            print("❌ No tools found in database")
            return
        
        # 检查第一个工具的字段
        first_tool = result.data[0]
        print(f"🔍 Detected fields: {', '.join(first_tool.keys())}\n")
        
        # 检测正确的字段名
        name_field = 'tool_name' if 'tool_name' in first_tool else 'name'
        
        # 获取所有需要更新的工具
        result = supabase.table('tools').select('*').is_('long_description_en', 'null').execute()
        
    except Exception as e:
        print(f"❌ Error fetching tools: {e}")
        return
    
    tools = result.data
    total = len(tools)
    
    if total == 0:
        print("✅ All tools already have SEO content!")
        return
    
    print(f"🎯 Found {total} tools needing SEO content\n")
    
    success = 0
    failed = 0
    
    for i, tool in enumerate(tools, 1):
        tool_name = tool.get(name_field, tool.get('name', 'Unknown'))
        print(f"[{i}/{total}] Processing: {tool_name}")
        
        try:
            # 生成英文内容
            print(f"  📝 Generating English content...")
            en_content = generate_seo_content(tool)
            
            if not en_content:
                failed += 1
                continue
            
            time.sleep(1)
            
            # 翻译成中文
            print(f"  🌐 Translating to Chinese...")
            zh_content = translate_seo_content(en_content)
            
            if not zh_content:
                failed += 1
                continue
            
            time.sleep(1)
            
            # 保存到数据库
            print(f"  💾 Saving to database...")
            if update_tool_in_db(tool['id'], en_content, zh_content):
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
    print(f"{'='*50}")

if __name__ == "__main__":
    print("🚀 Starting SEO content generation for AI tools...\n")
    process_all_tools()
    print("\n✨ Done!")
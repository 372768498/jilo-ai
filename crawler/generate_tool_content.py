"""
AI工具内容批量生成脚本
使用OpenAI API为工具生成SEO优化的内容
"""
import os
import sys
import time
from pathlib import Path
from openai import OpenAI
from supabase import create_client
import json

# 加载.env文件
from dotenv import load_dotenv, dotenv_values

# 方法1: 尝试加载.env
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'
load_dotenv(env_path)

# 方法2: 如果方法1失败,直接解析.env文件
if not os.getenv('OPENAI_API_KEY'):
    print("⚠️  load_dotenv failed, reading .env manually...")
    config = dotenv_values(env_path)
    os.environ.update(config)

# 读取配置
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# 调试信息
print(f"🔍 Debug Info:")
print(f"   .env path: {env_path}")
print(f"   .env exists: {env_path.exists()}")
print(f"   SUPABASE_URL: {SUPABASE_URL[:30] if SUPABASE_URL else 'NOT FOUND'}")
print(f"   SUPABASE_KEY: {'Found' if SUPABASE_KEY else 'NOT FOUND'}")
print(f"   OPENAI_API_KEY: {'Found' if OPENAI_API_KEY else 'NOT FOUND'}")
print()

# 初始化OpenAI客户端
if not OPENAI_API_KEY:
    print("❌ OPENAI_API_KEY not found!")
    print("\nPlease run in PowerShell:")
    print('$env:OPENAI_API_KEY="your_key"')
    sys.exit(1)

client = OpenAI(api_key=OPENAI_API_KEY)

# ... 其余代码保持不变 ...

def generate_tool_content(tool):
    """为单个工具生成完整内容"""
    
    prompt = f"""
You are an expert at writing SEO-optimized content for AI tools. Generate comprehensive content for this tool:

Tool Name: {tool['name_en']}
Tagline: {tool['tagline_en']}
Current Description: {tool['description_en']}
Category: {tool.get('category', 'AI Tool')}
Pricing: {tool.get('pricing_type', 'unknown')}
Official URL: {tool['official_url']}

Generate the following in JSON format:

1. long_description_en (300-500 words):
   - What the tool does in detail
   - Key capabilities
   - Who should use it
   - Use SEO keywords naturally
   - Make it engaging and informative

2. features (array of 5-8 strings):
   - Core features with specific details
   - Each 10-20 words

3. pros (array of 3-5 strings):
   - Main advantages
   - Each 5-15 words

4. cons (array of 3-5 strings):
   - Honest limitations
   - Each 5-15 words

5. use_cases (array of 3-5 strings):
   - Specific scenarios
   - Each 10-20 words

6. meta_title_en (max 60 chars):
   - SEO optimized
   - Include main keyword

7. meta_description_en (max 155 chars):
   - Compelling summary
   - Include CTA

Output ONLY valid JSON with these exact keys. No markdown, no extra text.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": prompt
            }],
            temperature=0.7,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content
        
        # 清理可能的markdown代码块标记
        content = content.strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        data = json.loads(content)
        return data
        
    except Exception as e:
        print(f"❌ Error generating content: {e}")
        return None

def translate_to_chinese(text, field_name):
    """使用OpenAI翻译成中文"""
    
    if field_name == "long_description":
        prompt = f"Translate this AI tool description to natural Chinese. Keep it professional:\n\n{text}"
    elif field_name == "features":
        prompt = f"Translate these feature descriptions to Chinese, one per line:\n\n" + "\n".join(text)
    elif field_name in ["pros", "cons", "use_cases"]:
        prompt = f"Translate these points to Chinese, one per line:\n\n" + "\n".join(text)
    elif field_name == "meta_title":
        prompt = f"Translate this SEO title to Chinese (max 60 chars):\n\n{text}"
    elif field_name == "meta_description":
        prompt = f"Translate this SEO description to Chinese (max 155 chars):\n\n{text}"
    else:
        prompt = f"Translate to Chinese:\n\n{text}"
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": prompt
            }],
            temperature=0.3,
            max_tokens=1000
        )
        
        result = response.choices[0].message.content.strip()
        
        # 如果是列表，分割成数组
        if field_name in ["features", "pros", "cons", "use_cases"]:
            return [line.strip() for line in result.split('\n') if line.strip()]
        
        return result
        
    except Exception as e:
        print(f"❌ Translation error: {e}")
        return text if isinstance(text, str) else text

def process_tool(tool, supabase):
    """处理单个工具"""
    
    tool_name = tool['name_en']
    print(f"\n{'='*60}")
    print(f"🔧 Processing: {tool_name}")
    print(f"{'='*60}")
    
    # 检查是否已有内容
    if tool.get('long_description_en'):
        print(f"⏭️  Skip: Already has content")
        return False
    
    # 生成英文内容
    print("🤖 Generating English content...")
    content = generate_tool_content(tool)
    
    if not content:
        print(f"❌ Failed to generate content")
        return False
    
    print(f"✅ Generated English content")
    
    # 翻译成中文
    print("🌐 Translating to Chinese...")
    
    update_data = {
        'long_description_en': content.get('long_description_en', ''),
        'long_description_zh': translate_to_chinese(content.get('long_description_en', ''), 'long_description'),
        'features': json.dumps(content.get('features', []), ensure_ascii=False),
        'pros': json.dumps(content.get('pros', []), ensure_ascii=False),
        'cons': json.dumps(content.get('cons', []), ensure_ascii=False),
        'use_cases': json.dumps(content.get('use_cases', []), ensure_ascii=False),
        'meta_title_en': content.get('meta_title_en', ''),
        'meta_title_zh': translate_to_chinese(content.get('meta_title_en', ''), 'meta_title'),
        'meta_description_en': content.get('meta_description_en', ''),
        'meta_description_zh': translate_to_chinese(content.get('meta_description_en', ''), 'meta_description'),
        'updated_at': 'now()'
    }
    
    # 保存到数据库
    try:
        result = supabase.table('tools').update(update_data).eq('id', tool['id']).execute()
        
        if result.data:
            print(f"✅ Saved to database")
            print(f"   - Long description: {len(content.get('long_description_en', ''))} chars")
            print(f"   - Features: {len(content.get('features', []))} items")
            print(f"   - Pros: {len(content.get('pros', []))} items")
            print(f"   - Cons: {len(content.get('cons', []))} items")
            return True
        else:
            print(f"❌ Failed to save")
            return False
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def main():
    """主函数"""
    
    print("🚀 Starting AI Tool Content Generator (OpenAI)")
    print("=" * 60)
    
    # 检查必需的环境变量
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: Missing Supabase configuration!")
        print(f"\nSUPABASE_URL: {SUPABASE_URL}")
        print(f"SUPABASE_KEY: {'Found' if SUPABASE_KEY else 'Not found'}")
        print("\n.env file path:", env_path)
        print(".env file exists:", env_path.exists())
        return
    
    if not OPENAI_API_KEY:
        print("❌ Error: Missing OPENAI_API_KEY!")
        return
    
    print(f"✅ Supabase URL: {SUPABASE_URL[:30]}...")
    print(f"✅ OpenAI API Key: Found")
    
    # 连接数据库
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return
    
    # 获取所有已发布但缺少内容的工具
    try:
        response = supabase.table('tools')\
            .select('id, slug, name_en, name_zh, tagline_en, description_en, category, pricing_type, official_url, long_description_en')\
            .eq('status', 'published')\
            .is_('long_description_en', 'null')\
            .order('created_at', desc=False)\
            .limit(5)\
            .execute()
        
        tools = response.data
    except Exception as e:
        print(f"❌ Failed to fetch tools: {e}")
        return
    
    print(f"\n📊 Found {len(tools)} tools without content (showing first 5 for testing)")
    print(f"💰 Estimated cost: ${len(tools) * 0.01:.2f} USD (OpenAI)")
    print(f"⏱️  Estimated time: {len(tools) * 10} seconds\n")
    
    if len(tools) == 0:
        print("✅ All tools already have content!")
        return
    
    input("Press Enter to start (Ctrl+C to cancel)...")
    
    success_count = 0
    failed_count = 0
    
    for i, tool in enumerate(tools, 1):
        print(f"\n[{i}/{len(tools)}]")
        
        if process_tool(tool, supabase):
            success_count += 1
        else:
            failed_count += 1
        
        # API限流：每个请求间隔1秒
        if i < len(tools):
            time.sleep(1)
    
    # 总结
    print("\n" + "=" * 60)
    print("🎉 Content Generation Complete!")
    print("=" * 60)
    print(f"✅ Success: {success_count}/{len(tools)}")
    print(f"❌ Failed: {failed_count}/{len(tools)}")
    print(f"💰 Actual cost: ~${success_count * 0.01:.2f} USD")
    
    if success_count > 0:
        remaining = 70 - success_count
        print(f"\n💡 To process all {remaining} remaining tools:")
        print(f"   1. Edit this file: Change '.limit(5)' to '.limit(100)' on line 222")
        print(f"   2. Run again: python generate_tool_content.py")
        print(f"   3. Estimated total cost: ${remaining * 0.01:.2f} USD")

if __name__ == "__main__":
    main()
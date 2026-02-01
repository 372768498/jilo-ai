/**
 * 翻译脚本：为 Supabase tools 表中缺少中文翻译的工具补上翻译
 * 
 * 使用方式：
 *   node scripts/translate-tools.js
 * 
 * 环境变量（从 .env.local 读取）：
 *   - SUPABASE_SERVICE_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - OPENAI_API_KEY（用于翻译，也可指向本地 Ollama）
 * 
 * 如果 OPENAI_API_KEY 指向 Ollama，设置：
 *   OPENAI_BASE_URL=http://localhost:11434/v1
 */

const fs = require('fs');
const path = require('path');

// 读取 .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
  return env;
}

const ENV = loadEnv();

const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = ENV.SUPABASE_SERVICE_KEY;
const OPENAI_KEY = ENV.OPENAI_API_KEY;
const OPENAI_BASE = ENV.OPENAI_BASE_URL || 'https://api.openai.com/v1';

async function fetchToolsMissingTranslation() {
  const url = `${SUPABASE_URL}/rest/v1/tools?select=id,name_en,name_zh,description_en,description_zh&or=(name_zh.is.null,description_zh.is.null,name_zh.eq.,description_zh.eq.)`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  return res.json();
}

async function translateText(text, context = '') {
  if (!text) return null;
  
  const prompt = `Translate the following AI tool ${context} from English to Chinese (Simplified). Keep it natural and professional. Only output the translation, nothing else.\n\n${text}`;
  
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_BASE.includes('localhost') ? 'qwen2.5:7b' : 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  });
  
  if (!res.ok) throw new Error(`OpenAI API failed: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

async function updateTool(id, updates) {
  const url = `${SUPABASE_URL}/rest/v1/tools?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error(`Supabase update failed: ${res.status}`);
}

async function main() {
  console.log('🦞 翻译脚本启动...');
  console.log(`📡 API: ${OPENAI_BASE}`);
  
  const tools = await fetchToolsMissingTranslation();
  console.log(`📋 找到 ${tools.length} 个工具需要翻译\n`);
  
  if (tools.length === 0) {
    console.log('✅ 所有工具已有中文翻译！');
    return;
  }
  
  let success = 0, failed = 0;
  
  for (const tool of tools) {
    console.log(`🔄 翻译: ${tool.name_en}`);
    try {
      const updates = {};
      
      if (!tool.name_zh) {
        updates.name_zh = await translateText(tool.name_en, 'name');
      }
      if (!tool.description_zh && tool.description_en) {
        updates.description_zh = await translateText(tool.description_en, 'description');
      }
      
      if (Object.keys(updates).length > 0) {
        await updateTool(tool.id, updates);
        console.log(`  ✅ ${JSON.stringify(updates)}`);
        success++;
      }
    } catch (err) {
      console.error(`  ❌ 失败: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n🏁 完成! 成功: ${success}, 失败: ${failed}`);
}

main().catch(console.error);

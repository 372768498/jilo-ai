/**
 * AI 新闻自动抓取脚本
 * 从多个来源获取最新 AI 新闻，翻译成中文，写入 Supabase
 * 
 * 用法：node scripts/fetch-ai-news.js
 * 环境变量：
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY (或读取 .env.local)
 *   OPENAI_API_KEY (用于翻译和摘要)
 * 
 * 数据源：
 *   1. TechCrunch AI RSS
 *   2. The Verge AI RSS
 *   3. VentureBeat AI RSS
 *   4. Ars Technica AI RSS
 *   5. MIT Technology Review
 */

const fs = require('fs');
const path = require('path');

// 加载 .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// RSS 源列表
const RSS_FEEDS = [
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'Ars Technica AI', url: 'https://feeds.arstechnica.com/arstechnica/index' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
];

// 简单的 XML 解析（不依赖外部库）
function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const getTag = (tag) => {
      const m = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    
    const title = getTag('title').replace(/<[^>]+>/g, '');
    const link = getTag('link').replace(/<[^>]+>/g, '');
    const description = getTag('description').replace(/<[^>]+>/g, '').slice(0, 500);
    const pubDate = getTag('pubDate') || getTag('published') || getTag('dc:date');
    
    if (title && link) {
      items.push({ title, link, description, pubDate });
    }
  }
  
  // Atom 格式 fallback
  if (items.length === 0) {
    const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[1];
      const title = (entryXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1]?.trim() || '';
      const link = (entryXml.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] || '';
      const summary = (entryXml.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i) || [])[1]?.replace(/<[^>]+>/g, '').trim().slice(0, 500) || '';
      const published = (entryXml.match(/<published>([^<]+)<\/published>/i) || [])[1] || 
                         (entryXml.match(/<updated>([^<]+)<\/updated>/i) || [])[1] || '';
      
      if (title && link) {
        items.push({ title, link, description: summary, pubDate: published });
      }
    }
  }
  
  return items;
}

// 生成 slug
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-$/, '');
}

// 用 OpenAI 翻译和生成摘要
async function translateAndSummarize(title, description) {
  if (!OPENAI_API_KEY) {
    return { title_zh: '', summary_zh: '' };
  }

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是专业的 AI 行业新闻翻译员。将英文 AI 新闻标题和摘要翻译成地道的中文。保持专业术语准确，语句流畅。返回 JSON 格式：{"title_zh": "中文标题", "summary_zh": "中文摘要（100字以内）"}'
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nDescription: ${description || 'N/A'}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    });
    
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn(`⚠️ Translation failed for: ${title.slice(0, 50)}... - ${e.message}`);
  }
  return { title_zh: '', summary_zh: '' };
}

// 检查新闻是否已存在
async function checkExisting(slug) {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/news_simple?slug=eq.${encodeURIComponent(slug)}&select=id`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await resp.json();
  return data.length > 0;
}

// 插入新闻（upsert，slug冲突时跳过）
async function insertNews(news) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/news_simple`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal,resolution=ignore-duplicates',
    },
    body: JSON.stringify(news),
  });
  return resp.ok || resp.status === 409;
}

// 过滤 AI 相关新闻
function isAIRelated(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const keywords = ['ai ', 'artificial intelligence', 'machine learning', 'deep learning',
    'llm', 'gpt', 'chatgpt', 'claude', 'openai', 'anthropic', 'google ai', 'gemini',
    'midjourney', 'stable diffusion', 'neural', 'transformer', 'deepseek', 'copilot',
    'large language model', 'generative ai', 'gen ai', 'foundation model'];
  return keywords.some(kw => text.includes(kw));
}

async function main() {
  console.log('🚀 Starting AI news fetch...\n');
  let totalNew = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const feed of RSS_FEEDS) {
    console.log(`📡 Fetching: ${feed.name}...`);
    
    try {
      const resp = await fetch(feed.url, {
        headers: { 'User-Agent': 'Jilo.ai News Bot/1.0 (+https://jilo.ai)' },
        signal: AbortSignal.timeout(15000),
      });
      
      if (!resp.ok) {
        console.warn(`  ⚠️ HTTP ${resp.status} for ${feed.name}`);
        continue;
      }
      
      const xml = await resp.text();
      const items = parseRSSItems(xml);
      console.log(`  Found ${items.length} items`);
      
      // 只取最新 5 条 AI 相关的
      const aiItems = items.filter(item => isAIRelated(item.title, item.description)).slice(0, 5);
      console.log(`  AI-related: ${aiItems.length}`);
      
      for (const item of aiItems) {
        const slug = slugify(item.title);
        if (!slug) continue;
        
        // 检查是否已存在
        const exists = await checkExisting(slug);
        if (exists) {
          totalSkipped++;
          continue;
        }
        
        // 翻译
        const { title_zh, summary_zh } = await translateAndSummarize(item.title, item.description);
        
        // 解析发布时间
        let published_at = null;
        if (item.pubDate) {
          try {
            published_at = new Date(item.pubDate).toISOString();
          } catch { }
        }
        
        // 插入
        const news = {
          slug,
          title: item.title,
          title_zh: title_zh || null,
          summary: item.description || null,
          summary_zh: summary_zh || null,
          source: feed.name,
          source_url: item.link,
          published_at,
        };
        
        const ok = await insertNews(news);
        if (ok) {
          totalNew++;
          console.log(`  ✅ ${item.title.slice(0, 60)}...`);
        } else {
          totalErrors++;
          console.log(`  ❌ Failed to insert: ${item.title.slice(0, 60)}...`);
        }
        
        // 限速：避免 OpenAI rate limit
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e) {
      console.warn(`  ❌ Error fetching ${feed.name}: ${e.message}`);
    }
  }
  
  console.log(`\n📊 Summary: ${totalNew} new, ${totalSkipped} skipped, ${totalErrors} errors`);
  return totalNew;
}

main().then(count => {
  console.log(`\n✅ Done! ${count} new articles added.`);
  process.exit(0);
}).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

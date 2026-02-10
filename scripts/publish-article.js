/**
 * 发布分析文章到 news_simple 表
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

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

async function insertArticle(article) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/news_simple`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(article),
  });
  
  if (resp.ok) {
    const data = await resp.json();
    console.log('✅ Article published successfully!');
    console.log('   ID:', data[0]?.id);
    console.log('   Slug:', data[0]?.slug);
    return true;
  } else {
    const error = await resp.text();
    console.error('❌ Failed to publish:', error);
    return false;
  }
}

async function main() {
  const article = {
    slug: 'chatgpt-ads-analysis-what-it-means-for-users-advertisers-ai-industry',
    title: 'ChatGPT Rolls Out Ads: What It Means for Users, Advertisers, and the AI Industry',
    title_zh: 'ChatGPT 开始投广告了：对用户、广告主和整个 AI 行业意味着什么？',
    summary: 'OpenAI officially rolled out advertising in ChatGPT on February 9, 2026. Free and basic tier users will now see "sponsored links" in their conversations. This comprehensive analysis covers implications for users (experience trade-offs), advertisers (a new goldmine with 200M+ weekly active users), the platform (revenue diversification like Google), and investors (valuation implications). We also examine the competitive landscape shift, including Anthropic\'s strategic Super Bowl ad positioning Claude as the "ad-free" alternative.',
    summary_zh: '2026年2月9日，OpenAI 正式在 ChatGPT 中上线广告。免费版和基础版用户将在对话中看到「赞助链接」。本文从四个视角深度分析：用户（体验权衡）、广告主（2亿周活用户的流量金矿）、平台（变现多元化）、投资人（估值影响）。同时分析竞争格局变化，包括 Anthropic 在超级碗期间将 Claude 定位为「无广告」替代品的战略。',
    source: 'Jilo.ai Analysis',
    source_url: 'https://jilo.ai/en/news/chatgpt-ads-analysis-what-it-means-for-users-advertisers-ai-industry',
    published_at: new Date().toISOString(),
  };

  console.log('📝 Publishing article to Supabase...');
  console.log('   Title:', article.title);
  
  await insertArticle(article);
}

main().catch(console.error);

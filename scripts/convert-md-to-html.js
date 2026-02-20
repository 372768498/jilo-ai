const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const MarkdownIt = require('markdown-it');

// 读取环境变量
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
);

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

async function main() {
  const articleId = 'aba846b6-c1cd-4baf-a60b-efb26fe6c5c8';
  
  // 读取 Markdown 文件
  const enMdPath = path.join(__dirname, '..', 'content', 'blog', 'chatgpt-ads-analysis-2026.md');
  const zhMdPath = path.join(__dirname, '..', 'content', 'blog', 'zh', 'chatgpt-ads-analysis-2026.md');
  
  const enMd = fs.readFileSync(enMdPath, 'utf8');
  const zhMd = fs.readFileSync(zhMdPath, 'utf8');
  
  // 转换为 HTML
  const enHtml = md.render(enMd);
  const zhHtml = md.render(zhMd);
  
  console.log('Converting Markdown to HTML...');
  console.log('EN HTML length:', enHtml.length);
  console.log('ZH HTML length:', zhHtml.length);
  
  // 更新数据库
  const { data, error } = await supabase
    .from('news')
    .update({
      content_en: enHtml,
      content_zh: zhHtml
    })
    .eq('id', articleId)
    .select('slug');
  
  if (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
  
  console.log('✅ Updated:', data[0].slug);
}

main().catch(console.error);

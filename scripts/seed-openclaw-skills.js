// 创建 openclaw_skills 表 + 抓取数据
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xlldqubzkqauvswiiwjw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbGRxdWJ6a3FhdXZzd2lpd2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE5OTc4NSwiZXhwIjoyMDc0Nzc1Nzg1fQ.7FQa5Dujxg5W3KDuMU_xeAc8Suc6HvRohN94C7pjE4c'
);

async function createTable() {
  // 用 SQL 创建表
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS openclaw_skills (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        description_zh TEXT,
        category TEXT DEFAULT 'other',
        featured BOOLEAN DEFAULT false,
        rating NUMERIC(2,1) DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        install_command TEXT,
        author TEXT,
        github_url TEXT,
        tags TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
  if (error) {
    console.log('RPC not available, trying direct insert to create table implicitly...');
    return false;
  }
  return true;
}

async function seedData() {
  const skills = [
    {
      name: "agent-deep-research",
      slug: "agent-deep-research",
      description: "Autonomous deep research agent that searches the web, analyzes sources, and produces comprehensive research reports on any topic.",
      description_zh: "自主深度研究 Agent，自动搜索网络、分析来源、生成全面的研究报告。给个主题就能出报告。",
      category: "research",
      featured: true,
      rating: 4.8,
      downloads: 12500,
      install_command: "clawhub install agent-deep-research",
      author: "openclaw",
      tags: ["research", "web-search", "report"]
    },
    {
      name: "seo",
      slug: "seo",
      description: "Complete SEO audit and optimization toolkit. Analyzes pages for technical SEO, content quality, and provides actionable recommendations.",
      description_zh: "完整的 SEO 审计和优化工具包。分析页面技术 SEO、内容质量，提供可执行的优化建议。",
      category: "marketing",
      featured: true,
      rating: 4.7,
      downloads: 18200,
      install_command: "clawhub install seo",
      author: "openclaw",
      tags: ["seo", "marketing", "audit"]
    },
    {
      name: "douyin-hot-trend",
      slug: "douyin-hot-trend",
      description: "Real-time Douyin (TikTok China) trending topics tracker. Fetches hot searches, trending videos, and viral content for content inspiration.",
      description_zh: "实时抖音热榜追踪器。抓取热搜、热门视频和爆款内容，为内容创作提供灵感。",
      category: "trends",
      featured: true,
      rating: 4.6,
      downloads: 8900,
      install_command: "clawhub install douyin-hot-trend",
      author: "community",
      tags: ["douyin", "trends", "china"]
    },
    {
      name: "trend-watcher",
      slug: "trend-watcher",
      description: "Multi-platform trend monitoring across Google Trends, Twitter/X, Reddit, and Hacker News. Identifies emerging topics before they go viral.",
      description_zh: "多平台趋势监控，覆盖 Google Trends、Twitter/X、Reddit 和 Hacker News。在话题爆发前发现它们。",
      category: "trends",
      featured: true,
      rating: 4.5,
      downloads: 15600,
      install_command: "clawhub install trend-watcher",
      author: "openclaw",
      tags: ["trends", "monitoring", "multi-platform"]
    },
    {
      name: "affiliate-master",
      slug: "affiliate-master",
      description: "Affiliate marketing optimization agent. Finds high-converting programs, generates comparison content, and tracks commission opportunities.",
      description_zh: "联盟营销优化 Agent。寻找高转化项目、生成对比内容、追踪佣金机会。",
      category: "marketing",
      featured: true,
      rating: 4.4,
      downloads: 9800,
      install_command: "clawhub install affiliate-master",
      author: "community",
      tags: ["affiliate", "marketing", "monetization"]
    },
    {
      name: "mia-content-creator",
      slug: "mia-content-creator",
      description: "AI content creation pipeline. Generates blog posts, social media content, newsletters, and marketing copy with brand voice consistency.",
      description_zh: "AI 内容创作流水线。生成博客文章、社媒内容、Newsletter 和营销文案，保持品牌调性一致。",
      category: "content",
      featured: false,
      rating: 4.3,
      downloads: 22100,
      install_command: "clawhub install mia-content-creator",
      author: "community",
      tags: ["content", "writing", "social-media"]
    },
    {
      name: "ai-video-gen",
      slug: "ai-video-gen",
      description: "Automated video generation from text prompts. Creates short-form videos for TikTok, YouTube Shorts, and Instagram Reels.",
      description_zh: "文字自动生成视频。创建适用于抖音、YouTube Shorts 和 Instagram Reels 的短视频。",
      category: "content",
      featured: false,
      rating: 4.2,
      downloads: 31500,
      install_command: "clawhub install ai-video-gen",
      author: "community",
      tags: ["video", "content", "short-form"]
    },
    {
      name: "keywords-everywhere",
      slug: "keywords-everywhere",
      description: "Keyword research and analysis tool. Provides search volume, CPC, competition data for SEO and content planning.",
      description_zh: "关键词研究和分析工具。提供搜索量、CPC、竞争度数据，用于 SEO 和内容规划。",
      category: "marketing",
      featured: false,
      rating: 4.5,
      downloads: 14300,
      install_command: "clawhub install keywords-everywhere",
      author: "community",
      tags: ["keywords", "seo", "research"]
    },
    {
      name: "autonomous-brain",
      slug: "autonomous-brain",
      description: "Self-managing task orchestration system. Plans, prioritizes, and executes complex multi-step workflows autonomously.",
      description_zh: "自主任务编排系统。自动规划、排序和执行复杂的多步骤工作流。",
      category: "automation",
      featured: false,
      rating: 4.1,
      downloads: 7600,
      install_command: "clawhub install autonomous-brain",
      author: "openclaw",
      tags: ["automation", "orchestration", "planning"]
    },
    {
      name: "tube-summary",
      slug: "tube-summary",
      description: "YouTube video summarizer. Extracts transcripts, generates concise summaries, key takeaways, and timestamps for any YouTube video.",
      description_zh: "YouTube 视频摘要工具。提取字幕、生成简洁摘要、关键要点和时间戳。",
      category: "content",
      featured: false,
      rating: 4.4,
      downloads: 19800,
      install_command: "clawhub install tube-summary",
      author: "community",
      tags: ["youtube", "summary", "transcript"]
    },
    {
      name: "google-news-api",
      slug: "google-news-api",
      description: "Google News aggregator and analyzer. Fetches latest news by topic, region, or keyword with sentiment analysis.",
      description_zh: "Google 新闻聚合和分析器。按主题、地区或关键词抓取最新新闻，附带情感分析。",
      category: "trends",
      featured: false,
      rating: 4.3,
      downloads: 11200,
      install_command: "clawhub install google-news-api",
      author: "community",
      tags: ["news", "google", "analysis"]
    },
    {
      name: "dashboard",
      slug: "dashboard",
      description: "Real-time agent monitoring dashboard. Tracks task completion, resource usage, costs, and performance metrics across all agents.",
      description_zh: "实时 Agent 监控仪表盘。追踪任务完成率、资源使用、成本和所有 Agent 的性能指标。",
      category: "automation",
      featured: false,
      rating: 4.0,
      downloads: 5400,
      install_command: "clawhub install dashboard",
      author: "openclaw",
      tags: ["monitoring", "dashboard", "metrics"]
    }
  ];

  console.log(`Inserting ${skills.length} skills...`);
  const { data, error } = await supabase
    .from('openclaw_skills')
    .upsert(skills, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('Insert error:', error.message);
    return;
  }
  console.log(`✅ Inserted ${data.length} skills`);
}

(async () => {
  await createTable();
  await seedData();
})();

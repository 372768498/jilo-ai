import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://jilo.ai'
  const locales = ['en', 'zh']

  // 静态页面
  const staticRoutes: MetadataRoute.Sitemap = []
  
  for (const locale of locales) {
    staticRoutes.push(
      {
        url: `${baseUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/${locale}/tools`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/${locale}/news`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.8,
      }
    )
  }

  // 动态工具页面
  const { data: tools } = await supabase
    .from('tools')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  const toolRoutes: MetadataRoute.Sitemap = []
  if (tools) {
    for (const tool of tools) {
      for (const locale of locales) {
        toolRoutes.push({
          url: `${baseUrl}/${locale}/tools/${tool.slug}`,
          lastModified: tool.updated_at ? new Date(tool.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }
  }

  // 动态新闻页面
  const { data: news } = await supabase
    .from('news_simple')
    .select('slug, published_at')
    .order('published_at', { ascending: false })
    .limit(200)

  const newsRoutes: MetadataRoute.Sitemap = []
  if (news) {
    for (const article of news) {
      for (const locale of locales) {
        newsRoutes.push({
          url: `${baseUrl}/${locale}/news/${article.slug}`,
          lastModified: article.published_at ? new Date(article.published_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }
    }
  }

  // 评测文章（高优先级 — SEO核心内容）
  const reviewSlugs = ['chatgpt-vs-claude', 'midjourney-vs-dalle', 'best-ai-coding-tools', 'best-chinese-ai-models', 'best-ai-writing-tools', 'best-ai-image-generators', 'ai-tools-for-students', 'best-ai-video-generators', 'best-free-ai-tools', 'ai-for-business', 'how-to-use-chatgpt-effectively', 'how-to-use-midjourney', 'prompt-engineering-guide', 'openclaw-review-and-setup-guide', 'best-ai-agents', 'chatgpt-vs-deepseek', 'how-to-make-money-with-ai', 'sora-vs-kling-vs-runway', 'kimi-k2-5-review', 'best-ai-language-learning', 'perplexity-vs-google-vs-chatgpt-search', 'best-ai-presentation-tools', 'cursor-vs-github-copilot-vs-windsurf', 'claude-vs-gemini', 'best-ai-music-generators', 'notebooklm-review-and-alternatives', 'best-ai-design-tools', 'best-ai-translation-tools', 'best-ai-customer-service-tools', 'ai-replacing-jobs-2025', 'best-ai-email-tools', 'midjourney-v7-review', 'best-ai-video-editing-tools', 'chatgpt-plugins-and-gpts-guide']
  const reviewRoutes: MetadataRoute.Sitemap = []
  for (const slug of reviewSlugs) {
    for (const locale of locales) {
      reviewRoutes.push({
        url: `${baseUrl}/${locale}/reviews/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      })
    }
  }
  // 评测列表页
  for (const locale of locales) {
    reviewRoutes.push({
      url: `${baseUrl}/${locale}/reviews`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    })
  }

  // 对比页（高优先级 — 程序化SEO核心）
  const compareSlugs = ['chatgpt-vs-claude', 'chatgpt-vs-gemini', 'claude-vs-gemini', 'midjourney-vs-dall-e', 'chatgpt-vs-perplexity', 'github-copilot-vs-chatgpt', 'jasper-vs-chatgpt', 'notion-ai-vs-chatgpt', 'grammarly-vs-chatgpt', 'stable-diffusion-vs-midjourney', 'cursor-vs-github-copilot', 'deepseek-vs-chatgpt', 'runway-vs-pika', 'elevenlabs-vs-murf', 'canva-vs-figma', 'deepl-vs-google-translate', 'midjourney-vs-leonardo', 'notion-ai-vs-obsidian', 'claude-vs-deepseek', 'chatgpt-vs-copilot', 'sora-vs-runway', 'perplexity-vs-google', 'gemini-vs-chatgpt', 'claude-code-vs-cursor', 'v0-vs-bolt', 'midjourney-vs-ideogram', 'descript-vs-capcut', 'zapier-vs-make', 'claude-vs-chatgpt', 'perplexity-vs-chatgpt', 'jasper-vs-copy-ai', 'semrush-vs-surfer-seo', 'synthesia-vs-heygen', 'grammarly-vs-writesonic', 'fireflies-vs-otter', 'notion-vs-clickup', 'canva-vs-leonardo-ai', 'pictory-vs-synthesia', 'surfer-seo-vs-frase', 'copy-ai-vs-writesonic']
  const compareRoutes: MetadataRoute.Sitemap = []
  for (const locale of locales) {
    compareRoutes.push({
      url: `${baseUrl}/${locale}/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    })
  }
  for (const slug of compareSlugs) {
    for (const locale of locales) {
      compareRoutes.push({
        url: `${baseUrl}/${locale}/compare/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      })
    }
  }

  // 替代方案页（高优先级 — 程序化SEO核心）
  const altSlugs = ['chatgpt-alternatives', 'midjourney-alternatives', 'grammarly-alternatives', 'notion-alternatives', 'jasper-alternatives', 'github-copilot-alternatives', 'canva-alternatives', 'perplexity-alternatives', 'elevenlabs-alternatives', 'runway-alternatives', 'cursor-alternatives', 'deepseek-alternatives', 'dall-e-alternatives', 'synthesia-alternatives', 'deepl-alternatives', 'figma-alternatives', 'sora-alternatives', 'claude-alternatives', 'gemini-alternatives', 'v0-alternatives', 'bolt-alternatives', 'zapier-alternatives', 'adobe-firefly-alternatives', 'whisper-alternatives', 'gamma-alternatives', 'claude-code-alternatives', 'copy-ai-alternatives', 'descript-alternatives', 'otter-ai-alternatives', 'writesonic-alternatives']
  const altRoutes: MetadataRoute.Sitemap = []
  for (const locale of locales) {
    altRoutes.push({
      url: `${baseUrl}/${locale}/alternatives`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    })
  }
  for (const slug of altSlugs) {
    for (const locale of locales) {
      altRoutes.push({
        url: `${baseUrl}/${locale}/alternatives/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      })
    }
  }

  // 最佳工具页（高优先级 — 程序化SEO核心）
  const bestSlugs = ['best-ai-writing-tools', 'best-ai-coding-tools', 'best-ai-design-tools', 'best-ai-video-tools', 'best-ai-tools-for-business', 'best-ai-data-analysis-tools', 'best-ai-voice-tools', 'best-ai-translation-tools', 'best-ai-tools-for-education', 'best-free-ai-tools', 'best-ai-chatbots', 'best-ai-image-generators', 'best-ai-marketing-tools', 'best-ai-productivity-tools', 'best-ai-search-engines', 'best-ai-presentation-tools', 'best-ai-music-generators', 'best-ai-meeting-assistants', 'best-ai-tools-for-startups', 'best-ai-tools-for-developers', 'best-ai-tools-for-content-creators', 'best-ai-tools-for-ecommerce', 'best-ai-tools-for-students', 'best-ai-tools-for-healthcare', 'best-ai-tools-for-real-estate', 'best-ai-tools-for-finance', 'best-ai-tools-for-hr', 'best-ai-tools-for-customer-service', 'best-ai-tools-for-social-media', 'best-ai-tools-for-research']
  const bestRoutes: MetadataRoute.Sitemap = []
  for (const locale of locales) {
    bestRoutes.push({
      url: `${baseUrl}/${locale}/best`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    })
  }
  for (const slug of bestSlugs) {
    for (const locale of locales) {
      bestRoutes.push({
        url: `${baseUrl}/${locale}/best/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      })
    }
  }

  // FAQ/指南页
  const faqSlugs = ['what-is-chatgpt', 'how-to-use-midjourney', 'is-ai-safe', 'what-is-prompt-engineering', 'how-to-choose-ai-tool', 'ai-tools-free-vs-paid', 'what-is-rag', 'how-ai-agents-work', 'best-ai-for-beginners', 'ai-tools-privacy-guide', 'top-questions']
  const faqRoutes: MetadataRoute.Sitemap = []
  for (const slug of faqSlugs) {
    for (const locale of locales) {
      faqRoutes.push({
        url: `${baseUrl}/${locale}/faqs/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  // 其他页面
  const otherRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/weekly`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  return [...staticRoutes, ...toolRoutes, ...newsRoutes, ...reviewRoutes, ...compareRoutes, ...altRoutes, ...bestRoutes, ...faqRoutes, ...otherRoutes]
}

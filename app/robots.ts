import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/*',        // 禁止访问管理后台
          '/api/*',          // 禁止访问API路径
          '/*?*sort=*',      // 避免重复的排序参数页面
          '/*?*filter=*',    // 避免重复的筛选参数页面
        ],
      },
      {
        userAgent: 'GPTBot',  // OpenAI爬虫
        allow: '/',           // 允许AI训练(可选)
      },
      {
        userAgent: 'ChatGPT-User', // ChatGPT浏览
        allow: '/',
      },
      {
        userAgent: 'Google-Extended', // Google Bard
        allow: '/',
      },
      {
        userAgent: 'anthropic-ai',  // Claude
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',  // Perplexity
        allow: '/',
      },
    ],
    sitemap: [
      'https://www.jilo.ai/sitemap.xml',
      'https://www.jilo.ai/zh/sitemap.xml',
    ],
  }
}
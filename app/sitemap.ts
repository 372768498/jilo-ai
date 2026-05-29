import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.jilo.ai'

  // ── Static routes ──────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/en`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/zh`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/en/tools`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/zh/tools`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/en/tools/ai-subscription-cost-calculator`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/zh/tools/ai-subscription-cost-calculator`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/en/access`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/zh/access`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/en/workflows`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/zh/workflows`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/en/radar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${baseUrl}/zh/radar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${baseUrl}/en/deals`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/zh/deals`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/en/reviews`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/zh/reviews`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/en/answers/can-i-use-claude-in-china`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/zh/answers/can-i-use-claude-in-china`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/en/answers/chatgpt-vs-claude-vs-gemini-for-beginners`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/zh/answers/chatgpt-vs-claude-vs-gemini-for-beginners`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/en/best/best-ai-video-generators`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${baseUrl}/zh/best/best-free-ai-tools`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${baseUrl}/en/news`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/zh/news`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/en/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/zh/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/en/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/zh/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ]

  // ── Dynamic: Category hubs ─────────────────────────────────────
  const categoryRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: categories } = await supabase
      .from('categories')
      .select('slug')
      .order('display_order', { ascending: true })
    for (const cat of categories || []) {
      categoryRoutes.push(
        { url: `${baseUrl}/en/c/${cat.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${baseUrl}/zh/c/${cat.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
      )
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch categories', e)
  }

  // ── Dynamic: Tool pages ────────────────────────────────────────
  const toolRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: tools } = await supabase
      .from('tools')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    for (const tool of tools || []) {
      const lastMod = tool.updated_at ? new Date(tool.updated_at) : new Date()
      toolRoutes.push(
        { url: `${baseUrl}/en/tools/${tool.slug}`, lastModified: lastMod, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/zh/tools/${tool.slug}`, lastModified: lastMod, changeFrequency: 'weekly', priority: 0.8 },
      )
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch tools', e)
  }

  // ── Dynamic: News / SEO articles ───────────────────────────────
  const newsRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: articles } = await supabase
      .from('news')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500)

    for (const article of articles || []) {
      const lastMod = article.updated_at
        ? new Date(article.updated_at)
        : article.published_at
          ? new Date(article.published_at)
          : new Date()
      newsRoutes.push(
        { url: `${baseUrl}/en/news/${article.slug}`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/zh/news/${article.slug}`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
      )
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch news', e)
  }

  // ── Dynamic: Compare articles ──────────────────────────────────
  const compareRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: compares } = await supabase
      .from('compare_articles')
      .select('slug, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500)

    for (const article of compares || []) {
      const lastMod = article.published_at
        ? new Date(article.published_at)
        : article.created_at
          ? new Date(article.created_at)
          : new Date()
      // compare_articles with -zh suffix are Chinese versions; base slug is English
      if (!article.slug.endsWith('-zh')) {
        compareRoutes.push(
          { url: `${baseUrl}/en/compare/${article.slug}`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
          { url: `${baseUrl}/zh/compare/${article.slug}`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
        )
      }
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch compare articles', e)
  }

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes, ...newsRoutes, ...compareRoutes]
}

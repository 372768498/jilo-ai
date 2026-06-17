import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { PROMPT_TEMPLATES } from '@/lib/prompt-templates'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.jilo.ai'

  // ── Static routes ──────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/en`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/zh`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/llms.txt`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
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
    { url: `${baseUrl}/en/best/best-ai-video-editors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/en/best/best-ai-video-editing-tools`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/zh/best/best-free-ai-tools`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${baseUrl}/en/news`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/zh/news`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/en/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/zh/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/en/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/zh/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/en/prompts`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/zh/prompts`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/en/rankings`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/zh/rankings`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...['most-popular', 'top-rated', 'newest', 'best-free'].flatMap((type) => [
      { url: `${baseUrl}/en/rankings/${type}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.85 },
      { url: `${baseUrl}/zh/rankings/${type}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.85 },
    ]),
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
  // A real zh translation = zh title AND content both present, non-empty, and
  // not just an English fallback copy. Only then do we emit the /zh URL — this
  // matches the per-page hreflang/canonical logic and avoids listing English
  // pages under /zh in the sitemap.
  const newsRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: articles } = await supabase
      .from('news')
      .select('slug, published_at, updated_at, title_en, title_zh, content_en, content_zh')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500)

    for (const article of articles || []) {
      const lastMod = article.updated_at
        ? new Date(article.updated_at)
        : article.published_at
          ? new Date(article.published_at)
          : new Date()
      const titleZh = (article.title_zh || '').trim()
      const contentZh = (article.content_zh || '').trim()
      const titleEn = (article.title_en || '').trim()
      const contentEn = (article.content_en || '').trim()
      const realZh =
        Boolean(titleZh && contentZh) &&
        titleZh !== titleEn &&
        contentZh !== contentEn
      newsRoutes.push(
        { url: `${baseUrl}/en/news/${article.slug}`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
      )
      if (realZh) {
        newsRoutes.push(
          { url: `${baseUrl}/zh/news/${article.slug}`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
        )
      }
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

    // compare_articles with a -zh suffix ARE the Chinese versions; base slug is
    // English. A real zh translation exists for a base slug only when its
    // "{slug}-zh" published sibling exists — only then do we emit the /zh URL.
    const compareSlugs = new Set((compares || []).map((a) => a.slug))
    for (const article of compares || []) {
      const lastMod = article.published_at
        ? new Date(article.published_at)
        : article.created_at
          ? new Date(article.created_at)
          : new Date()
      if (!article.slug.endsWith('-zh')) {
        compareRoutes.push(
          { url: `${baseUrl}/en/compare/${article.slug}`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
        )
        if (compareSlugs.has(`${article.slug}-zh`)) {
          compareRoutes.push(
            { url: `${baseUrl}/zh/compare/${article.slug}`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.7 },
          )
        }
      }
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch compare articles', e)
  }

  // ── Static: Prompt template pages (curated, from data/prompt-templates.json) ──
  const promptRoutes: MetadataRoute.Sitemap = PROMPT_TEMPLATES.flatMap((t) => [
    { url: `${baseUrl}/en/prompts/${t.slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/zh/prompts/${t.slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.75 },
  ])

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes, ...newsRoutes, ...compareRoutes, ...promptRoutes]
}

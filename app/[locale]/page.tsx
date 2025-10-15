import { createClient } from '@/lib/supabase/server'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import Navbar from '@/components/navbar'
import SearchBar from '@/components/search-bar'
import ToolCategories from '@/components/tool-categories'
import { FeaturedCarousel } from '@/components/featured-carousel'
import HotToolsSection from '@/components/HotToolsSection'

export default async function HomePage({ params }: { params: { locale: string } }) {
  const supabase = await createClient()
  const isZh = params.locale === 'zh'

  // 精选工具（推荐、用于轮播）
  const { data: featuredToolsRaw } = await supabase
    .from('tools')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(8)

  const featuredTools = (featuredToolsRaw || []).map(tool => ({
    id: tool.id,
    name_en: tool.name_en,
    name_zh: tool.name_zh,
    description_en: tool.description_en,
    description_zh: tool.description_zh,
    image_url: tool.logo_url || tool.image_url || '',
    link: `/${params.locale}/tools/${tool.slug}`,
  }))

  // 首页“热门工具”区块
  const { data: hotTools } = await supabase
    .from('tools')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(24)

  // 首页“最新资讯”区块
  const { data: latestNews } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(4)

  return (
    <>
      <Navbar locale={params.locale} />
      <div className="min-h-screen bg-background">
        {/* Hero 区块 */}
        <section className="bg-gradient-to-b from-blue-50 to-background py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {isZh ? '发现最佳的AI工具' : 'Discover the Best AI Tools'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {isZh
                ? '精选最新、最实用的AI工具，帮助您提升工作效率'
                : 'Curated collection of the latest and most useful AI tools to boost your productivity'}
            </p>
            <div className="mb-8">
              <SearchBar locale={params.locale} />
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href={`/${params.locale}/tools`}>
                <Button size="lg">
                  {isZh ? '浏览所有工具' : 'Browse All Tools'}
                </Button>
              </Link>
              <Link href={`/${params.locale}/news`}>
                <Button size="lg" variant="outline">
                  {isZh ? 'AI资讯' : 'AI News'}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 精选推荐轮播图 */}
        <FeaturedCarousel locale={params.locale} tools={featuredTools} />

        <div className="container mx-auto px-4 py-16">
          {/* AI 工具分类卡片 */}
          <ToolCategories
            locale={params.locale}
            title={isZh ? '按类别划分的免费 AI 工具' : 'Browse AI Tools by Category'}
            showAll={false}
          />

          {/* 热门工具区块（含分类标签联动/骨架屏/卡片动效） */}
          <HotToolsSection hotTools={hotTools ?? []} locale={params.locale} />

          {/* 最新资讯 */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {isZh ? '最新资讯' : 'Latest News'}
                </h2>
                <p className="text-muted-foreground">
                  {isZh ? 'AI行业最新动态' : 'Latest updates from the AI industry'}
                </p>
              </div>
              <Link href={`/${params.locale}/news`}>
                <Button variant="ghost">
                  {isZh ? '查看全部' : 'View All'}
                </Button>
              </Link>
            </div>

            {latestNews && latestNews.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {latestNews.map((news) => {
                  const title = isZh ? news.title_zh : news.title_en
                  const summary = isZh ? news.summary_zh : news.summary_en

                  return (
                    <Link key={news.id} href={`/${params.locale}/news/${news.slug}`}>
                      <div className="hover:shadow-lg transition-shadow h-full bg-white border rounded-xl">
                        <div className="p-6 pb-2">
                          {news.source && (
                            <Badge variant="secondary" className="w-fit mb-2">
                              {news.source}
                            </Badge>
                          )}
                          <div className="text-xl font-bold mb-1 line-clamp-2">{title}</div>
                        </div>
                        <div className="p-6 pt-2">
                          {summary && (
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                              {summary}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {news.published_at ? new Date(news.published_at).toLocaleDateString(params.locale, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : (isZh ? '未知日期' : 'Unknown date')}
                            </span>
                            {news.views && (
                              <>
                                <span>•</span>
                                <span>{news.views} {isZh ? '浏览' : 'views'}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {isZh ? '暂无新闻' : 'No news available'}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

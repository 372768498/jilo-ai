import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, TrendingUp, Zap, Star } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage({ params }: { params: { locale: string } }) {
  const supabase = await createClient()
  const isZh = params.locale === 'zh'
  
  // 获取特色工具 (前8个)
  const { data: featuredTools } = await supabase
    .from('tools')
    .select('*')
    .eq('status', 'published')
    .order('clicks', { ascending: false })
    .limit(8)

  // 获取最新新闻 (前4个)
  const { data: latestNews } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(4)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {isZh ? '发现最好的AI工具' : 'Discover the Best AI Tools'}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {isZh 
              ? '精选最新、最实用的AI工具,帮助您提升工作效率' 
              : 'Curated collection of the latest and most useful AI tools to boost your productivity'}
          </p>
          <div className="flex gap-4 justify-center">
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

      <div className="container mx-auto px-4 py-16">
        {/* 特色工具 */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {isZh ? '热门工具' : 'Featured Tools'}
              </h2>
              <p className="text-muted-foreground">
                {isZh ? '最受欢迎的AI工具' : 'Most popular AI tools'}
              </p>
            </div>
            <Link href={`/${params.locale}/tools`}>
              <Button variant="ghost">
                {isZh ? '查看全部' : 'View All'}
              </Button>
            </Link>
          </div>

          {featuredTools && featuredTools.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredTools.map((tool) => {
                const name = isZh ? tool.name_zh : tool.name_en
                const tagline = isZh ? tool.tagline_zh : tool.tagline_en

                return (
                  <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        {tool.logo_url && (
                          <img 
                            src={tool.logo_url} 
                            alt={name || ''} 
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {name || tool.name_en}
                          </CardTitle>
                        </div>
                      </div>
                      {tagline && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tagline}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Link href={`/${params.locale}/tools/${tool.slug}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          {isZh ? '了解更多' : 'Learn More'}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {isZh ? '暂无工具' : 'No tools available'}
            </div>
          )}
        </section>

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
                    <Card className="hover:shadow-lg transition-shadow h-full">
                      <CardHeader>
                        {news.category && (
                          <Badge variant="secondary" className="w-fit mb-2">
                            {news.category}
                          </Badge>
                        )}
                        <CardTitle className="text-xl line-clamp-2">
                          {title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {summary && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {summary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(news.published_at).toLocaleDateString(params.locale, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          {news.views && (
                            <>
                              <span>•</span>
                              <span>{news.views} {isZh ? '浏览' : 'views'}</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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
  )
}
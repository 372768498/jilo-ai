import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import Navbar from '@/components/navbar'
import ToolCategories from '@/components/tool-categories'

export default async function ToolsPage({
  params,
  searchParams
}: {
  params: { locale: string }
  searchParams: { category?: string }
}) {
  const supabase = await createClient()
  const isZh = params.locale === 'zh'
  const selectedCategory = searchParams.category

  // 构建查询
  let query = supabase
    .from('tools')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  // 如果有类别筛选
  if (selectedCategory) {
    query = query.eq('category', selectedCategory)
  }

  const { data: tools } = await query

  return (
    <>
      <Navbar locale={params.locale} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isZh ? 'AI 工具导航' : 'AI Tools Directory'}
          </h1>
          <p className="text-muted-foreground">
            {isZh ? '发现最新最好用的AI工具' : 'Discover the best AI tools'}
          </p>
        </div>

        {/* 类别展示 */}
        {!selectedCategory && (
          <ToolCategories 
            locale={params.locale}
            showAll={true}
          />
        )}

        {/* 当前筛选的类别 */}
        {selectedCategory && (
          <div className="mb-8 flex items-center gap-4">
            <Badge variant="default" className="text-base px-4 py-2">
              {selectedCategory}
            </Badge>
            <Link href={`/${params.locale}/tools`}>
              <Button variant="outline" size="sm">
                {isZh ? '查看全部' : 'View All'}
              </Button>
            </Link>
          </div>
        )}

        {/* 工具列表 */}
        {tools && tools.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold mb-6 mt-12">
              {selectedCategory 
                ? `${selectedCategory} ${isZh ? '工具' : 'Tools'}` 
                : (isZh ? '所有工具' : 'All Tools')}
              <span className="text-muted-foreground text-lg ml-2">
                ({tools.length})
              </span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tools.map((tool) => {
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
                          <CardTitle className="text-base">
                            {name || tool.name_en}
                          </CardTitle>
                        </div>
                      </div>
                      {tool.pricing_type && (
                        <Badge variant="secondary" className="w-fit text-xs">
                          {tool.pricing_type}
                        </Badge>
                      )}
                      {tagline && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {tagline}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Link href={`/${params.locale}/tools/${tool.slug}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          {isZh ? '查看详情' : 'View Details'}
                        </Button>
                      </Link>
                      {tool.official_url && (
                        <a 
                          href={tool.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            // 可以在这里添加点击统计
                          }}
                        >
                          <Button className="w-full" size="sm">
                            {isZh ? '立即使用' : 'Try Now'} →
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {isZh ? '暂无工具' : 'No tools available'}
          </div>
        )}
      </div>
    </>
  )
}
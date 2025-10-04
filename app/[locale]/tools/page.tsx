import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ToolsPageProps {
  params: {
    locale: string
  }
  searchParams: {
    category?: string
  }
}

export default async function ToolsPage({ params, searchParams }: ToolsPageProps) {
  const supabase = await createClient()
  const isZh = params.locale === 'zh'
  
  let query = supabase
    .from('tools')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (searchParams.category) {
    query = query.contains('categories', [searchParams.category])
  }

  const { data: tools, error } = await query

  if (error) {
    console.error('Error fetching tools:', error)
  }

  const { data: categoriesData } = await supabase
    .from('tools')
    .select('categories')
    .eq('status', 'published')

  const allCategories = new Set<string>()
  categoriesData?.forEach(tool => {
    if (tool.categories) {
      tool.categories.forEach((cat: string) => allCategories.add(cat))
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isZh ? 'AI 工具导航' : 'AI Tools Directory'}
          </h1>
          <p className="text-muted-foreground">
            {isZh ? '发现最新最好用的AI工具' : 'Discover the best AI tools'}
          </p>
        </div>

        {allCategories.size > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Link href={`/${params.locale}/tools`}>
              <Badge variant={!searchParams.category ? "default" : "outline"} className="cursor-pointer">
                {isZh ? '全部' : 'All'}
              </Badge>
            </Link>
            {Array.from(allCategories).map(category => (
              <Link key={category} href={`/${params.locale}/tools?category=${category}`}>
                <Badge variant={searchParams.category === category ? "default" : "outline"} className="cursor-pointer">
                  {category}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {!tools || tools.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isZh ? '暂无工具' : 'No tools available'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => {
              const name = isZh ? tool.name_zh : tool.name_en
              const tagline = isZh ? tool.tagline_zh : tool.tagline_en
              const description = isZh ? tool.description_zh : tool.description_en

              return (
                <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {tool.logo_url && (
                          <img src={tool.logo_url} alt={name || ''} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <CardTitle className="text-xl">{name || tool.name_en}</CardTitle>
                          {tool.pricing_type && (
                            <Badge variant="secondary" className="mt-1">{tool.pricing_type}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {tagline && <p className="text-sm font-medium text-muted-foreground">{tagline}</p>}
                  </CardHeader>
                  <CardContent>
                    {description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{description}</p>
                    )}
                    {tool.categories && tool.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {tool.categories.slice(0, 3).map((cat: string) => (
                          <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/${params.locale}/tools/${tool.slug}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          {isZh ? '查看详情' : 'View Details'}
                        </Button>
                      </Link>
                      <a
                        href={tool.affiliate_url || tool.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button className="w-full">
                          {isZh ? '立即使用' : 'Try Now'}
                          <ExternalLink className="w-4 h-4 ml-1" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {tools && tools.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            {isZh ? `共找到 ${tools.length} 个AI工具` : `Found ${tools.length} AI tools`}
          </div>
        )}
      </div>
    </div>
  )
}
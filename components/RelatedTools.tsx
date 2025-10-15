/**
 * 相关工具推荐组件
 * 在工具详情页底部显示，增加内链
 */

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

interface RelatedTool {
  slug: string
  name_en?: string
  name_zh?: string
  tagline_en?: string
  tagline_zh?: string
  logo_url?: string
  category?: string
  pricing_type?: string
}

interface RelatedToolsProps {
  tools: RelatedTool[]
  locale: string
  currentToolSlug: string
}

export default function RelatedTools({ tools, locale, currentToolSlug }: RelatedToolsProps) {
  const isZh = locale.startsWith('zh')
  
  // 过滤掉当前工具
  const filteredTools = tools.filter(t => t.slug !== currentToolSlug).slice(0, 6)
  
  if (filteredTools.length === 0) return null
  
  const title = isZh ? '相似工具' : 'Similar Tools'
  const viewAll = isZh ? '查看全部' : 'View All'
  
  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <Link 
          href={`/${locale}/tools`}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          {viewAll} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => {
          const name = isZh ? (tool.name_zh || tool.name_en) : (tool.name_en || tool.name_zh)
          const tagline = isZh ? (tool.tagline_zh || tool.tagline_en) : (tool.tagline_en || tool.tagline_zh)
          
          return (
            <Link key={tool.slug} href={`/${locale}/tools/${tool.slug}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {tool.logo_url && (
                      <img 
                        src={tool.logo_url} 
                        alt={name || ''} 
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-1">{name}</CardTitle>
                      {tool.category && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {tool.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tagline}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/**
 * 在工具详情页使用:
 * 
 * // 获取相关工具的逻辑
 * const { data: relatedTools } = await supabase
 *   .from('tools')
 *   .select('slug, name_en, name_zh, tagline_en, tagline_zh, logo_url, category, pricing_type')
 *   .eq('category', currentTool.category)
 *   .neq('slug', currentTool.slug)
 *   .eq('status', 'published')
 *   .limit(6)
 * 
 * // 渲染组件
 * <RelatedTools 
 *   tools={relatedTools || []}
 *   locale={locale}
 *   currentToolSlug={tool.slug}
 * />
 */
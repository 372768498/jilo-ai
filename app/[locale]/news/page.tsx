import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/navbar'

export default async function NewsPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const supabase = await createClient()
  const isZh = locale === 'zh'
  
  // 🔧 修复: 移除语言筛选，因为所有新闻都同时包含中英文内容
  const { data: news, error } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    // .eq('language', locale) // ❌ 删除这一行
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching news:', error)
  }

  // 🔧 修复: 处理空数据情况
  const filteredNews = news?.filter(item => item.published_at) || []

  return (
    <>
      <Navbar locale={locale} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isZh ? 'AI 新闻资讯' : 'AI News'}
          </h1>
          <p className="text-muted-foreground">
            {isZh 
              ? '最新的 AI 行业动态、工具发布和深度分析'
              : 'Latest AI industry news, tool launches and in-depth analysis'
            }
          </p>
        </div>

        {filteredNews && filteredNews.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => {
              // 🔧 根据当前语言显示对应字段
              const title = isZh ? item.title_zh : item.title_en
              const summary = isZh ? item.summary_zh : item.summary_en
              
              return (
                <Link key={item.id} href={`/${locale}/news/${item.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    {item.cover_image_url && (
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={item.cover_image_url}
                          alt={title || ''}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      {item.source && (
                        <Badge variant="secondary" className="mb-2">
                          {item.source}
                        </Badge>
                      )}
                      
                      <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                        {title}
                      </h2>
                      
                      {summary && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                          {summary}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          <span>
                            {item.published_at ? new Date(item.published_at).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : (isZh ? '未知日期' : 'Unknown date')}
                          </span>
                        </div>
                        
                        {item.views > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.views} {isZh ? '阅读' : 'views'}</span>
                          </div>
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
      </div>
    </>
  )
}
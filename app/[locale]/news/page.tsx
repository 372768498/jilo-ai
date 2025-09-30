import { createServerClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

export default async function NewsPage({ params }: { params: { locale: string } }) {
  const supabase = await createServerClient()
  const { data: news } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const isZh = params.locale === 'zh'
  const t = {
    title: isZh ? 'AI 资讯' : 'AI News',
    subtitle: isZh ? '最新的 AI 工具动态和行业资讯' : 'Latest AI tools updates and industry news',
    readMore: isZh ? '阅读全文' : 'Read More',
    noNews: isZh ? '暂无新闻' : 'No news yet'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href={`/${params.locale}`} className="text-2xl font-bold text-indigo-600">Jilo.ai</Link>
          <Link href={params.locale === 'zh' ? '/en/news' : '/zh/news'} className="px-3 py-1 border rounded">
            {params.locale === 'zh' ? 'EN' : '中文'}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 mb-12">{t.subtitle}</p>

          {!news || news.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed">
              <p className="text-gray-500 text-lg">{t.noNews}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {news.map((item: any) => {
                const title = isZh && item.title_zh ? item.title_zh : item.title_en
                const summary = isZh && item.summary_zh ? item.summary_zh : item.summary_en
                const timeAgo = formatDistanceToNow(new Date(item.published_at), {
                  addSuffix: true,
                  locale: isZh ? zhCN : enUS
                })

                return (
                  <article key={item.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
                    <div className="flex gap-6">
                      {item.cover_image_url && (
                        <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          <img src={item.cover_image_url} alt={title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <span>{timeAgo}</span>
                          {item.source && <span>• {item.source}</span>}
                        </div>
                        <h2 className="text-2xl font-bold mb-3 hover:text-indigo-600">
                          <Link href={`/${params.locale}/news/${item.slug}`}>{title}</Link>
                        </h2>
                        <p className="text-gray-600 mb-4 line-clamp-2">{summary}</p>
                        <Link href={`/${params.locale}/news/${item.slug}`} 
                              className="text-indigo-600 hover:underline font-medium">
                          {t.readMore} →
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
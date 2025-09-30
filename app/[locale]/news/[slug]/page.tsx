import { createServerClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'

export default async function NewsDetailPage({ 
  params 
}: { 
  params: { locale: string; slug: string } 
}) {
  const supabase = await createServerClient()
  const { data: news } = await supabase
    .from('news')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!news) notFound()

  const isZh = params.locale === 'zh'
  const title = isZh && news.title_zh ? news.title_zh : news.title_en
  const content = isZh && news.content_zh ? news.content_zh : news.content_en
  const timeAgo = formatDistanceToNow(new Date(news.published_at), {
    addSuffix: true,
    locale: isZh ? zhCN : enUS
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white p-4">
        <div className="container mx-auto">
          <Link href={`/${params.locale}`} className="text-2xl font-bold text-indigo-600">Jilo.ai</Link>
        </div>
      </header>

      <article className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Link href={`/${params.locale}/news`} className="text-indigo-600 hover:underline mb-6 inline-block">
            ← {isZh ? '返回资讯列表' : 'Back to News'}
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          
          <div className="flex items-center gap-4 text-gray-600 mb-8">
            <span>{timeAgo}</span>
            {news.source && <span>• {news.source}</span>}
            {news.author && <span>• {news.author}</span>}
          </div>

          {news.cover_image_url && (
            <img src={news.cover_image_url} alt={title} 
                 className="w-full h-96 object-cover rounded-lg mb-8" />
          )}

          <div className="prose prose-lg max-w-none bg-white rounded-lg p-8">
            {content?.split('\n').map((para: string, i: number) => (
              <p key={i} className="mb-4">{para}</p>
            ))}
          </div>

          {news.source_url && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                {isZh ? '原文链接：' : 'Source: '}
                <a href={news.source_url} target="_blank" rel="noopener" 
                   className="text-indigo-600 hover:underline">
                  {news.source || news.source_url}
                </a>
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
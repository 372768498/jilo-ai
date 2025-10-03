import { createClient } from '@/lib/supabase/server'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface NewsDetailPageProps {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: NewsDetailPageProps) {
  const supabase = await createClient()
  
  const { data: news } = await supabase
    .from('news')
    .select('title, summary, image_url')
    .eq('slug', params.slug)
    .eq('language', params.locale === 'zh' ? 'zh' : 'en')
    .single()

  if (!news) {
    return { title: 'News Not Found' }
  }

  return {
    title: news.title,
    description: news.summary,
    openGraph: {
      title: news.title,
      description: news.summary,
      images: news.image_url ? [news.image_url] : [],
    },
  }
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const supabase = await createClient()
  
  const { data: news, error } = await supabase
    .from('news')
    .select('*')
    .eq('slug', params.slug)
    .eq('language', params.locale === 'zh' ? 'zh' : 'en')
    .eq('status', 'published')
    .single()

  if (error || !news) {
    notFound()
  }

  await supabase.rpc('increment_news_views', { news_id: news.id })

  const { data: relatedNews } = await supabase
    .from('news')
    .select('id, title, slug, image_url, published_at')
    .eq('category', news.category)
    .eq('language', params.locale === 'zh' ? 'zh' : 'en')
    .eq('status', 'published')
    .neq('id', news.id)
    .order('published_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href={`/${params.locale}/news`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {params.locale === 'zh' ? '返回新闻列表' : 'Back to News'}
          </Button>
        </Link>

        <article className="max-w-4xl mx-auto">
          <div className="mb-6">
            {news.category && (
              <Badge variant="secondary" className="mb-4">
                {news.category}
              </Badge>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {news.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {new Date(news.published_at).toLocaleDateString(params.locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              {news.views && (
                <div className="flex items-center gap-1">
                  <span>{news.views} views</span>
                </div>
              )}
            </div>
          </div>

          {news.image_url && (
            <div className="relative w-full h-[400px] mb-8 rounded-lg overflow-hidden">
              <img
                src={news.image_url}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {news.summary && (
            <div className="text-xl text-gray-600 mb-8 p-6 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              {news.summary}
            </div>
          )}

          <div 
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          {news.source_url && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                {params.locale === 'zh' ? '来源' : 'Source'}
              </p>
              
                <a href={news.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                {news.source || 'View Original'}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </article>

        {relatedNews && relatedNews.length > 0 && (
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">
              {params.locale === 'zh' ? '相关新闻' : 'Related News'}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedNews.map((item) => (
                <Link key={item.id} href={`/${params.locale}/news/${item.slug}`}>
                  <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {item.image_url && (
                      <div className="relative h-48 w-full">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(item.published_at).toLocaleDateString(params.locale)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
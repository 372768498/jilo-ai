import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NewsPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const supabase = await createClient()
  
  const { data: news, error } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .eq('language', locale === 'zh' ? 'zh' : 'en')
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) {
    return <div className="container mx-auto px-4 py-8">加载新闻失败</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {locale === 'zh' ? 'AI 新闻资讯' : 'AI News'}
        </h1>
        <p className="text-gray-600">
          {locale === 'zh' 
            ? '最新的 AI 行业动态、工具发布和深度分析' 
            : 'Latest AI industry news, tool launches and in-depth analysis'}
        </p>
      </div>

      {news && news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link 
              key={item.id} 
              href={`/${locale}/news/${item.slug}`}
              className="block border rounded-lg p-4 hover:shadow-lg transition"
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              
              <h2 className="text-xl font-bold mb-2 line-clamp-2">
                {item.title}
              </h2>
              
              <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                {item.summary}
              </p>
              
              <div className="text-xs text-gray-500">
                {new Date(item.published_at).toLocaleDateString(locale)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {locale === 'zh' ? '暂无新闻' : 'No news available'}
          </p>
        </div>
      )}
    </div>
  )
}
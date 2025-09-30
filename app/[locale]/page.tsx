import { createServerClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default async function Home({ params }: { params: { locale: string } }) {
  const supabase = await createServerClient()
  
  const { data: tools } = await supabase
    .from('tools')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12)

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  const { data: news } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(4)

  const isZh = params.locale === 'zh'
  const t = {
    title: isZh ? '发现最佳 AI 工具' : 'Discover the Best AI Tools',
    subtitle: isZh ? '探索 500+ 个 AI 工具，涵盖 50+ 个分类' : 'Explore 500+ AI tools across 50+ categories',
    featured: isZh ? '精选工具' : 'Featured Tools',
    latestNews: isZh ? '最新资讯' : 'Latest News',
    viewAll: isZh ? '查看全部' : 'View All',
    visit: isZh ? '访问工具' : 'Visit Tool',
    readMore: isZh ? '阅读全文' : 'Read More',
    noTools: isZh ? '暂无工具数据' : 'No tools yet',
    addTools: isZh ? '请在 Supabase 添加工具' : 'Add tools in Supabase!',
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href={`/${params.locale}`} className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              Jilo.ai
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href={`/${params.locale}`} className="text-gray-700 hover:text-indigo-600 font-medium">
                {isZh ? '首页' : 'Home'}
              </Link>
              <Link href={`/${params.locale}/tools`} className="text-gray-700 hover:text-indigo-600 font-medium">
                {isZh ? '工具' : 'Tools'}
              </Link>
              <Link href={`/${params.locale}/news`} className="text-gray-700 hover:text-indigo-600 font-medium">
                {isZh ? '资讯' : 'News'}
              </Link>
            </nav>

            <Link href={params.locale === 'zh' ? '/en' : '/zh'} 
                  className="px-3 py-1.5 rounded-lg border hover:border-indigo-500 transition text-sm font-medium">
              {params.locale === 'zh' ? 'EN' : '中文'}
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">{t.title}</h1>
            <p className="text-xl text-gray-600 mb-8">{t.subtitle}</p>
          </div>
        </div>
      </section>

      {categories && categories.length > 0 && (
        <section className="py-8 border-b bg-white">
          <div className="container mx-auto px-4">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categories.map((cat: any) => (
                <Link key={cat.id} href={`/${params.locale}/category/${cat.slug}`}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-indigo-50 rounded-lg border whitespace-nowrap">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium text-sm">{isZh ? cat.name_zh : cat.name_en}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 flex-1">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">{t.featured}</h2>
            <Link href={`/${params.locale}/tools`} className="text-indigo-600 hover:underline font-medium">
              {t.viewAll} →
            </Link>
          </div>
          
          {!tools || tools.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg mb-2">{t.noTools}</p>
              <p className="text-gray-400 text-sm">{t.addTools}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tools.map((tool: any) => {
                const toolName = isZh && tool.name_zh ? tool.name_zh : tool.name_en
                const toolTagline = isZh && tool.tagline_zh ? tool.tagline_zh : tool.tagline_en
                
                return (
                  <div key={tool.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition border p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {toolName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{toolName}</h3>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          {tool.pricing_type}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{toolTagline}</p>
                    <a href={tool.affiliate_url || tool.official_url} target="_blank" rel="noopener"
                       className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium text-center transition">
                      {t.visit}
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {news && news.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">{t.latestNews}</h2>
              <Link href={`/${params.locale}/news`} className="text-indigo-600 hover:underline font-medium">
                {t.viewAll} →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {news.map((item: any) => {
                const title = isZh && item.title_zh ? item.title_zh : item.title_en
                const summary = isZh && item.summary_zh ? item.summary_zh : item.summary_en
                
                return (
                  <Link key={item.id} href={`/${params.locale}/news/${item.slug}`}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
                    <h3 className="text-xl font-bold mb-2 hover:text-indigo-600">{title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{summary}</p>
                    <span className="text-indigo-600 text-sm font-medium">{t.readMore} →</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-gray-50 border-t py-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Jilo.ai</p>
        </div>
      </footer>
    </div>
  )
}
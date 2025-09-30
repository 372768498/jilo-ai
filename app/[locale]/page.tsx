import { createServerClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default async function Home({ params }: { params: { locale: string } }) {
  const supabase = await createServerClient()
  const { data: tools } = await supabase.from('tools').select('*').eq('status', 'published').limit(12)
  const { data: categories } = await supabase.from('categories').select('*').order('display_order')
  const isZh = params.locale === 'zh'

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white p-4">
        <div className="container mx-auto flex justify-between">
          <Link href={`/${params.locale}`} className="text-2xl font-bold text-indigo-600">Jilo.ai</Link>
          <Link href={isZh ? '/en' : '/zh'} className="px-3 py-1 border rounded">{isZh ? 'EN' : '中文'}</Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold mb-6">{isZh ? '发现最佳 AI 工具' : 'Discover AI Tools'}</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">{isZh ? '精选工具' : 'Featured'}</h2>
          {!tools || tools.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
              <p className="text-xl">📦 No tools - Add data in Supabase!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-6">
              {tools.map((t: any) => (
                <div key={t.id} className="bg-white rounded-xl shadow p-6 border">
                  <h3 className="font-bold mb-2">{isZh && t.name_zh ? t.name_zh : t.name_en}</h3>
                  <p className="text-sm text-gray-600 mb-4">{t.tagline_en}</p>
                  <a href={t.official_url} target="_blank" className="block bg-indigo-600 text-white py-2 rounded text-center">Visit</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-gray-50 border-t py-8 text-center">© 2025 Jilo.ai</footer>
    </div>
  )
}

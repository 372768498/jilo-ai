import { createServerClient } from '@/lib/supabase/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function ToolDetailPage({ 
  params 
}: { 
  params: { locale: string; slug: string } 
}) {
  const supabase = await createServerClient()
  
  const { data: tool } = await supabase
    .from('tools')
    .select('*, categories(*)')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!tool) notFound()

  const { data: relatedTools } = await supabase
    .from('tools')
    .select('*')
    .eq('category_id', tool.category_id)
    .eq('status', 'published')
    .neq('id', tool.id)
    .limit(4)

  const isZh = params.locale === 'zh'
  const name = isZh && tool.name_zh ? tool.name_zh : tool.name_en
  const tagline = isZh && tool.tagline_zh ? tool.tagline_zh : tool.tagline_en
  const description = isZh && tool.description_zh ? tool.description_zh : tool.description_en
  const review = isZh && tool.review_content_zh ? tool.review_content_zh : tool.review_content_en

  const t = {
    visit: isZh ? '访问官网' : 'Visit Website',
    pricing: isZh ? '定价' : 'Pricing',
    category: isZh ? '分类' : 'Category',
    rating: isZh ? '评分' : 'Rating',
    overview: isZh ? '产品概述' : 'Overview',
    review: isZh ? '深度测评' : 'Detailed Review',
    similar: isZh ? '相似工具' : 'Similar Tools',
    backToTools: isZh ? '← 返回工具列表' : '← Back to Tools'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white p-4">
        <div className="container mx-auto">
          <Link href={`/${params.locale}`} className="text-2xl font-bold text-indigo-600">Jilo.ai</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Link href={`/${params.locale}/tools`} className="text-indigo-600 hover:underline mb-6 inline-block">
          {t.backToTools}
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-32 h-32 flex-shrink-0">
              {tool.logo_url ? (
                <Image src={tool.logo_url} alt={name} width={128} height={128} className="rounded-xl" />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-5xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{name}</h1>
              <p className="text-xl text-gray-600 mb-6">{tagline}</p>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                  {tool.pricing_type}
                </div>
                {tool.categories && (
                  <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                    {isZh ? tool.categories.name_zh : tool.categories.name_en}
                  </div>
                )}
                {tool.rating > 0 && (
                  <div className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                    ⭐ {tool.rating.toFixed(1)}
                  </div>
                )}
              </div>

              <a href={tool.affiliate_url || tool.official_url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition">
                {t.visit} →
              </a>
            </div>
          </div>
        </div>

        {description && (
          <div className="bg-white rounded-xl shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">{t.overview}</h2>
            <div className="prose max-w-none text-gray-600">
              {description.split('\n').map((para: string, i: number) => (
                <p key={i} className="mb-4">{para}</p>
              ))}
            </div>
          </div>
        )}

        {tool.screenshots && tool.screenshots.length > 0 && (
          <div className="bg-white rounded-xl shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Screenshots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tool.screenshots.map((url: string, i: number) => (
                <img key={i} src={url} alt={`Screenshot ${i+1}`} className="rounded-lg border" />
              ))}
            </div>
          </div>
        )}

        {review && (
          <div className="bg-white rounded-xl shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">{t.review}</h2>
            <div className="prose max-w-none">
              {review.split('\n').map((para: string, i: number) => (
                <p key={i} className="mb-4">{para}</p>
              ))}
            </div>
          </div>
        )}

        {relatedTools && relatedTools.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t.similar}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {relatedTools.map((t: any) => {
                const tName = isZh && t.name_zh ? t.name_zh : t.name_en
                const tTagline = isZh && t.tagline_zh ? t.tagline_zh : t.tagline_en
                return (
                  <Link key={t.id} href={`/${params.locale}/tools/${t.slug}`}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-4">
                    <h3 className="font-bold mb-2">{tName}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{tTagline}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }) {
  const supabase = await createServerClient()
  const { data: tool } = await supabase.from('tools').select('*').eq('slug', params.slug).single()
  
  if (!tool) return {}
  
  const isZh = params.locale === 'zh'
  const name = isZh && tool.name_zh ? tool.name_zh : tool.name_en
  const desc = isZh && tool.tagline_zh ? tool.tagline_zh : tool.tagline_en
  
  return {
    title: `${name} - Jilo.ai`,
    description: desc,
    openGraph: {
      title: name,
      description: desc,
      images: tool.logo_url ? [tool.logo_url] : [],
    }
  }
}
// app/[locale]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { unstable_setRequestLocale } from 'next-intl/server'
import HeroSection from '@/components/HeroSection'
import HotToolsSection from '@/components/HotToolsSection'
import NewsSection from '@/components/NewsSection'

export default async function Home({
  params: { locale }
}: {
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)
  
  const supabase = await createClient()
  
  // 获取最新资讯（用于首页展示）
  const { data: latestNews } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .eq('language', locale === 'zh' ? 'zh' : 'en')
    .order('published_at', { ascending: false })
    .limit(6)

  return (
    <main className="min-h-screen">
      {/* Hero 区域 */}
      <HeroSection locale={locale} />

      {/* 热门工具区块 - 不再需要传递 hotTools prop */}
      <HotToolsSection locale={locale} />

      {/* 最新资讯 */}
      {latestNews && latestNews.length > 0 && (
        <NewsSection news={latestNews} locale={locale} />
      )}
    </main>
  )
}

// 生成静态参数
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'zh' }
  ]
}
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const locales = ['en', 'zh']

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale)) notFound()
  
  const isZh = locale === 'zh'
  const otherLocale = locale === 'zh' ? 'en' : 'zh'

  return (
    <div className="min-h-screen flex flex-col">
      {/* 导航栏 */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-bold">Jilo.ai</span>
          </Link>

          {/* 导航链接 */}
          <div className="flex items-center gap-6">
            <Link href={`/${locale}`} className="text-sm font-medium hover:text-primary transition-colors">
              {isZh ? '首页' : 'Home'}
            </Link>
            <Link href={`/${locale}/tools`} className="text-sm font-medium hover:text-primary transition-colors">
              {isZh ? '工具' : 'Tools'}
            </Link>
            <Link href={`/${locale}/news`} className="text-sm font-medium hover:text-primary transition-colors">
              {isZh ? '资讯' : 'News'}
            </Link>

            {/* 语言切换 */}
            <Link href={`/${otherLocale}`}>
              <Button variant="outline" size="sm">
                {locale === 'zh' ? 'EN' : '中文'}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="flex-1">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="border-t py-6 md:py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Jilo.ai. {isZh ? '保留所有权利' : 'All rights reserved'}.</p>
        </div>
      </footer>
    </div>
  )
}
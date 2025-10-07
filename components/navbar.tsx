'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  locale: string
}

export default function Navbar({ locale }: NavbarProps) {
  const isZh = locale === 'zh'
  const otherLocale = locale === 'zh' ? 'en' : 'zh'

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl font-bold">Jilo.ai</span>
        </Link>

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

          <Link href={`/${otherLocale}`}>
            <Button variant="outline" size="sm">
              {locale === 'zh' ? 'EN' : '中文'}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
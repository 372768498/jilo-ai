/**
 * 面包屑导航组件
 * 提升用户体验和SEO
 */

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  locale: string
}

export default function Breadcrumb({ items, locale }: BreadcrumbProps) {
  const homeLabel = locale.startsWith('zh') ? '首页' : 'Home'
  
  // 构建BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": homeLabel,
        "item": `https://www.jilo.ai/${locale}`
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        "item": `https://www.jilo.ai${item.href}`
      }))
    ]
  }
  
  return (
    <>
      {/* 面包屑导航UI */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* 首页 */}
          <li>
            <Link href={`/${locale}`} className="hover:text-foreground transition">
              {homeLabel}
            </Link>
          </li>
          
          {/* 中间项 */}
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              {index === items.length - 1 ? (
                // 最后一项不可点击
                <span className="text-foreground font-medium">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-foreground transition">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      
      {/* Schema.org BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}

/**
 * 使用示例:
 * 
 * // 在工具详情页:
 * <Breadcrumb
 *   items={[
 *     { label: 'AI Tools', href: `/${locale}/tools` },
 *     { label: tool.category, href: `/${locale}/tools?category=${tool.category}` },
 *     { label: tool.name, href: `/${locale}/tools/${tool.slug}` }
 *   ]}
 *   locale={locale}
 * />
 */
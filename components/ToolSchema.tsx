/**
 * Schema.org Product结构化数据组件
 * 用于AI工具详情页，提升SEO和搜索结果展示
 */

interface ToolSchemaProps {
  tool: {
    name_en?: string
    name_zh?: string
    tagline_en?: string
    tagline_zh?: string
    description_en?: string
    description_zh?: string
    official_url: string
    logo_url?: string
    cover_image_url?: string
    rating?: number
    review_count?: number
    pricing_type?: string
    price_range?: string
    category?: string
    features?: string // JSON string
  }
  locale: string
}

export default function ToolSchema({ tool, locale }: ToolSchemaProps) {
  const isZh = locale.startsWith('zh')
  
  // 解析features
  let features: string[] = []
  try {
    if (tool.features) {
      features = JSON.parse(tool.features)
    }
  } catch {}
  
  // 构建Product Schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": isZh ? (tool.name_zh || tool.name_en) : (tool.name_en || tool.name_zh),
    "description": isZh ? (tool.description_zh || tool.description_en) : (tool.description_en || tool.description_zh),
    "url": tool.official_url,
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": tool.category || "AI Tool",
    "operatingSystem": "Web",
    
    // Logo/Image
    ...(tool.logo_url && {
      "image": tool.logo_url
    }),
    
    // 评分
    ...(tool.rating && tool.review_count && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": tool.rating,
        "reviewCount": tool.review_count,
        "bestRating": "5",
        "worstRating": "1"
      }
    }),
    
    // 定价
    "offers": {
      "@type": "Offer",
      "price": tool.price_range || "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "category": tool.pricing_type === 'free' ? 'Free' : 
                  tool.pricing_type === 'paid' ? 'Paid' : 'Freemium'
    },
    
    // 功能特点
    ...(features.length > 0 && {
      "featureList": features.join(', ')
    }),
    
    // 提供商
    "provider": {
      "@type": "Organization",
      "name": "Jilo.ai"
    }
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
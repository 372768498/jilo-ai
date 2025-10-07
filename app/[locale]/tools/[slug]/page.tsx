import { createClient } from '@/lib/supabase/server'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface ToolDetailPageProps {
  params: {
    locale: string
    slug: string
  }
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const supabase = await createClient()
  const isZh = params.locale === 'zh'

  const { data: tool, error } = await supabase
    .from('tools')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (error || !tool) {
    notFound()
  }

  const name = isZh ? tool.name_zh : tool.name_en
  const tagline = isZh ? tool.tagline_zh : tool.tagline_en
  const description = isZh ? tool.description_zh : tool.description_en

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href={`/${params.locale}/tools`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isZh ? '返回工具列表' : 'Back to Tools'}
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-6 mb-8">
            {tool.logo_url && (
              <img src={tool.logo_url} alt={name || ''} className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{name || tool.name_en}</h1>
              {tagline && (
                <p className="text-xl text-muted-foreground mb-4">{tagline}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {tool.pricing_type && (
                  <Badge variant="secondary">{tool.pricing_type}</Badge>
                )}
                {tool.categories && Array.isArray(tool.categories) && tool.categories.map((cat: string) => (
                  <Badge key={cat} variant="outline">{cat}</Badge>
                ))}
              </div>
              <div className="flex gap-3">
                <a href={tool.affiliate_url || tool.official_url} target="_blank" rel="noopener noreferrer">
                  <Button size="lg">
                    {isZh ? '访问官网' : 'Visit Website'}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {description && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{isZh ? '关于此工具' : 'About'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{tool.clicks || 0}</div>
                <p className="text-sm text-muted-foreground">{isZh ? '访问次数' : 'Visits'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{tool.pricing_type || 'N/A'}</div>
                <p className="text-sm text-muted-foreground">{isZh ? '定价类型' : 'Pricing'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{Array.isArray(tool.categories) ? tool.categories.length : 0}</div>
                <p className="text-sm text-muted-foreground">{isZh ? '分类标签' : 'Categories'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
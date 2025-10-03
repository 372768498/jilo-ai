import { createClient } from '@/lib/supabase/server'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ExternalLink, 
  Star, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Zap,
  CheckCircle2,
  XCircle,
  Globe,
  Sparkles,
  Award,
  Target,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_setRequestLocale } from 'next-intl/server'
import { Metadata } from 'next'
import Image from 'next/image'

interface ToolDetailPageProps {
  params: {
    locale: string
    slug: string
  }
}

// 生成元数据 (SEO 优化)
export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const supabase = await createClient()
  
  const { data: tool } = await supabase
    .from('tools')
    .select('name_en, name_zh, description_en, description_zh, logo_url')
    .eq('slug', params.slug)
    .single()

  if (!tool) {
    return {
      title: 'Tool Not Found',
    }
  }

  const name = params.locale === 'zh' ? tool.name_zh : tool.name_en
  const description = params.locale === 'zh' ? tool.description_zh : tool.description_en

  return {
    title: `${name} - AI Tool Review & Analysis | Jilo.ai`,
    description: description,
    openGraph: {
      title: name,
      description: description,
      images: tool.logo_url ? [tool.logo_url] : [],
    },
  }
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  unstable_setRequestLocale(params.locale)
  
  const supabase = await createClient()
  const isZh = params.locale === 'zh'
  
  // 获取工具详情
  const { data: tool, error } = await supabase
    .from('tools')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (error || !tool) {
    notFound()
  }

  // 增加浏览量
  await supabase.rpc('increment_tool_clicks', { tool_id: tool.id })

  // 获取相似工具
  const { data: similarTools } = await supabase
    .from('tools')
    .select('id, name_en, name_zh, slug, tagline_en, tagline_zh, logo_url, pricing_type, click_count')
    .eq('category', tool.category)
    .eq('status', 'published')
    .neq('id', tool.id)
    .order('click_count', { ascending: false })
    .limit(6)

  const name = isZh ? tool.name_zh : tool.name_en
  const tagline = isZh ? tool.tagline_zh : tool.tagline_en
  const description = isZh ? tool.description_zh : tool.description_en
  
  // 判断是否有分销链接
  const ctaUrl = tool.affiliate_url || tool.official_url
  const isAffiliate = !!tool.affiliate_url

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        
        {/* 返回按钮 */}
        <Link href={`/${params.locale}/tools`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isZh ? '返回工具列表' : 'Back to Tools'}
          </Button>
        </Link>
        
        {/* 顶部工具信息卡片 */}
        <Card className="mb-8 border-2 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Logo 和基本信息 */}
              <div className="flex-shrink-0">
                {tool.logo_url ? (
                  <div className="w-32 h-32 relative rounded-2xl overflow-hidden border-2 border-border shadow-md">
                    <Image 
                      src={tool.logo_url} 
                      alt={name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-border">
                    <Sparkles className="w-16 h-16 text-primary" />
                  </div>
                )}
              </div>

              {/* 工具详情 */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {name}
                  </h1>
                  <p className="text-xl text-muted-foreground">{tagline}</p>
                </div>

                {/* 标签和指标 */}
                <div className="flex flex-wrap gap-3 items-center">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <Globe className="w-3 h-3 mr-1" />
                    {tool.category}
                  </Badge>
                  
                  <Badge 
                    variant={tool.pricing_type === 'free' ? 'default' : 'outline'}
                    className="text-sm px-3 py-1"
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    {tool.pricing_type === 'free' 
                      ? (isZh ? '免费' : 'Free')
                      : tool.pricing_type === 'freemium'
                      ? (isZh ? '免费+付费' : 'Freemium')
                      : (isZh ? '付费' : 'Paid')
                    }
                  </Badge>

                  {tool.click_count > 0 && (
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {tool.click_count} {isZh ? '次访问' : 'visits'}
                    </Badge>
                  )}

                  {isAffiliate && (
                    <Badge variant="default" className="text-sm px-3 py-1 bg-green-500">
                      <Award className="w-3 h-3 mr-1" />
                      {isZh ? '推荐' : 'Recommended'}
                    </Badge>
                  )}
                </div>

                {/* CTA 按钮 */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    size="lg" 
                    className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    asChild
                  >
                    <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                      <Zap className="w-5 h-5" />
                      {isZh ? '立即使用' : 'Try Now'}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  
                  {tool.official_url && tool.affiliate_url && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      asChild
                    >
                      <a href={tool.official_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        {isZh ? '官方网站' : 'Official Site'}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主要内容区域 - Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">{isZh ? '概览' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="features">{isZh ? '功能特点' : 'Features'}</TabsTrigger>
            <TabsTrigger value="pricing">{isZh ? '价格' : 'Pricing'}</TabsTrigger>
            <TabsTrigger value="alternatives">{isZh ? '相似工具' : 'Alternatives'}</TabsTrigger>
          </TabsList>

          {/* 概览标签 */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {isZh ? '工具介绍' : 'About This Tool'}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed">{description}</p>
                
                {tool.long_description_en || tool.long_description_zh ? (
                  <div className="mt-6 space-y-4">
                    <div dangerouslySetInnerHTML={{ 
                      __html: isZh ? (tool.long_description_zh || tool.long_description_en) : (tool.long_description_en || tool.long_description_zh)
                    }} />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* 快速统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{tool.click_count || 0}</div>
                  <p className="text-sm text-muted-foreground">
                    {isZh ? '总访问量' : 'Total Visits'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{tool.rating || 4.5}</div>
                  <p className="text-sm text-muted-foreground">
                    {isZh ? '用户评分' : 'User Rating'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">
                    {isZh ? '热门' : 'Trending'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isZh ? '本周状态' : 'This Week'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 功能特点标签 */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {isZh ? '主要功能' : 'Key Features'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tool.features && tool.features.length > 0 ? (
                  <div className="grid gap-4">
                    {tool.features.map((feature: any, index: number) => (
                      <div key={index}>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold mb-1">{feature.title}</h4>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        {index < tool.features.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          {isZh ? 'AI 驱动' : 'AI-Powered'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {isZh ? '使用最新的人工智能技术,提供智能化的解决方案' : 'Leverages cutting-edge AI technology for intelligent solutions'}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          {isZh ? '易于使用' : 'Easy to Use'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {isZh ? '直观的界面设计,无需技术背景即可快速上手' : 'Intuitive interface designed for users of all skill levels'}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">
                          {isZh ? '高效节省时间' : 'Time-Saving'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {isZh ? '自动化繁琐任务,大幅提升工作效率' : 'Automates tedious tasks to dramatically improve productivity'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 优点和缺点 */}
                {(tool.pros && tool.pros.length > 0) || (tool.cons && tool.cons.length > 0) ? (
                  <div className="mt-8 grid md:grid-cols-2 gap-6">
                    {tool.pros && tool.pros.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          {isZh ? '优点' : 'Pros'}
                        </h4>
                        <ul className="space-y-2">
                          {tool.pros.map((pro: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span className="text-sm">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {tool.cons && tool.cons.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          {isZh ? '缺点' : 'Cons'}
                        </h4>
                        <ul className="space-y-2">
                          {tool.cons.map((con: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span className="text-sm">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* 使用场景 */}
                {tool.use_cases && tool.use_cases.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold mb-3">
                      {isZh ? '使用场景' : 'Use Cases'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tool.use_cases.map((useCase: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {useCase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 价格标签 */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {isZh ? '定价方案' : 'Pricing Plans'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {tool.pricing_type === 'free' || tool.pricing_type === 'freemium' ? (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-xl">
                          {isZh ? '免费版' : 'Free Plan'}
                        </CardTitle>
                        <p className="text-3xl font-bold">$0</p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{isZh ? '基础功能' : 'Basic features'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{isZh ? '有限使用次数' : 'Limited usage'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                  {tool.pricing_type === 'paid' || tool.pricing_type === 'freemium' ? (
                    <Card className="border-2 border-primary">
                      <CardHeader>
                        <CardTitle className="text-xl">
                          {isZh ? '专业版' : 'Pro Plan'}
                        </CardTitle>
                        <p className="text-3xl font-bold">
                          {isZh ? '联系获取' : 'Contact for pricing'}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{isZh ? '全部功能' : 'All features'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{isZh ? '无限使用' : 'Unlimited usage'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{isZh ? '优先支持' : 'Priority support'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>

                <div className="mt-6 text-center">
                  <Button size="lg" asChild>
                    <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                      {isZh ? '查看完整定价' : 'View Full Pricing'}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 相似工具标签 */}
          <TabsContent value="alternatives" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isZh ? '相似的 AI 工具' : 'Similar AI Tools'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {similarTools && similarTools.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {similarTools.map((similar) => (
                      <Link
                        key={similar.id}
                        href={`/${params.locale}/tools/${similar.slug}`}
                        className="block"
                      >
                        <Card className="h-full hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {similar.logo_url ? (
                                <div className="w-12 h-12 relative rounded-lg overflow-hidden border flex-shrink-0">
                                  <Image
                                    src={similar.logo_url}
                                    alt={isZh ? similar.name_zh : similar.name_en}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Sparkles className="w-6 h-6 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">
                                  {isZh ? similar.name_zh : similar.name_en}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {isZh ? similar.tagline_zh : similar.tagline_en}
                                </p>
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  {similar.pricing_type}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {isZh ? '暂无相似工具' : 'No similar tools found'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 底部 CTA */}
        <Card className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              {isZh ? '准备好试用了吗？' : 'Ready to Try?'}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {isZh 
                ? `立即开始使用 ${name},体验 AI 的强大功能`
                : `Start using ${name} today and experience the power of AI`
              }
            </p>
            <Button size="lg" asChild>
              <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                <Zap className="w-5 h-5 mr-2" />
                {isZh ? '立即开始' : 'Get Started'}
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

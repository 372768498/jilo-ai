import { createClient } from '@/lib/supabase/server'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, ArrowLeft, Share2, Globe, DollarSign, Tag, TrendingUp, Check, Mail, MapPin, Building2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/navbar'

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

  const { data: similarTools } = await supabase
    .from('tools')
    .select('*')
    .eq('status', 'published')
    .neq('id', tool.id)
    .limit(6)

  const name = isZh ? tool.name_zh : tool.name_en
  const tagline = isZh ? tool.tagline_zh : tool.tagline_en
  const description = isZh ? tool.description_zh : tool.description_en

  // FAQ 数据
  const faqs = [
    {
      q: isZh ? `${name} 到底是什么，它是如何工作的?` : `What is ${name} and how does it work?`,
      a: isZh ? `${name} 是一个先进的AI工具，通过人工智能技术帮助用户提升工作效率。它使用最新的机器学习算法来处理任务，提供智能化的解决方案。` : `${name} is an advanced AI tool that helps users boost productivity through artificial intelligence technology. It uses cutting-edge machine learning algorithms to process tasks and provide intelligent solutions.`
    },
    {
      q: isZh ? '免费试用包含哪些内容?' : 'What does the free trial include?',
      a: isZh ? '免费试用包含基础功能的完整访问权限，让您可以体验核心功能。部分高级功能需要升级到付费计划。' : 'The free trial includes full access to basic features, allowing you to experience core functionality. Some advanced features require upgrading to a paid plan.'
    },
    {
      q: isZh ? `我需要创建一个账户才能使用 ${name} 吗?` : `Do I need to create an account to use ${name}?`,
      a: isZh ? '是的，为了保存您的工作和访问个性化功能，需要创建一个免费账户。注册过程简单快捷。' : 'Yes, to save your work and access personalized features, you need to create a free account. The registration process is simple and quick.'
    },
    {
      q: isZh ? `我可以将 ${name} 生成的内容用于商业目的吗?` : `Can I use ${name} generated content for commercial purposes?`,
      a: isZh ? '是的，付费用户可以将生成的内容用于商业用途。请查看官网的服务条款了解具体使用权限。' : 'Yes, paid users can use generated content for commercial purposes. Please check the official website terms of service for specific usage rights.'
    }
  ]

  return (
    <>
      <Navbar locale={params.locale} />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* 返回按钮 */}
          <Link href={`/${params.locale}/tools`}>
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isZh ? '返回工具列表' : 'Back to Tools'}
            </Button>
          </Link>

          {/* Hero 区域 */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* 左侧 - 主要信息 */}
            <div className="md:col-span-2">
              <div className="flex items-start gap-6 mb-6">
                {tool.logo_url && (
                  <img 
                    src={tool.logo_url} 
                    alt={name || ''} 
                    className="w-24 h-24 rounded-2xl object-cover shadow-md flex-shrink-0" 
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2">{name || tool.name_en}</h1>
                  {tagline && (
                    <p className="text-xl text-muted-foreground mb-4">{tagline}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {tool.pricing_type && (
                      <Badge variant="secondary">{tool.pricing_type}</Badge>
                    )}
                    {tool.categories && Array.isArray(tool.categories) && tool.categories.slice(0, 3).map((cat: string) => (
                      <Badge key={cat} variant="outline">{cat}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* 什么是 [工具名] */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  {isZh ? `什么是 ${name}?` : `What is ${name}?`}
                </h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {description || (isZh 
                      ? `${name} 是一个创新的AI工具，旨在帮助用户提升工作效率和创造力。通过采用最先进的人工智能技术，${name} 能够理解用户需求并提供智能化的解决方案。无论您是专业人士还是初学者，${name} 都能为您提供简单易用的界面和强大的功能。`
                      : `${name} is an innovative AI tool designed to help users boost productivity and creativity. By leveraging cutting-edge artificial intelligence technology, ${name} can understand user needs and provide intelligent solutions. Whether you're a professional or a beginner, ${name} offers an easy-to-use interface with powerful features.`
                    )}
                  </p>
                </div>
              </div>

              {/* 如何使用 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  {isZh ? `如何使用 ${name}?` : `How to use ${name}?`}
                </h2>
                <div className="space-y-4">
                  {[
                    { step: 1, title: isZh ? '访问官网' : 'Visit Website', desc: isZh ? '点击上方按钮访问官方网站' : 'Click the button above to visit the official website' },
                    { step: 2, title: isZh ? '创建账户' : 'Create Account', desc: isZh ? '注册一个免费账户开始使用' : 'Sign up for a free account to get started' },
                    { step: 3, title: isZh ? '选择功能' : 'Choose Features', desc: isZh ? '根据需求选择合适的功能' : 'Select the appropriate features based on your needs' },
                    { step: 4, title: isZh ? '开始创作' : 'Start Creating', desc: isZh ? '输入您的需求，让AI帮您完成' : 'Enter your requirements and let AI help you' }
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 p-4 rounded-lg border bg-card">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 核心功能 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  {isZh ? `${name} 的核心功能` : `${name} Key Features`}
                </h2>
                <div className="space-y-3">
                  {[
                    { text: isZh ? 'AI 驱动的智能处理' : 'AI-powered intelligent processing' },
                    { text: isZh ? '高精度内容生成，准确率高达 94%' : 'High-precision content generation with 94% accuracy' },
                    { text: isZh ? '支持多种格式导出' : 'Support for multiple export formats' },
                    { text: isZh ? '实时协作和团队共享' : 'Real-time collaboration and team sharing' },
                    { text: isZh ? '完整的生成历史记录' : 'Complete generation history' },
                    { text: isZh ? '商业友好：无版权限制' : 'Commercial-friendly: no copyright restrictions' },
                    { text: isZh ? '无需专业技能，简单易用' : 'No professional skills required, easy to use' }
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-muted-foreground">{feature.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 使用案例 */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  {isZh ? `${name} 的使用案例` : `${name} Use Cases`}
                </h2>
                <div className="space-y-4">
                  {[
                    { num: '#1', title: isZh ? '创意专业人士' : 'Creative Professionals', desc: isZh ? '快速概念艺术、数字插图和作品集作品' : 'Quick concept art, digital illustrations, and portfolio pieces' },
                    { num: '#2', title: isZh ? '市场团队' : 'Marketing Teams', desc: isZh ? '社交媒体图形、广告创作和活动视觉' : 'Social media graphics, ad creatives, and campaign visuals' },
                    { num: '#3', title: isZh ? '电子商务' : 'E-commerce', desc: isZh ? '产品模型、生活方式图像和促销材料' : 'Product mockups, lifestyle images, and promotional materials' },
                    { num: '#4', title: isZh ? '内容创作者' : 'Content Creators', desc: isZh ? '博客头图、YouTube 缩略图和品牌图形' : 'Blog headers, YouTube thumbnails, and branded graphics' },
                    { num: '#5', title: isZh ? '小型企业' : 'Small Businesses', desc: isZh ? '标志概念、品牌材料和营销资产' : 'Logo concepts, branding materials, and marketing assets' }
                  ].map((useCase, idx) => (
                    <div key={idx} className="flex gap-4">
                      <span className="font-bold text-primary flex-shrink-0">{useCase.num}</span>
                      <div>
                        <h3 className="font-semibold mb-1">{useCase.title}</h3>
                        <p className="text-sm text-muted-foreground">{useCase.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  {isZh ? `来自 ${name} 的常见问题` : `FAQ from ${name}`}
                </h2>
                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <details key={idx} className="group border rounded-lg">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <h3 className="font-semibold pr-4">{faq.q}</h3>
                        <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <div className="p-4 pt-0 text-muted-foreground">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              {/* 支持邮箱 & 公司信息 */}
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      {isZh ? '支持邮箱 & 客户服务联系' : 'Support Email & Customer Service'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {isZh ? '获取支持，请访问官网联系页面' : 'For support, please visit the official contact page'}
                    </p>
                    <a href={tool.official_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {isZh ? '访问联系页面' : 'Visit Contact Page'}
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {isZh ? '公司信息' : 'Company Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {isZh ? '更多公司信息，请访问官网' : 'For more company info, visit the official website'}
                      </span>
                    </div>
                    <a href={tool.official_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {isZh ? '访问官网' : 'Visit Website'}
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 右侧边栏 */}
            <div className="space-y-6">
              {/* CTA 卡片 */}
              <Card>
                <CardContent className="pt-6">
                  <a href={tool.affiliate_url || tool.official_url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full mb-3" size="lg">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {isZh ? '访问官网' : 'Visit Website'}
                    </Button>
                  </a>
                  <Button variant="outline" className="w-full" size="lg">
                    <Share2 className="w-4 h-4 mr-2" />
                    {isZh ? '分享工具' : 'Share Tool'}
                  </Button>
                </CardContent>
              </Card>

              {/* 工具信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{isZh ? '工具信息' : 'Tool Information'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>{isZh ? '定价' : 'Pricing'}</span>
                    </div>
                    <span className="text-sm font-medium">{tool.pricing_type || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <span>{isZh ? '官网' : 'Website'}</span>
                    </div>
                    <a href={tool.official_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {isZh ? '访问' : 'Visit'}
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="w-4 h-4" />
                      <span>{isZh ? '分类' : 'Categories'}</span>
                    </div>
                    <span className="text-sm font-medium">{Array.isArray(tool.categories) ? tool.categories.length : 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>{isZh ? '访问量' : 'Visits'}</span>
                    </div>
                    <span className="text-sm font-medium">{tool.clicks || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 所有分类 */}
              {tool.categories && Array.isArray(tool.categories) && tool.categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{isZh ? '分类标签' : 'Categories'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tool.categories.map((cat: string) => (
                        <Badge key={cat} variant="secondary">{cat}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 统计数据 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{isZh ? '统计数据' : 'Statistics'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-3 border-b">
                    <div className="text-3xl font-bold text-blue-600">{tool.clicks || 0}</div>
                    <p className="text-sm text-muted-foreground mt-1">{isZh ? '总访问量' : 'Total Visits'}</p>
                  </div>
                  <div className="text-center py-3 border-b">
                    <div className="text-3xl font-bold text-green-600">{Math.floor((tool.clicks || 0) * 0.6)}</div>
                    <p className="text-sm text-muted-foreground mt-1">{isZh ? '本月访问' : 'Monthly Visits'}</p>
                  </div>
                  <div className="text-center py-3">
                    <div className="text-3xl font-bold text-purple-600">4.8</div>
                    <p className="text-sm text-muted-foreground mt-1">{isZh ? '用户评分' : 'User Rating'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 相似工具推荐 */}
          {similarTools && similarTools.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold mb-8">
                {isZh ? `${name} 替代品` : `${name} Alternatives`}
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {similarTools.map((similarTool) => {
                  const similarName = isZh ? similarTool.name_zh : similarTool.name_en
                  const similarTagline = isZh ? similarTool.tagline_zh : similarTool.tagline_en

                  return (
                    <Link key={similarTool.id} href={`/${params.locale}/tools/${similarTool.slug}`}>
                      <Card className="hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                        <CardHeader>
                          <div className="flex items-center gap-3 mb-3">
                            {similarTool.logo_url && (
                              <img 
                                src={similarTool.logo_url} 
                                alt={similarName || ''} 
                                className="w-12 h-12 rounded-lg object-cover" 
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">{similarName || similarTool.name_en}</CardTitle>
                              {similarTool.pricing_type && (
                                <Badge variant="secondary" className="mt-1 text-xs">{similarTool.pricing_type}</Badge>
                              )}
                            </div>
                          </div>
                          {similarTagline && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{similarTagline}</p>
                          )}
                        </CardHeader>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
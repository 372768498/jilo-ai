// components/HotToolsSection.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// 定义分类映射的类型
type CategoryKey = 'recommend' | 'office' | 'chat' | 'image' | 'video' | 'code' | 'comic' | 'write' | 'audio' | 'other'

// 分类映射（带类型）
const CATEGORY_MAP: Record<CategoryKey, { zh: string; en: string; value?: any }> = {
  recommend: { zh: '推荐', en: 'Recommended', value: undefined },
  office: { zh: '办公', en: 'Office', value: { zh: '办公', en: 'Office' } },
  chat: { zh: '对话', en: 'Chat', value: { zh: '对话', en: 'Chat' } },
  image: { zh: '图像', en: 'Image', value: { zh: '图像', en: 'Image' } },
  video: { zh: '视频', en: 'Video', value: { zh: '视频', en: 'Video' } },
  code: { zh: '编程', en: 'Code', value: { zh: '编程', en: 'Code' } },
  comic: { zh: '漫画', en: 'Comic', value: { zh: '漫画', en: 'Comic' } },
  write: { zh: '写作', en: 'Writing', value: { zh: '写作', en: 'Writing' } },
  audio: { zh: '音频', en: 'Audio', value: { zh: '音频', en: 'Audio' } },
  other: { zh: '其他', en: 'Other', value: { zh: '其他', en: 'Other' } }
}

const TAB_KEYS: CategoryKey[] = ['recommend', 'office', 'chat', 'image', 'video', 'code', 'comic', 'write', 'audio', 'other']

interface Tool {
  id: number
  name: string
  description: string
  category: string
  logo_url: string
  affiliate_url: string
  click_count: number
  pricing_type?: string
}

export default function HotToolsSection({ locale }: { locale: string }) {
  const [activeTab, setActiveTab] = useState<CategoryKey>('recommend')
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const isZh = locale === 'zh'

  // 生成标签页
  const tabs = TAB_KEYS.map(key => ({
    key,
    label: isZh ? CATEGORY_MAP[key].zh : CATEGORY_MAP[key].en
  }))

  // 分类筛选
  useEffect(() => {
    async function fetchTools() {
      setLoading(true)
      const supabase = createClient()
      
      let query = supabase
        .from('tools')
        .select('*')
        .eq('status', 'published')
        .order('click_count', { ascending: false })
        .limit(8)

      // 如果不是"推荐"标签，按分类筛选
      if (activeTab !== 'recommend') {
        const categoryValue = CATEGORY_MAP[activeTab].value
        if (categoryValue) {
          query = query.eq('category', isZh ? categoryValue.zh : categoryValue.en)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching tools:', error)
        setTools([])
      } else {
        setTools(data || [])
      }
      
      setLoading(false)
    }

    fetchTools()
  }, [activeTab, isZh])

  // 处理工具点击
  async function handleToolClick(toolId: number, affiliateUrl: string) {
    const supabase = createClient()
    
    // 增加点击次数
    await supabase.rpc('increment_tool_clicks', { tool_id: toolId })
    
    // 跳转到affiliate链接
    window.open(affiliateUrl, '_blank')
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* 标题 */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">
              {isZh ? '🔥 热门 AI 工具' : '🔥 Trending AI Tools'}
            </h2>
          </div>
          <p className="text-muted-foreground text-lg">
            {isZh ? '发现最受欢迎的 AI 工具，提升你的生产力' : 'Discover the most popular AI tools to boost your productivity'}
          </p>
        </div>

        {/* 分类标签页 */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.key)}
              className="min-w-[80px]"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* 工具网格 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tools.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {isZh ? '暂无工具数据' : 'No tools available'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <Card 
                key={tool.id} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => handleToolClick(tool.id, tool.affiliate_url)}
              >
                <CardContent className="p-6">
                  {/* Logo */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                      {tool.logo_url ? (
                        <img 
                          src={tool.logo_url} 
                          alt={tool.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-muted-foreground">
                          {tool.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  {/* 工具名称 */}
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {tool.name}
                  </h3>

                  {/* 描述 */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {tool.description}
                  </p>

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {tool.category}
                      </Badge>
                      {tool.pricing_type && (
                        <Badge variant="outline" className={`text-xs px-1.5 py-0 ${
                          tool.pricing_type === 'free' ? 'bg-green-50 text-green-700 border-green-200' :
                          tool.pricing_type === 'freemium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {tool.pricing_type === 'free' ? 'Free' :
                           tool.pricing_type === 'freemium' ? 'Freemium' : 'Paid'}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {tool.click_count || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 查看更多按钮 */}
        <div className="text-center mt-10">
          <Link href={`/${locale}/tools`}>
            <Button size="lg" variant="outline">
              {isZh ? '查看全部工具 →' : 'View All Tools →'}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
'use client'

import { useState } from "react"
import CategoryTabs from "@/components/CategoryTabs"
import ToolCardSkeleton from '@/components/ToolCardSkeleton'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { Button } from "@/components/ui/button"

const CATEGORY_MAP = {
  recommend: { zh: '推荐', en: 'Recommend', value: undefined },
  office:    { zh: '人工智能办公', en: 'Productivity', value: { zh: '办公与生产力', en: 'Productivity' } },
  chat:      { zh: '人工智能聊天', en: 'Chatbot & AI Assistants', value: { zh: '聊天机器人和虚拟伴侣', en: 'Chatbot & AI Assistants' } },
  image:     { zh: 'AI画图', en: 'Image Generation', value: { zh: '图像生成和编辑', en: 'Image Generation' } },
  video:     { zh: '人工智能视频', en: 'Video & Animation', value: { zh: '视频和动画', en: 'Video & Animation' } },
  code:      { zh: '人工智能编程', en: 'Coding & Development', value: { zh: '编码与开发', en: 'Coding & Development' } },
  comic:     { zh: '人工智能漫画', en: 'Art & Design', value: { zh: '艺术与创意设计', en: 'Art & Design' } },
  write:     { zh: '人工智能写作', en: 'Writing & Editing', value: { zh: '写作与编辑', en: 'Writing & Editing' } }
}

const TAB_KEYS = ['recommend', 'office', 'chat', 'image', 'video', 'code', 'comic', 'write']

export default function HotToolsSection({
  hotTools,
  locale
}: {
  hotTools: any[],
  locale: string
}) {
  const isZh = locale === 'zh'
  const [currentCat, setCurrentCat] = useState('recommend')

  // 动态生成 Tabs 列表
  const tabs = TAB_KEYS.map(key => ({
    key,
    label: isZh ? CATEGORY_MAP[key].zh : CATEGORY_MAP[key].en
  }))

  // 分类筛选
  const filtered = currentCat === 'recommend'
    ? hotTools
    : hotTools.filter(t => {
        const cat = CATEGORY_MAP[currentCat]
        return isZh
          ? t.category_zh === cat.value.zh
          : t.category_en === cat.value.en
      })

  return (
    <section className="mb-16 mt-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            {isZh ? '热门工具' : 'Featured Tools'}
          </h2>
          <p className="text-muted-foreground">
            {isZh ? '最受欢迎的AI工具' : 'Most popular AI tools'}
          </p>
        </div>
        <Link href={`/${locale}/tools`}>
          <Button variant="ghost">
            {isZh ? '查看全部' : 'View All'}
          </Button>
        </Link>
      </div>
      {/* 分类 Tabs */}
      <CategoryTabs
        onChange={setCurrentCat}
        defaultValue="recommend"
        tabs={tabs}
      />
      {/* 骨架屏 & 卡片 */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {filtered.map((tool) => {
            const name = isZh ? tool.name_zh : tool.name_en
            const tagline = isZh ? tool.tagline_zh : tool.tagline_en

            return (
              <Card
                key={tool.id}
                className="
                  hover:scale-105
                  hover:shadow-2xl
                  hover:border-primary
                  hover:bg-gradient-to-tr
                  hover:from-purple-50
                  hover:to-pink-50
                  hover:ring-2
                  hover:ring-purple-300
                  border-2
                  transition-all
                  duration-300
                "
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {(tool.logo_url || tool.image_url) && (
                      <img
                        src={tool.logo_url || tool.image_url}
                        alt={name || ''}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {name || tool.name_en}
                      </CardTitle>
                    </div>
                  </div>
                  {tagline && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tagline}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <Link href={`/${locale}/tools/${tool.slug}`}>
                    <Button variant="outline" className="w-full" size="sm">
                      {isZh ? '了解更多' : 'Learn More'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ToolCardSkeleton key={idx} />
          ))}
        </div>
      )}
    </section>
  )
}

import Link from 'next/link'
import { Card, CardContent } from "@/components/ui/card"

interface Category {
  id: string
  name_en: string
  name_zh: string
  emoji: string
  count: number
  dbValue: string // 数据库中的实际值
}

const categories: Category[] = [
  { 
    id: 'chatbot', 
    name_en: 'Chatbot & AI Assistants', 
    name_zh: '聊天机器人和虚拟伴侣',
    emoji: '💬',
    count: 4,
    dbValue: 'Chatbot'
  },
  { 
    id: 'productivity', 
    name_en: 'Productivity', 
    name_zh: '办公与生产力',
    emoji: '📎',
    count: 6,
    dbValue: 'Productivity'
  },
  { 
    id: 'image', 
    name_en: 'Image Generation', 
    name_zh: '图像生成和编辑',
    emoji: '🎨',
    count: 15,
    dbValue: 'Image Generation'
  },
  { 
    id: 'art', 
    name_en: 'Art & Design', 
    name_zh: '艺术与创意设计',
    emoji: '🧑‍🎨',
    count: 15,
    dbValue: 'Image Generation' // 合并到图像类别
  },
  { 
    id: 'coding', 
    name_en: 'Coding & Development', 
    name_zh: '编码与开发',
    emoji: '💻',
    count: 8,
    dbValue: 'Developer Tools'
  },
  { 
    id: 'video', 
    name_en: 'Video & Animation', 
    name_zh: '视频和动画',
    emoji: '🎬',
    count: 10,
    dbValue: 'Video'
  },
  { 
    id: 'education', 
    name_en: 'Education & Learning', 
    name_zh: '教育与翻译',
    emoji: '🎓',
    count: 6,
    dbValue: 'Productivity' // 合并到生产力
  },
  { 
    id: 'writing', 
    name_en: 'Writing & Editing', 
    name_zh: '写作与编辑',
    emoji: '✍️',
    count: 14,
    dbValue: 'Writing'
  },
  { 
    id: 'audio', 
    name_en: 'Audio & Voice', 
    name_zh: '语音生成与转换',
    emoji: '🎙️',
    count: 7,
    dbValue: 'Audio'
  },
  { 
    id: 'business', 
    name_en: 'Business & Marketing', 
    name_zh: '商业管理',
    emoji: '📊',
    count: 6,
    dbValue: 'Marketing'
  },
  { 
    id: 'music', 
    name_en: 'Music & Audio', 
    name_zh: '音乐和音频',
    emoji: '🎵',
    count: 7,
    dbValue: 'Audio'
  }
]

interface ToolCategoriesProps {
  locale: string
  title?: string
  showAll?: boolean
}

export default function ToolCategories({ 
  locale, 
  title,
  showAll = false 
}: ToolCategoriesProps) {
  const isZh = locale === 'zh'
  
  // 只显示前8个或全部
  const displayCategories = showAll ? categories : categories.slice(0, 8)

  return (
    <section className="py-8">
      {title && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {title}
          </h2>
          <p className="text-muted-foreground">
            {isZh ? '按类别划分的免费 AI 工具' : 'Browse AI tools by category'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayCategories.map((category) => (
          <Link 
            key={category.id} 
            href={`/${locale}/tools?category=${category.dbValue}`}
          >
            <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                  {category.emoji}
                </div>
                <h3 className="font-semibold mb-2 text-sm">
                  {isZh ? category.name_zh : category.name_en}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {category.count} {isZh ? '个工具' : 'tools'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
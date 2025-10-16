import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type CategoryTagsProps = {
  locale: string;
};

export default function CategoryTags({ locale }: CategoryTagsProps) {
  const isZh = locale === "zh";

  const categories = isZh ? [
    { name: "AI 写作", slug: "writing", icon: "✍️" },
    { name: "AI 绘画", slug: "image", icon: "🎨" },
    { name: "AI 视频", slug: "video", icon: "🎬" },
    { name: "AI 编程", slug: "coding", icon: "💻" },
    { name: "AI 聊天", slug: "chatbot", icon: "💬" },
    { name: "AI 音频", slug: "audio", icon: "🎵" },
    { name: "AI 设计", slug: "design", icon: "🎭" },
    { name: "AI 营销", slug: "marketing", icon: "📢" },
    { name: "AI 翻译", slug: "translation", icon: "🌐" },
    { name: "AI 搜索", slug: "search", icon: "🔍" },
    { name: "AI 教育", slug: "education", icon: "📚" },
    { name: "AI 生产力", slug: "productivity", icon: "⚡" },
  ] : [
    { name: "AI Writing", slug: "writing", icon: "✍️" },
    { name: "AI Image", slug: "image", icon: "🎨" },
    { name: "AI Video", slug: "video", icon: "🎬" },
    { name: "AI Coding", slug: "coding", icon: "💻" },
    { name: "AI Chatbot", slug: "chatbot", icon: "💬" },
    { name: "AI Audio", slug: "audio", icon: "🎵" },
    { name: "AI Design", slug: "design", icon: "🎭" },
    { name: "AI Marketing", slug: "marketing", icon: "📢" },
    { name: "AI Translation", slug: "translation", icon: "🌐" },
    { name: "AI Search", slug: "search", icon: "🔍" },
    { name: "AI Education", slug: "education", icon: "📚" },
    { name: "AI Productivity", slug: "productivity", icon: "⚡" },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
      {categories.map((category) => (
        <Link key={category.slug} href={`/${locale}/tools?category=${category.slug}`}>
          <Badge 
            variant="outline" 
            className="px-4 py-2 text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

type CategoryScrollBarProps = {
  locale: string;
};

export default function CategoryScrollBar({ locale }: CategoryScrollBarProps) {
  const isZh = locale === "zh";
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = isZh ? [
    { id: "all", name: "🔥 推荐", slug: "" },
    { id: "text", name: "📝 文本生成", slug: "text-generation" },
    { id: "image", name: "🎨 图像生成", slug: "image-generation" },
    { id: "video", name: "🎬 视频生成", slug: "video-generation" },
    { id: "audio", name: "🎵 音频生成", slug: "audio-generation" },
    { id: "code", name: "💻 代码助手", slug: "code-assistant" },
    { id: "chat", name: "💬 对话聊天", slug: "chatbot" },
    { id: "search", name: "🔍 AI搜索", slug: "search" },
    { id: "design", name: "🎭 设计工具", slug: "design" },
    { id: "productivity", name: "⚡ 效率工具", slug: "productivity" },
    { id: "marketing", name: "📢 营销工具", slug: "marketing" },
    { id: "data", name: "📊 数据分析", slug: "data-analysis" },
    { id: "education", name: "📚 教育学习", slug: "education" },
    { id: "translate", name: "🌐 翻译工具", slug: "translation" },
    { id: "avatar", name: "👤 虚拟人", slug: "avatar" },
    { id: "3d", name: "🎲 3D建模", slug: "3d-modeling" },
  ] : [
    { id: "all", name: "🔥 Featured", slug: "" },
    { id: "text", name: "📝 Text Generation", slug: "text-generation" },
    { id: "image", name: "🎨 Image Generation", slug: "image-generation" },
    { id: "video", name: "🎬 Video Generation", slug: "video-generation" },
    { id: "audio", name: "🎵 Audio Generation", slug: "audio-generation" },
    { id: "code", name: "💻 Code Assistant", slug: "code-assistant" },
    { id: "chat", name: "💬 Chatbot", slug: "chatbot" },
    { id: "search", name: "🔍 AI Search", slug: "search" },
    { id: "design", name: "🎭 Design Tools", slug: "design" },
    { id: "productivity", name: "⚡ Productivity", slug: "productivity" },
    { id: "marketing", name: "📢 Marketing", slug: "marketing" },
    { id: "data", name: "📊 Data Analysis", slug: "data-analysis" },
    { id: "education", name: "📚 Education", slug: "education" },
    { id: "translate", name: "🌐 Translation", slug: "translation" },
    { id: "avatar", name: "👤 Avatar", slug: "avatar" },
    { id: "3d", name: "🎲 3D Modeling", slug: "3d-modeling" },
  ];

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.slug ? `/${locale}/tools?category=${category.slug}` : `/${locale}/tools`}
              onClick={() => setActiveCategory(category.id)}
            >
              <Badge
                variant={activeCategory === category.id ? "default" : "outline"}
                className={`
                  px-4 py-2 text-sm whitespace-nowrap cursor-pointer transition-all
                  ${activeCategory === category.id 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "hover:bg-blue-50 hover:border-blue-300"
                  }
                `}
              >
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
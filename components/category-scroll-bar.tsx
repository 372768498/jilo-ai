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

  // 与工具列表页完全对应的分类
  const categories = isZh ? [
    { id: "all", name: "🔥 推荐", category: "" },
    { id: "writing", name: "📝 文本生成", category: "Writing" },
    { id: "image", name: "🎨 图像生成", category: "Image Generation" },
    { id: "video", name: "🎬 视频生成", category: "Video" },
    { id: "audio", name: "🎵 音频生成", category: "Audio" },
    { id: "code", name: "💻 代码助手", category: "Developer Tools" },
    { id: "chat", name: "💬 对话聊天", category: "Chatbot" },
    { id: "productivity", name: "📊 办公工具", category: "Productivity" },
    { id: "marketing", name: "📢 营销工具", category: "Marketing" },
  ] : [
    { id: "all", name: "🔥 Featured", category: "" },
    { id: "writing", name: "📝 Writing", category: "Writing" },
    { id: "image", name: "🎨 Image Generation", category: "Image Generation" },
    { id: "video", name: "🎬 Video", category: "Video" },
    { id: "audio", name: "🎵 Audio", category: "Audio" },
    { id: "code", name: "💻 Developer Tools", category: "Developer Tools" },
    { id: "chat", name: "💬 Chatbot", category: "Chatbot" },
    { id: "productivity", name: "📊 Productivity", category: "Productivity" },
    { id: "marketing", name: "📢 Marketing", category: "Marketing" },
  ];

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.category ? `/${locale}/tools?category=${cat.category}` : `/${locale}/tools`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <Badge
                variant={activeCategory === cat.id ? "default" : "outline"}
                className={`
                  px-4 py-2 text-sm whitespace-nowrap cursor-pointer transition-all
                  ${activeCategory === cat.id 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "hover:bg-blue-50 hover:border-blue-300"
                  }
                `}
              >
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
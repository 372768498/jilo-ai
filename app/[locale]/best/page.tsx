import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = { params: { locale: string } };

const bestLists = [
  { slug: "best-ai-writing-tools", category: "Writing", icon: "✍️", count: 15, desc_en: "Best AI tools for content creation, blogging, and copywriting", desc_zh: "最佳AI写作工具" },
  { slug: "best-ai-coding-tools", category: "Coding", icon: "💻", count: 15, desc_en: "Best AI tools for programming, debugging, and code generation", desc_zh: "最佳AI编程工具" },
  { slug: "best-ai-design-tools", category: "Design", icon: "🎨", count: 15, desc_en: "Best AI tools for graphic design, illustration, and creative work", desc_zh: "最佳AI设计工具" },
  { slug: "best-ai-video-tools", category: "Video", icon: "🎬", count: 15, desc_en: "Best AI tools for video creation, editing, and production", desc_zh: "最佳AI视频工具" },
  { slug: "best-ai-tools-for-business", category: "Business", icon: "💼", count: 15, desc_en: "Best AI tools for business operations, analytics, and automation", desc_zh: "最佳AI商业工具" },
  { slug: "best-ai-data-analysis-tools", category: "Data Analysis", icon: "📊", count: 15, desc_en: "Best AI tools for data analysis, visualization, and insights", desc_zh: "最佳AI数据分析工具" },
  { slug: "best-ai-voice-tools", category: "Voice & Audio", icon: "🎙️", count: 15, desc_en: "Best AI tools for text-to-speech, voice cloning, and audio", desc_zh: "最佳AI语音工具" },
  { slug: "best-ai-translation-tools", category: "Translation", icon: "🌐", count: 15, desc_en: "Best AI tools for translation and localization", desc_zh: "最佳AI翻译工具" },
  { slug: "best-ai-tools-for-education", category: "Education", icon: "🎓", count: 15, desc_en: "Best AI tools for learning, teaching, and education", desc_zh: "最佳AI教育工具" },
  { slug: "best-free-ai-tools", category: "Free Tools", icon: "🆓", count: 20, desc_en: "Best free AI tools — no credit card required", desc_zh: "最佳免费AI工具" },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params.locale === 'zh';
  return {
    title: isZh ? '最佳AI工具推荐' : 'Best AI Tools by Category',
    description: isZh
      ? '按类别发现最佳AI工具。写作、编程、设计、视频等领域的专业推荐和评测。'
      : 'Discover the best AI tools by category. Expert recommendations and reviews for writing, coding, design, video and more.',
  };
}

export default function BestToolsListPage({ params }: PageProps) {
  const isZh = params.locale === 'zh';
  return (
    <div className="min-h-screen bg-background">
      <Navbar locale={params.locale} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {isZh ? '🏆 最佳AI工具推荐' : '🏆 Best AI Tools by Category'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isZh
              ? '按使用场景找到最适合你的AI工具。每个推荐都基于专业评测。'
              : 'Find the perfect AI tool for your use case. Every recommendation is based on expert testing and review.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestLists.map((list) => (
            <Link key={list.slug} href={`/${params.locale}/best/${list.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{list.icon}</span>
                    <Badge variant="secondary">{list.category}</Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {isZh ? `最佳AI${list.category}工具` : `Best AI ${list.category} Tools`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {isZh ? list.desc_zh : list.desc_en}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{list.count} tools reviewed</span>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer locale={params.locale} />
    </div>
  );
}

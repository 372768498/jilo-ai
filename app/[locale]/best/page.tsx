import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = { params: { locale: string } };

const bestLists = [
  { slug: "best-ai-writing-tools", category: "Writing", category_zh: "写作", icon: "✍️", count: 15, title_zh: "最佳AI写作工具推荐", desc_en: "Best AI tools for content creation, blogging, and copywriting", desc_zh: "精选15款AI写作工具，覆盖文章创作、博客写作、营销文案，助你高效产出优质内容" },
  { slug: "best-ai-coding-tools", category: "Coding", category_zh: "编程", icon: "💻", count: 15, title_zh: "最佳AI编程工具推荐", desc_en: "Best AI tools for programming, debugging, and code generation", desc_zh: "15款AI编程神器，代码生成、智能调试、自动补全，开发效率提升10倍" },
  { slug: "best-ai-design-tools", category: "Design", category_zh: "设计", icon: "🎨", count: 15, title_zh: "最佳AI设计工具推荐", desc_en: "Best AI tools for graphic design, illustration, and creative work", desc_zh: "15款AI设计工具，平面设计、插画创作、创意生成，设计师必备" },
  { slug: "best-ai-video-tools", category: "Video", category_zh: "视频", icon: "🎬", count: 15, title_zh: "最佳AI视频工具推荐", desc_en: "Best AI tools for video creation, editing, and production", desc_zh: "15款AI视频工具，视频生成、智能剪辑、特效制作，短视频创作者必看" },
  { slug: "best-ai-tools-for-business", category: "Business", category_zh: "商务", icon: "💼", count: 15, title_zh: "最佳AI商务工具推荐", desc_en: "Best AI tools for business operations, analytics, and automation", desc_zh: "15款AI商务工具，运营分析、流程自动化、数据洞察，企业降本增效" },
  { slug: "best-ai-data-analysis-tools", category: "Data Analysis", category_zh: "数据分析", icon: "📊", count: 15, title_zh: "最佳AI数据分析工具推荐", desc_en: "Best AI tools for data analysis, visualization, and insights", desc_zh: "15款AI数据分析工具，智能分析、可视化图表、趋势洞察，数据驱动决策" },
  { slug: "best-ai-voice-tools", category: "Voice & Audio", category_zh: "语音", icon: "🎙️", count: 15, title_zh: "最佳AI语音工具推荐", desc_en: "Best AI tools for text-to-speech, voice cloning, and audio", desc_zh: "15款AI语音工具，文字转语音、声音克隆、音频处理，播客和配音首选" },
  { slug: "best-ai-translation-tools", category: "Translation", category_zh: "翻译", icon: "🌐", count: 15, title_zh: "最佳AI翻译工具推荐", desc_en: "Best AI tools for translation and localization", desc_zh: "15款AI翻译工具，多语言翻译、本地化适配，跨语言沟通无障碍" },
  { slug: "best-ai-tools-for-education", category: "Education", category_zh: "教育", icon: "🎓", count: 15, title_zh: "最佳AI教育工具推荐", desc_en: "Best AI tools for learning, teaching, and education", desc_zh: "15款AI教育工具，智能辅导、个性化学习、教学辅助，学习效率翻倍" },
  { slug: "best-free-ai-tools", category: "Free Tools", category_zh: "免费工具", icon: "🆓", count: 20, title_zh: "最佳免费AI工具推荐", desc_en: "Best free AI tools — no credit card required", desc_zh: "20款完全免费的AI工具，无需注册信用卡，零成本体验AI的强大能力" },
  { slug: "best-ai-chatbots", category: "Chatbots", category_zh: "聊天机器人", icon: "💬", count: 15, title_zh: "最佳AI聊天机器人推荐", desc_en: "Best AI chatbots for conversation and assistance", desc_zh: "15款AI聊天机器人，智能对话、知识问答、日常助手，找到最适合你的AI伙伴" },
  { slug: "best-ai-image-generators", category: "Image Generation", category_zh: "图像生成", icon: "🖼️", count: 15, title_zh: "最佳AI图像生成工具推荐", desc_en: "Best AI image generators for art and design", desc_zh: "15款AI图像生成器，文字生图、风格转换、创意设计，让想象变成现实" },
  { slug: "best-ai-marketing-tools", category: "Marketing", category_zh: "营销", icon: "📢", count: 15, title_zh: "最佳AI营销工具推荐", desc_en: "Best AI tools for marketing and growth", desc_zh: "15款AI营销工具，内容营销、广告优化、用户增长，营销人必备" },
  { slug: "best-ai-productivity-tools", category: "Productivity", category_zh: "效率", icon: "⚡", count: 15, title_zh: "最佳AI效率工具推荐", desc_en: "Best AI tools to boost your workflow", desc_zh: "15款AI效率工具，自动化办公、智能排期、任务管理，工作效率飙升" },
  { slug: "best-ai-search-engines", category: "Search", category_zh: "搜索", icon: "🔍", count: 10, title_zh: "最佳AI搜索引擎推荐", desc_en: "Best AI-powered search engines", desc_zh: "10款AI搜索引擎，智能问答、深度搜索、信息整合，告别传统搜索" },
  { slug: "best-ai-presentation-tools", category: "Presentations", category_zh: "演示", icon: "📊", count: 10, title_zh: "最佳AI演示工具推荐", desc_en: "Best AI tools for presentations", desc_zh: "10款AI演示工具，自动生成PPT、智能排版、动画特效，轻松做出专业演示" },
  { slug: "best-ai-music-generators", category: "Music", category_zh: "音乐", icon: "🎵", count: 10, title_zh: "最佳AI音乐生成工具推荐", desc_en: "Best AI music generation tools", desc_zh: "10款AI音乐工具，AI作曲、编曲、配乐，零基础也能创作音乐" },
  { slug: "best-ai-meeting-assistants", category: "Meetings", category_zh: "会议", icon: "🤝", count: 10, title_zh: "最佳AI会议助手推荐", desc_en: "Best AI meeting assistants and note-takers", desc_zh: "10款AI会议助手，智能记录、自动摘要、待办提取，告别会议纪要烦恼" },
  { slug: "best-ai-tools-for-startups", category: "Startups", category_zh: "创业", icon: "🚀", count: 15, title_zh: "创业团队必备AI工具推荐", desc_en: "Essential AI tools for startups", desc_zh: "15款创业必备AI工具，产品开发、市场营销、运营管理，小团队也能高效运转" },
  { slug: "best-ai-tools-for-developers", category: "Developers", category_zh: "开发者", icon: "👨‍💻", count: 15, title_zh: "开发者必备AI工具推荐", desc_en: "Best AI tools for software developers", desc_zh: "15款开发者AI工具，代码补全、自动测试、文档生成，程序员效率工具箱" },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isZh = params.locale === 'zh';
  return {
    title: isZh ? '2025最佳AI工具推荐 | 20大类别精选榜单 - Jilo.ai' : 'Best AI Tools by Category | 2025 Curated Lists - Jilo.ai',
    description: isZh
      ? '按20大使用场景精选最佳AI工具，涵盖写作、编程、设计、视频、商务等领域。每款工具经专业评测，帮你快速找到最适合的AI神器。'
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
              ? '20大使用场景，数百款AI工具深度评测。不管你是写作、编程还是做设计，这里都有最适合你的AI神器。'
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
                    <Badge variant="secondary">{isZh ? list.category_zh : list.category}</Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {isZh ? list.title_zh : `Best AI ${list.category} Tools`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {isZh ? list.desc_zh : list.desc_en}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{list.count} {isZh ? '款工具已评测' : 'tools reviewed'}</span>
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

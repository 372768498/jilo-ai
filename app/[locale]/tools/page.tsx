import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = {
  params: { locale: string };
  searchParams: { category?: string };
};

export default async function ToolsListPage({ params, searchParams }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";
  const category = searchParams?.category;

  // 获取所有工具 - 修复查询
  const { data: toolsList, error } = await supabase
    .from("tools_simple")
    .select("*")
    .order("name", { ascending: true });

  // 调试：打印数据
  console.log("Tools count:", toolsList?.length);
  console.log("Error:", error);

  const t = isZh ? {
    page_title: "人工智能工具",
    total_tools: `${toolsList?.length || 0} 个结果`,
    all_tools: "全部工具",
    filter: "筛选",
    pricing: "定价",
    language: "语言",
    platforms: "平台",
    free: "免费",
    freemium: "免费增值",
    paid: "付费",
    open_source: "开源",
    visit: "访问官网",
    added_on: "最近更新："
  } : {
    page_title: "AI Tools",
    total_tools: `${toolsList?.length || 0} results`,
    all_tools: "All Tools",
    filter: "Filter",
    pricing: "PRICING",
    language: "LANGUAGE",
    platforms: "PLATFORMS",
    free: "free",
    freemium: "freemium",
    paid: "paid",
    open_source: "Open-source",
    visit: "Visit Website",
    added_on: "Added: "
  };

  return (
    <>
      <Navbar locale={locale} />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t.total_tools}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              {t.page_title}
            </h1>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
                {t.pricing}
              </Badge>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {t.free}
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {t.freemium}
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {t.paid}
              </Button>
              
              <div className="w-px h-6 bg-slate-300 mx-2" />
              
              <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
                {t.platforms}
              </Badge>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                web
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                chrome
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                ios
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                android
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                vscode
              </Button>
              
              <div className="w-px h-6 bg-slate-300 mx-2" />
              
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {t.open_source}
              </Button>
              
              <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 ml-auto">
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* 工具网格 */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {toolsList?.map((tool, index) => (
              <Card key={tool.id} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-300 overflow-hidden">
                {/* 卡片头部 - 渐变背景 */}
                <div className="relative h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                  
                  {/* Logo */}
                  <div className="absolute -bottom-8 left-6">
                    {tool.logo_url ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white group-hover:scale-110 transition-transform">
                        <img 
                          src={tool.logo_url} 
                          alt={tool.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl group-hover:scale-110 transition-transform">
                        {tool.name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* 定价标签 */}
                  {tool.pricing && (
                    <Badge className="absolute top-3 right-3 bg-white/95 text-slate-900 shadow-lg capitalize">
                      {tool.pricing}
                    </Badge>
                  )}
                </div>

                {/* 卡片内容 */}
                <CardHeader className="pt-12 pb-3">
                  <CardTitle className="text-xl group-hover:text-blue-600 transition line-clamp-1">
                    <Link href={`/${locale}/tools/${tool.slug}`}>
                      {tool.name}
                    </Link>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* 简介 */}
                  {tool.short_desc && (
                    <CardDescription className="text-sm line-clamp-2 min-h-[2.5rem]">
                      {tool.short_desc}
                    </CardDescription>
                  )}

                  {/* 平台标签 */}
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(tool.platforms) && tool.platforms.slice(0, 4).map((platform: string) => (
                      <Badge key={platform} variant="secondary" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                    {Array.isArray(tool.platforms) && tool.platforms.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{tool.platforms.length - 4}
                      </Badge>
                    )}
                  </div>

                  {/* 按钮组 */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" className="flex-1 group/btn">
                      <Link href={`/${locale}/tools/${tool.slug}`}>
                        {isZh ? "查看详情" : "View Details"}
                      </Link>
                    </Button>
                    {tool.website_url && (
                      <Button asChild size="sm" variant="outline" className="group/link">
                        <a 
                          href={tool.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 如果没有工具 */}
          {(!toolsList || toolsList.length === 0) && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-slate-600 text-lg">
                {isZh ? "暂无工具" : "No tools found"}
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer locale={locale} />
    </>
  );
}
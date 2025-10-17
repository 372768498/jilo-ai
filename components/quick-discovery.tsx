import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Award, DollarSign, Zap, Star, Clock, Gift } from "lucide-react";

type QuickDiscoveryProps = {
  locale: string;
  newest: any[];
  popular: any[];
  featured: any[];
  free: any[];
  trending: any[];
  updated: any[];
  community: any[];
  special: any[];
};

export default function QuickDiscovery({ 
  locale, newest, popular, featured, free, trending, updated, community, special 
}: QuickDiscoveryProps) {
  const isZh = locale === "zh";

  // 获取本地化名称
  const getToolName = (tool: any) => isZh ? (tool.name_zh || tool.name_en) : tool.name_en;

  const sections = [
    {
      title: isZh ? "最新收录" : "Newest",
      icon: <Sparkles className="w-4 h-4 text-blue-600" />,
      tools: newest,
      color: "border-blue-200 hover:border-blue-400 bg-blue-50/30"
    },
    {
      title: isZh ? "本月最火" : "Most Popular",
      icon: <TrendingUp className="w-4 h-4 text-red-600" />,
      tools: popular,
      color: "border-red-200 hover:border-red-400 bg-red-50/30"
    },
    {
      title: isZh ? "编辑推荐" : "Editor's Pick",
      icon: <Award className="w-4 h-4 text-purple-600" />,
      tools: featured,
      color: "border-purple-200 hover:border-purple-400 bg-purple-50/30"
    },
    {
      title: isZh ? "完全免费" : "Free Tools",
      icon: <DollarSign className="w-4 h-4 text-green-600" />,
      tools: free,
      color: "border-green-200 hover:border-green-400 bg-green-50/30"
    },
    {
      title: isZh ? "热门趋势" : "Trending",
      icon: <Zap className="w-4 h-4 text-yellow-600" />,
      tools: trending,
      color: "border-yellow-200 hover:border-yellow-400 bg-yellow-50/30"
    },
    {
      title: isZh ? "最近更新" : "Recently Updated",
      icon: <Clock className="w-4 h-4 text-indigo-600" />,
      tools: updated,
      color: "border-indigo-200 hover:border-indigo-400 bg-indigo-50/30"
    },
    {
      title: isZh ? "社区推荐" : "Community Picks",
      icon: <Star className="w-4 h-4 text-pink-600" />,
      tools: community,
      color: "border-pink-200 hover:border-pink-400 bg-pink-50/30"
    },
    {
      title: isZh ? "限时优惠" : "Special Offers",
      icon: <Gift className="w-4 h-4 text-orange-600" />,
      tools: special,
      color: "border-orange-200 hover:border-orange-400 bg-orange-50/30"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isZh ? "⚡ 快速发现" : "⚡ Quick Discovery"}
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sections.map((section) => (
          <Card key={section.title} className={`border-2 transition-all ${section.color}`}>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                {section.icon}
                <span className="truncate">{section.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3">
              {section.tools.slice(0, 3).map((tool) => (
                <Link
                  key={tool.id}
                  href={`/${locale}/tools/${tool.slug}`}
                  className="block group"
                >
                  <div className="flex items-center gap-2">
                    {tool.logo_url ? (
                      <img 
                        src={tool.logo_url} 
                        alt={getToolName(tool)} 
                        className="w-7 h-7 rounded object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-semibold">
                        {getToolName(tool)?.charAt(0)}
                      </div>
                    )}
                    <p className="text-xs font-medium truncate group-hover:text-blue-600 transition flex-1">
                      {getToolName(tool)}
                    </p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
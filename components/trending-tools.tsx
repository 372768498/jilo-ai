import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

type TrendingToolsProps = {
  locale: string;
  tools: any[];
};

export default function TrendingTools({ locale, tools }: TrendingToolsProps) {
  const isZh = locale === "zh";

  // 获取本地化名称和描述
  const getToolName = (tool: any) => isZh ? (tool.name_zh || tool.name_en) : tool.name_en;
  const getToolDesc = (tool: any) => isZh ? (tool.tagline_zh || tool.tagline_en) : tool.tagline_en;

  return (
    <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-bold">
            {isZh ? "🔥 今日热门" : "🔥 Trending Today"}
          </h2>
        </div>
        
        {/* 2行，每行8个，固定宽度，可横向滚动 */}
        <div className="space-y-3">
          {/* 第一行 */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {tools.slice(0, 8).map((tool) => (
              <Link
                key={tool.id}
                href={`/${locale}/tools/${tool.slug}`}
                className="flex-shrink-0 w-56"
              >
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-0.5 border hover:border-orange-300">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      {tool.logo_url ? (
                        <img 
                          src={tool.logo_url} 
                          alt={getToolName(tool)} 
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {getToolName(tool)?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                          {getToolName(tool)}
                        </h3>
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
                    </div>
                    {getToolDesc(tool) && (
                      <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                        {getToolDesc(tool)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {/* 第二行 */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {tools.slice(8, 16).map((tool) => (
              <Link
                key={tool.id}
                href={`/${locale}/tools/${tool.slug}`}
                className="flex-shrink-0 w-56"
              >
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-0.5 border hover:border-orange-300">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      {tool.logo_url ? (
                        <img 
                          src={tool.logo_url} 
                          alt={getToolName(tool)} 
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {getToolName(tool)?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                          {getToolName(tool)}
                        </h3>
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
                    </div>
                    {getToolDesc(tool) && (
                      <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                        {getToolDesc(tool)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
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

  return (
    <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-bold">
            {isZh ? "🔥 今日热门" : "🔥 Trending Today"}
          </h2>
        </div>
        
        {/* 2行，每行8个，可横向滚动 */}
        <div className="space-y-3">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {tools.slice(0, 8).map((tool) => (
              <Link
                key={tool.id}
                href={`/${locale}/tools/${tool.slug}`}
                className="flex-shrink-0"
              >
                <Card className="w-48 hover:shadow-lg transition-all hover:-translate-y-0.5 border hover:border-orange-300">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {tool.logo_url ? (
                        <img 
                          src={tool.logo_url} 
                          alt={tool.name} 
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {tool.name?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs truncate">{tool.name}</h3>
                        {tool.pricing && (
                          <Badge variant="secondary" className="text-xs mt-0.5">
                            {tool.pricing}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {tool.short_desc && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {tool.short_desc}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {tools.slice(8, 16).map((tool) => (
              <Link
                key={tool.id}
                href={`/${locale}/tools/${tool.slug}`}
                className="flex-shrink-0"
              >
                <Card className="w-48 hover:shadow-lg transition-all hover:-translate-y-0.5 border hover:border-orange-300">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {tool.logo_url ? (
                        <img 
                          src={tool.logo_url} 
                          alt={tool.name} 
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {tool.name?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs truncate">{tool.name}</h3>
                        {tool.pricing && (
                          <Badge variant="secondary" className="text-xs mt-0.5">
                            {tool.pricing}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {tool.short_desc && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {tool.short_desc}
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
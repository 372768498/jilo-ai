import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type AdSlotProps = {
  type: "sidebar" | "banner";
  height?: string;
  locale?: string;
};

export default function AdSlot({ type, height, locale }: AdSlotProps) {
  const isZh = locale === "zh";
  const communityHref = `/api/out?target=skool-community&source=ad_slot_${type}&locale=${encodeURIComponent(locale || "en")}`;
  
  if (type === "sidebar") {
    return (
      <Card className="hidden lg:block border-2 bg-gradient-to-br from-purple-50 to-blue-50 h-[600px] sticky top-24 overflow-hidden">
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl mb-4">🎓</div>
          <h3 className="text-xl font-bold mb-2 text-slate-900">
            {isZh ? "加入 AI 学习社区" : "Join AI Learning Community"}
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            {isZh 
              ? "与 1000+ AI 爱好者一起学习和成长" 
              : "Learn and grow with 1000+ AI enthusiasts"}
          </p>
          <Button asChild size="lg" className="rounded-full shadow-lg">
            <Link 
              href={communityHref}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
            >
              {isZh ? "立即加入" : "Join Now"} →
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 hover:shadow-lg transition-all">
      <Link 
        href={communityHref}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        className="block"
      >
        <div className={`${height || "h-32"} flex items-center justify-center gap-6 px-6`}>
          <div className="text-4xl">🎓</div>
          <div className="flex-1 text-left">
            <h3 className="font-bold text-lg mb-1">
              {isZh ? "🚀 加入 AI 学习社区" : "🚀 Join AI Learning Community"}
            </h3>
            <p className="text-sm text-slate-600">
              {isZh 
                ? "与全球 AI 爱好者交流学习，获取最新资讯和教程" 
                : "Connect with global AI enthusiasts, get latest insights and tutorials"}
            </p>
          </div>
          <Button size="lg" className="rounded-full flex-shrink-0">
            {isZh ? "立即加入" : "Join Now"} →
          </Button>
        </div>
      </Link>
    </Card>
  );
}

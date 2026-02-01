import type { Metadata } from "next";

type LayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const isZh = params?.locale === "zh";
  const locale = params?.locale || "en";
  const altLocale = isZh ? "en" : "zh";

  return {
    title: isZh
      ? "AI工具深度评测与对比 - 专业测评分析"
      : "AI Tool Reviews & Comparisons - Expert Analysis",
    description: isZh
      ? "专业的AI工具深度评测、横向对比和使用指南。帮你选出最适合的AI工具，节省时间和金钱。"
      : "Expert AI tool reviews, head-to-head comparisons, and buying guides. Find the perfect AI tool for your needs.",
    openGraph: {
      title: isZh ? "AI工具深度评测 | Jilo.ai" : "AI Tool Reviews | Jilo.ai",
      url: `https://jilo.ai/${locale}/reviews`,
      images: [{
        url: `https://jilo.ai/api/og?title=${encodeURIComponent(isZh ? 'AI工具深度评测与对比' : 'AI Tool Reviews & Comparisons')}&subtitle=${encodeURIComponent(isZh ? '30+ 专业评测文章' : '30+ Expert Reviews')}`,
        width: 1200,
        height: 630,
      }],
    },
    alternates: {
      canonical: `https://jilo.ai/${locale}/reviews`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/reviews`,
        [altLocale]: `https://jilo.ai/${altLocale}/reviews`,
      },
    },
  };
}

export default function ReviewsLayout({ children }: LayoutProps) {
  return <>{children}</>;
}

import type { Metadata } from "next";

type LayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const isZh = params?.locale === 'zh';
  
  return {
    title: {
      template: isZh 
        ? '%s | Jilo.ai 工具对比' 
        : '%s | Jilo.ai Tool Comparison',
      default: isZh 
        ? 'AI 工具对比 | Jilo.ai'
        : 'AI Tool Comparison | Jilo.ai',
    },
    description: isZh
      ? '专业的AI工具对比分析，帮您找到最适合的工具。深度对比功能、价格、使用场景等关键维度。'
      : 'Professional AI tool comparisons to help you find the perfect fit. Compare features, pricing, use cases and more.',
    openGraph: {
      type: 'website',
      siteName: 'Jilo.ai',
    },
    robots: 'index,follow',
  };
}

export default function CompareLayout({ children }: LayoutProps) {
  return (
    <>
      {children}
    </>
  );
}
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
        ? '%s | Jilo.ai 工具替代方案' 
        : '%s | Jilo.ai Tool Alternatives',
      default: isZh 
        ? 'AI 工具替代方案 | Jilo.ai'
        : 'AI Tool Alternatives | Jilo.ai',
    },
    description: isZh
      ? '发现最佳AI工具替代方案。免费和付费选项对比，帮您找到性价比最高的解决方案。'
      : 'Discover the best AI tool alternatives. Compare free and paid options to find the most cost-effective solutions.',
    openGraph: {
      type: 'website',
      siteName: 'Jilo.ai',
    },
    robots: 'index,follow',
  };
}

export default function AlternativesLayout({ children }: LayoutProps) {
  return <>{children}</>;
}

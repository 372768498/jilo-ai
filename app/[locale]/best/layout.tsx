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
        ? '%s | Jilo.ai 最佳AI工具' 
        : '%s | Jilo.ai Best AI Tools',
      default: isZh 
        ? '最佳AI工具推荐 | Jilo.ai'
        : 'Best AI Tools | Jilo.ai',
    },
    description: isZh
      ? '按类别发现最佳AI工具。写作、编程、设计、视频等领域的专业推荐。'
      : 'Discover the best AI tools by category. Expert recommendations for writing, coding, design, video and more.',
    openGraph: {
      type: 'website',
      siteName: 'Jilo.ai',
    },
    robots: 'index,follow',
  };
}

export default function BestToolsLayout({ children }: LayoutProps) {
  return <>{children}</>;
}

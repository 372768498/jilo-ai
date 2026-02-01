import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://jilo.ai'),
  title: {
    default: 'Jilo.ai - Discover & Compare AI Tools | AI工具导航',
    template: '%s | Jilo.ai',
  },
  description: 'Discover, compare and review the best AI tools. In-depth reviews, side-by-side comparisons, and expert ratings. 发现、对比和评测最佳AI工具。',
  keywords: ['AI tools', 'AI directory', 'AI reviews', 'AI comparison', 'AI工具', 'AI导航', 'AI评测', 'AI对比'],
  authors: [{ name: 'Jilo.ai' }],
  creator: 'Jilo.ai',
  publisher: 'Jilo.ai',
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Jilo.ai',
    title: 'Jilo.ai - Discover & Compare AI Tools',
    description: 'Discover, compare and review the best AI tools with in-depth analysis and expert ratings.',
    url: 'https://jilo.ai',
    locale: 'en_US',
    alternateLocale: 'zh_CN',
    images: [
      {
        url: 'https://jilo.ai/api/og?title=Jilo.ai%20-%20Discover%20%26%20Compare%20AI%20Tools&subtitle=70%2B%20AI%20Tools%20%7C%20Expert%20Reviews',
        width: 1200,
        height: 630,
        alt: 'Jilo.ai - AI Tools Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jilo.ai - Discover & Compare AI Tools',
    description: 'Discover, compare and review the best AI tools with in-depth analysis.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://jilo.ai',
    languages: {
      'en': 'https://jilo.ai/en',
      'zh': 'https://jilo.ai/zh',
    },
  },
  verification: {
    google: 'ahpBice1a76GPx4bBdBnoSo0sWs8sNXo_iX-O1S3OxM',
    other: {
      'impact-site': '8b17145f-f60a-47b8-8ce5-c00d8dcf8092',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const baiduId = process.env.NEXT_PUBLIC_BAIDU_TONGJI;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
              }}
            />
          </>
        )}
        {/* 百度统计 */}
        {baiduId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `var _hmt=_hmt||[];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?${baiduId}";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s);})();`,
            }}
          />
        )}
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

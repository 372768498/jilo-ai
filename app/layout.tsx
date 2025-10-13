import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jilo.ai - Discover AI Tools',
  description: 'Explore AI tools directory',
  verification: {
    other: {
      'impact-site': '8b17145f-f60a-47b8-8ce5-c00d8dcf8092'  // ✅ 更新为新的验证码
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
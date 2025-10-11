import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jilo.ai - Discover AI Tools',
  description: 'Explore AI tools directory',
  verification: {
    other: {
      'impact-site': '076460b0-888b-4aa2-82d7-b54402456720'
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
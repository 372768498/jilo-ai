"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type NavbarProps = {
  locale: string;
};

export default function Navbar({ locale }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isZh = locale === "zh";

  const navigation = isZh ? [
    { name: "首页", href: `/${locale}` },
    { name: "AI 工具", href: `/${locale}/tools` },
    { name: "AI 新闻", href: `/${locale}/news` },
    { name: "提交工具", href: "/submit" },
  ] : [
    { name: "Home", href: `/${locale}` },
    { name: "AI Tools", href: `/${locale}/tools` },
    { name: "AI News", href: `/${locale}/news` },
    { name: "Submit", href: "/submit" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              J
            </div>
            <span className="text-xl font-bold">Jilo.ai</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
            
            {/* Language Switcher */}
            <div className="flex gap-2">
              <Link
                href="/en"
                className={`px-3 py-1 rounded-md text-sm ${locale === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                EN
              </Link>
              <Link
                href="/zh"
                className={`px-3 py-1 rounded-md text-sm ${locale === "zh" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                中文
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-slate-600 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/en" className={`px-3 py-1 rounded-md text-sm ${locale === "en" ? "bg-slate-900 text-white" : "text-slate-600"}`}>
                EN
              </Link>
              <Link href="/zh" className={`px-3 py-1 rounded-md text-sm ${locale === "zh" ? "bg-slate-900 text-white" : "text-slate-600"}`}>
                中文
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Menu, Search, X } from "lucide-react";

type NavbarProps = {
  locale: string;
};

export default function Navbar({ locale }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const isZh = locale === "zh";

  // Global search → the /tools results page (server-side search by ?q=).
  // Fixes the audit finding that search was trapped on the homepage only.
  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    router.push(`/${locale}/tools${term ? `?q=${encodeURIComponent(term)}` : ""}`);
    setMobileMenuOpen(false);
  };

  const navigation = isZh
    ? [
        { name: "分类", href: `/${locale}/categories` },
        { name: "工具库", href: `/${locale}/tools` },
        { name: "AI Access", href: `/${locale}/access` },
        { name: "工作流", href: `/${locale}/workflows` },
        { name: "Radar", href: `/${locale}/radar` },
        { name: "评测", href: `/${locale}/reviews` },
      ]
    : [
        { name: "Categories", href: `/${locale}/categories` },
        { name: "Tools", href: `/${locale}/tools` },
        { name: "AI Access", href: `/${locale}/access` },
        { name: "Workflows", href: `/${locale}/workflows` },
        { name: "Radar", href: `/${locale}/radar` },
        { name: "Reviews", href: `/${locale}/reviews` },
      ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2" aria-label="Jilo.ai home">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
            J
          </div>
          <div>
            <div className="text-lg font-bold leading-none text-slate-950">Jilo.ai</div>
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              AI Intelligence
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <form onSubmit={submitSearch} className="relative mr-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isZh ? "搜索工具…" : "Search tools…"}
              aria-label={isZh ? "搜索工具" : "Search tools"}
              className="h-9 w-44 rounded-full border bg-slate-50 pl-9 pr-3 text-sm focus:w-56 focus:border-slate-300 focus:bg-white focus:outline-none transition-all"
            />
          </form>
          <Link
            href="/en"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              locale === "en" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            EN
          </Link>
          <Link
            href="/zh"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              locale === "zh" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            中文
          </Link>
          <Link
            href={`/${locale}/submit`}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {isZh ? "提交工具" : "Submit"}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t bg-white lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            <form onSubmit={submitSearch} className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isZh ? "搜索工具…" : "Search tools…"}
                aria-label={isZh ? "搜索工具" : "Search tools"}
                className="h-10 w-full rounded-full border bg-slate-50 pl-9 pr-3 text-sm focus:outline-none"
              />
            </form>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href={`/${locale}/submit`}
              className="block rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              {isZh ? "提交工具" : "Submit Tool"}
            </Link>
            <div className="flex gap-2 px-3 pt-3">
              <Link href="/en" className={`rounded-md px-3 py-1 text-sm ${locale === "en" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>
                EN
              </Link>
              <Link href="/zh" className={`rounded-md px-3 py-1 text-sm ${locale === "zh" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>
                中文
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

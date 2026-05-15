import Link from "next/link";

type FooterProps = {
  locale: string;
};

export default function Footer({ locale }: FooterProps) {
  const isZh = locale === "zh";

  const columns = isZh
    ? [
        {
          title: "产品",
          links: [
            { name: "AI 工具库", href: `/${locale}/tools` },
            { name: "AI Access", href: `/${locale}/access` },
            { name: "AI 工作流", href: `/${locale}/workflows` },
            { name: "AI Radar", href: `/${locale}/radar` },
          ],
        },
        {
          title: "增长",
          links: [
            { name: "Deals", href: `/${locale}/deals` },
            { name: "评测", href: `/${locale}/reviews` },
            { name: "AI 新闻", href: `/${locale}/news` },
            { name: "提交工具", href: `/${locale}/submit` },
          ],
        },
        {
          title: "高意图分类",
          links: [
            { name: "写作工具", href: `/${locale}/tools?category=Writing` },
            { name: "图像生成", href: `/${locale}/tools?category=Image%20Generation` },
            { name: "开发工具", href: `/${locale}/tools?category=Developer%20Tools` },
            { name: "营销工具", href: `/${locale}/tools?category=Marketing` },
          ],
        },
      ]
    : [
        {
          title: "Product",
          links: [
            { name: "AI Tools", href: `/${locale}/tools` },
            { name: "AI Access", href: `/${locale}/access` },
            { name: "Workflows", href: `/${locale}/workflows` },
            { name: "AI Radar", href: `/${locale}/radar` },
          ],
        },
        {
          title: "Growth",
          links: [
            { name: "Deals", href: `/${locale}/deals` },
            { name: "Reviews", href: `/${locale}/reviews` },
            { name: "AI News", href: `/${locale}/news` },
            { name: "Submit Tool", href: `/${locale}/submit` },
          ],
        },
        {
          title: "High-Intent Categories",
          links: [
            { name: "Writing Tools", href: `/${locale}/tools?category=Writing` },
            { name: "Image Generation", href: `/${locale}/tools?category=Image%20Generation` },
            { name: "Developer Tools", href: `/${locale}/tools?category=Developer%20Tools` },
            { name: "Marketing Tools", href: `/${locale}/tools?category=Marketing` },
          ],
        },
      ];

  return (
    <footer className="border-t bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-bold text-slate-950">
              J
            </div>
            <div>
              <div className="text-lg font-bold leading-none">Jilo.ai</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                AI Intelligence
              </div>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-300">
            {isZh
              ? "帮普通用户筛选、理解并真正用上 AI 工具。英文线做高意图 SEO 和 affiliate，中文线解决访问、订阅和工作流落地。"
              : "AI tool intelligence for people who need practical decisions, workflows, access guidance, and trustworthy reviews."}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-sm font-semibold text-white">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-slate-400 hover:text-white">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Jilo.ai. {isZh ? "保留所有权利。" : "All rights reserved."}
      </div>
    </footer>
  );
}

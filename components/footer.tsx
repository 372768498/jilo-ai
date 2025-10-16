import Link from "next/link";

type FooterProps = {
  locale: string;
};

export default function Footer({ locale }: FooterProps) {
  const isZh = locale === "zh";

  const sections = isZh ? {
    tools: {
      title: "AI 工具分类",
      links: [
        { name: "AI 写作工具", href: `/${locale}/tools?category=writing` },
        { name: "AI 图像生成", href: `/${locale}/tools?category=image` },
        { name: "AI 视频工具", href: `/${locale}/tools?category=video` },
        { name: "AI 编程助手", href: `/${locale}/tools?category=coding` },
        { name: "AI 聊天机器人", href: `/${locale}/tools?category=chatbot` },
        { name: "AI 音频工具", href: `/${locale}/tools?category=audio` },
      ]
    },
    resources: {
      title: "资源",
      links: [
        { name: "AI 新闻", href: `/${locale}/news` },
        { name: "提交工具", href: "/submit" },
        { name: "周刊", href: "/weekly" },
        { name: "比较工具", href: "/compare" },
      ]
    },
    about: {
      title: "关于",
      links: [
        { name: "关于我们", href: "/about" },
        { name: "联系我们", href: "/contact" },
        { name: "隐私政策", href: "/privacy" },
        { name: "服务条款", href: "/terms" },
      ]
    }
  } : {
    tools: {
      title: "AI Tool Categories",
      links: [
        { name: "AI Writing Tools", href: `/${locale}/tools?category=writing` },
        { name: "AI Image Generation", href: `/${locale}/tools?category=image` },
        { name: "AI Video Tools", href: `/${locale}/tools?category=video` },
        { name: "AI Coding Assistant", href: `/${locale}/tools?category=coding` },
        { name: "AI Chatbots", href: `/${locale}/tools?category=chatbot` },
        { name: "AI Audio Tools", href: `/${locale}/tools?category=audio` },
      ]
    },
    resources: {
      title: "Resources",
      links: [
        { name: "AI News", href: `/${locale}/news` },
        { name: "Submit Tool", href: "/submit" },
        { name: "Weekly", href: "/weekly" },
        { name: "Compare Tools", href: "/compare" },
      ]
    },
    about: {
      title: "About",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
      ]
    }
  };

  return (
    <footer className="bg-slate-50 border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                J
              </div>
              <span className="text-xl font-bold">Jilo.ai</span>
            </div>
            <p className="text-sm text-slate-600">
              {isZh 
                ? "发现最好的 AI 工具，提升您的工作效率" 
                : "Discover the best AI tools to boost your productivity"}
            </p>
          </div>

          {/* Tool Categories */}
          <div>
            <h3 className="font-semibold mb-4">{sections.tools.title}</h3>
            <ul className="space-y-2">
              {sections.tools.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-slate-600 hover:text-slate-900">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">{sections.resources.title}</h3>
            <ul className="space-y-2">
              {sections.resources.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-slate-600 hover:text-slate-900">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold mb-4">{sections.about.title}</h3>
            <ul className="space-y-2">
              {sections.about.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-slate-600 hover:text-slate-900">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t text-center text-sm text-slate-600">
          <p>© {new Date().getFullYear()} Jilo.ai. {isZh ? "版权所有" : "All rights reserved"}.</p>
        </div>
      </div>
    </footer>
  );
}
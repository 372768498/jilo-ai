import Link from "next/link";
import { ArrowRight, Briefcase, Code2, GraduationCap, Megaphone, Palette, Video } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type PageProps = {
  params: { locale: string };
};

export default function WorkflowsPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";

  const workflows = isZh
    ? [
        { icon: GraduationCap, title: "学生学习工作流", desc: "搜索资料、读论文、写作业、做演示和复习计划。", href: `/${locale}/tools?category=Chatbot` },
        { icon: Briefcase, title: "办公提效工作流", desc: "会议纪要、表格分析、邮件、PPT 和知识库整理。", href: `/${locale}/tools?category=Productivity` },
        { icon: Code2, title: "开发者工作流", desc: "代码补全、代码审查、文档生成、自动化脚本和 Agent 工具。", href: `/${locale}/tools?category=Developer%20Tools` },
        { icon: Palette, title: "设计与图片工作流", desc: "灵感、文生图、修图、品牌视觉和素材生产。", href: `/${locale}/tools?category=Image%20Generation` },
        { icon: Video, title: "视频创作工作流", desc: "脚本、配音、剪辑、字幕、短视频和素材生成。", href: `/${locale}/tools?category=Video` },
        { icon: Megaphone, title: "营销增长工作流", desc: "SEO、广告文案、社媒排期、竞品分析和线索管理。", href: `/${locale}/tools?category=Marketing` },
      ]
    : [
        { icon: GraduationCap, title: "Student workflow", desc: "Research, reading, homework, slides, and study planning.", href: `/${locale}/tools?category=Chatbot` },
        { icon: Briefcase, title: "Office workflow", desc: "Meeting notes, spreadsheet analysis, email, slides, and knowledge bases.", href: `/${locale}/tools?category=Productivity` },
        { icon: Code2, title: "Developer workflow", desc: "Code assistance, review, docs, automation scripts, and agent tools.", href: `/${locale}/tools?category=Developer%20Tools` },
        { icon: Palette, title: "Design workflow", desc: "Ideation, image generation, editing, brand visuals, and assets.", href: `/${locale}/tools?category=Image%20Generation` },
        { icon: Video, title: "Video workflow", desc: "Scripts, voice, editing, subtitles, short video, and generated assets.", href: `/${locale}/tools?category=Video` },
        { icon: Megaphone, title: "Marketing workflow", desc: "SEO, ad copy, social planning, competitor research, and lead capture.", href: `/${locale}/tools?category=Marketing` },
      ];

  return (
    <>
      <Navbar locale={locale} />
      <main className="bg-white">
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">
                {isZh ? "把 AI 工具变成真正能执行的工作流" : "Turn AI tools into workflows people can actually use"}
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {isZh
                  ? "每条工作流都应该回答：适合谁、要完成什么任务、用哪些工具、成本多少、风险是什么、第一步怎么做。"
                  : "Every workflow should explain who it is for, what job it completes, which tools to use, cost, risks, and the first step."}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            return (
              <Link key={workflow.title} href={workflow.href} className="group rounded-lg border p-5 transition hover:border-emerald-300 hover:shadow-md">
                <Icon className="mb-4 h-6 w-6 text-emerald-700" />
                <h2 className="font-semibold text-slate-950 group-hover:text-emerald-700">{workflow.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{workflow.desc}</p>
                <div className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700">
                  {isZh ? "查看相关工具" : "View related tools"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}

import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { workflows } from '@/lib/workflows';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const isZh = locale === 'zh';
  const altLocale = isZh ? 'en' : 'zh';

  return {
    title: isZh ? 'AI 工作流库 - 可直接执行的 AI 方案 | Jilo.ai' : 'AI Workflows Library - Step-by-Step AI Workflows | Jilo.ai',
    description: isZh
      ? '浏览可直接执行的 AI 工作流，覆盖写作、营销、调研、编程等场景，附推荐工具、步骤和 Prompt。'
      : 'Explore step-by-step AI workflows for writing, coding, marketing, research, and more. Includes tools, prompts, and practical steps.',
    alternates: {
      canonical: `https://jilo.ai/${locale}/workflows`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/workflows`,
        [altLocale]: `https://jilo.ai/${altLocale}/workflows`,
      },
    },
  };
}

export default function WorkflowsPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || 'en';
  const isZh = locale === 'zh';

  const categoryLabel = (category: string) => {
    if (!isZh) return category;
    const map: Record<string, string> = {
      Writing: '写作',
      Marketing: '营销',
      Research: '调研',
      Coding: '编程',
    };
    return map[category] || category;
  };

  return (
    <>
      <Navbar locale={locale} />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <section className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="max-w-3xl">
              <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
                {isZh ? '可直接执行' : 'Actionable'}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
                {isZh ? 'AI 工作流库' : 'AI Workflows Library'}
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {isZh
                  ? '不是只告诉你用什么工具，而是直接告诉你这件事怎么做。每个工作流都包含推荐工具、步骤、Prompt 和适用场景。'
                  : 'Not just which tool to use, but how to get the job done. Each workflow includes recommended tools, practical steps, prompts, and real use cases.'}
              </p>
              <div className="flex flex-wrap gap-3">
                {['Writing', 'Marketing', 'Research', 'Coding'].map((item) => (
                  <span key={item} className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                    {categoryLabel(item)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {workflows.map((workflow) => (
              <div key={workflow.slug} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge variant="secondary">{categoryLabel(workflow.category)}</Badge>
                  <Badge variant="outline">{workflow.difficulty}</Badge>
                  <Badge variant="outline">{workflow.time}</Badge>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {isZh ? workflow.title_zh : workflow.title_en}
                </h2>
                <p className="text-sm text-slate-600 mb-4 min-h-[60px]">
                  {isZh ? workflow.summary_zh : workflow.summary_en}
                </p>
                <div className="text-sm text-slate-500 mb-5">
                  {isZh ? '推荐工具：' : 'Recommended tools: '}
                  <span className="text-slate-700">{workflow.recommendedTools.join(', ')}</span>
                </div>
                <Button asChild className="w-full rounded-xl">
                  <Link href={`/${locale}/workflows/${workflow.slug}`}>
                    {isZh ? '查看工作流' : 'View Workflow'}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer locale={locale} />
    </>
  );
}

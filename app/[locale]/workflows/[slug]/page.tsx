import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getWorkflowBySlug } from '@/lib/workflows';
import CopyPromptButton from '@/components/copy-prompt-button';

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const isZh = locale === 'zh';
  const workflow = getWorkflowBySlug(params.slug);
  if (!workflow) return {};
  const altLocale = isZh ? 'en' : 'zh';

  return {
    title: isZh ? `${workflow.title_zh} | Jilo.ai` : `${workflow.title_en} | Jilo.ai`,
    description: isZh ? workflow.summary_zh : workflow.summary_en,
    alternates: {
      canonical: `https://jilo.ai/${locale}/workflows/${workflow.slug}`,
      languages: {
        [locale]: `https://jilo.ai/${locale}/workflows/${workflow.slug}`,
        [altLocale]: `https://jilo.ai/${altLocale}/workflows/${workflow.slug}`,
      },
    },
  };
}

export default function WorkflowDetailPage({ params }: { params: { locale: string; slug: string } }) {
  const locale = params?.locale || 'en';
  const isZh = locale === 'zh';
  const workflow = getWorkflowBySlug(params.slug);

  if (!workflow) return notFound();

  const title = isZh ? workflow.title_zh : workflow.title_en;
  const summary = isZh ? workflow.summary_zh : workflow.summary_en;
  const audience = isZh ? workflow.audience_zh : workflow.audience_en;
  const notFor = isZh ? workflow.notFor_zh : workflow.notFor_en;
  const inputs = isZh ? workflow.inputs_zh : workflow.inputs_en;
  const outputs = isZh ? workflow.outputs_zh : workflow.outputs_en;
  const prompts = isZh ? workflow.prompts_zh : workflow.prompts_en;
  const variations = isZh ? workflow.variations_zh : workflow.variations_en;
  const faqs = isZh ? workflow.faqs_zh : workflow.faqs_en;
  const category = isZh ? ({ Writing: '写作', Marketing: '营销', Research: '调研', Coding: '编程' } as Record<string, string>)[workflow.category] || workflow.category : workflow.category;

  return (
    <>
      <Navbar locale={locale} />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-sm text-slate-500 mb-6">
            <Link href={`/${locale}`} className="hover:text-slate-900">{isZh ? '首页' : 'Home'}</Link>
            {' / '}
            <Link href={`/${locale}/workflows`} className="hover:text-slate-900">{isZh ? '工作流' : 'Workflows'}</Link>
            {' / '}
            <span className="text-slate-900">{title}</span>
          </div>

          <section className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge>{category}</Badge>
              <Badge variant="secondary">{workflow.difficulty}</Badge>
              <Badge variant="outline">{workflow.time}</Badge>
              <Badge variant="outline">{workflow.toolsCount} {isZh ? '个工具' : 'tools'}</Badge>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-4">{title}</h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">{summary}</p>
            <div className="flex flex-wrap gap-3">
              <CopyPromptButton
                text={prompts.map((item) => `${item.title}\n${item.text}`).join('\n\n')}
                copyLabel={isZh ? '复制 Prompt 包' : 'Copy Prompt Pack'}
                copiedLabel={isZh ? '已复制' : 'Copied'}
                className="rounded-xl"
              />
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/${locale}/tools`}>{isZh ? '查看推荐工具' : 'View Recommended Tools'}</Link>
              </Button>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-8">
              <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">{isZh ? '适合谁用' : 'Who This Workflow Is For'}</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-3 text-slate-900">{isZh ? '适合' : 'Best for'}</h3>
                    <ul className="space-y-2 text-slate-600">
                      {audience.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-slate-900">{isZh ? '不太适合' : 'Not ideal for'}</h3>
                    <ul className="space-y-2 text-slate-600">
                      {notFor.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">{isZh ? '你需要准备什么' : 'What You Need'}</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-3">{isZh ? '输入材料' : 'Required inputs'}</h3>
                    <ul className="space-y-2 text-slate-600">
                      {inputs.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">{isZh ? '预期输出' : 'Outputs'}</h3>
                    <ul className="space-y-2 text-slate-600">
                      {outputs.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6">{isZh ? '步骤拆解' : 'Step-by-Step Workflow'}</h2>
                <div className="space-y-6">
                  {workflow.steps.map((step, index) => (
                    <div key={index} className="border border-slate-200 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">{index + 1}</div>
                        <h3 className="text-xl font-bold">{isZh ? step.title_zh : step.title_en}</h3>
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-2">{isZh ? step.goal_zh : step.goal_en}</p>
                      <p className="text-slate-600 leading-relaxed mb-4">{isZh ? step.body_zh : step.body_en}</p>
                      <div className="text-sm text-slate-500 mb-3">{isZh ? '推荐工具：' : 'Recommended tools: '}<span className="text-slate-700">{step.tools.join(', ')}</span></div>
                      {((isZh ? step.prompt_zh : step.prompt_en)) && (
                        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 mb-3">
                          <div className="font-semibold mb-2">{isZh ? 'Prompt' : 'Prompt'}</div>
                          <div>{isZh ? step.prompt_zh : step.prompt_en}</div>
                        </div>
                      )}
                      {((isZh ? step.tip_zh : step.tip_en)) && (
                        <div className="text-sm text-blue-700 bg-blue-50 rounded-xl p-3">
                          <span className="font-semibold">{isZh ? '提示：' : 'Tip: '}</span>
                          {isZh ? step.tip_zh : step.tip_en}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">{isZh ? 'Prompt 包' : 'Prompt Pack'}</h2>
                <div className="space-y-4">
                  {prompts.map((prompt) => (
                    <div key={prompt.title} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="font-semibold">{prompt.title}</div>
                        <CopyPromptButton
                          text={prompt.text}
                          copyLabel={isZh ? '复制' : 'Copy'}
                          copiedLabel={isZh ? '已复制' : 'Copied'}
                        />
                      </div>
                      <div className="text-sm text-slate-600 whitespace-pre-line">{prompt.text}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">{isZh ? '可选变体' : 'Variations'}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {variations.map((item) => (
                    <div key={item.title} className="border border-slate-200 rounded-xl p-4">
                      <div className="font-semibold mb-2">{item.title}</div>
                      <div className="text-sm text-slate-600">{item.text}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">FAQ</h2>
                <div className="space-y-4">
                  {faqs.map((item) => (
                    <div key={item.q}>
                      <h3 className="font-semibold mb-2">{item.q}</h3>
                      <p className="text-slate-600">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">{isZh ? '推荐工具' : 'Recommended Tools'}</h2>
                <div className="space-y-3">
                  {workflow.recommendedTools.map((tool) => (
                    <div key={tool} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{tool}</div>
                  ))}
                </div>
                <Button asChild variant="outline" className="w-full mt-4 rounded-xl">
                  <Link href={`/${locale}/tools`}>{isZh ? '浏览全部工具' : 'Browse All Tools'}</Link>
                </Button>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">{isZh ? '相关工作流' : 'Related Workflows'}</h2>
                <div className="space-y-3">
                  {workflow.related.map((slug) => {
                    const related = getWorkflowBySlug(slug);
                    if (!related) return null;
                    return (
                      <Link key={slug} href={`/${locale}/workflows/${slug}`} className="block rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:bg-slate-50 transition">
                        <div className="font-medium text-slate-900">{isZh ? related.title_zh : related.title_en}</div>
                        <div className="text-sm text-slate-500 mt-1">{isZh ? related.summary_zh : related.summary_en}</div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  );
}

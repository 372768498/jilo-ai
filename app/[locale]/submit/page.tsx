"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const TIERS = [
  {
    id: "free",
    label: "Free",
    price: "$0",
    description: "Standard editorial review",
    features: ["Directory submission", "Basic profile review", "Organic ranking"],
  },
  {
    id: "featured",
    label: "Featured",
    price: "$49",
    description: "Priority review and featured placement",
    features: ["Priority review", "Homepage or category placement", "Clear sponsorship label"],
  },
  {
    id: "sponsored",
    label: "Sponsored",
    price: "$99",
    description: "Maximum launch visibility",
    features: ["Same-day review target", "Sponsored placement", "Review or newsletter consideration"],
  },
];

const PAYMENT_LINKS: Record<string, string> = {
  featured: "https://paypal.me/jiloai001/49",
  sponsored: "https://paypal.me/jiloai001/99",
};

const PLATFORMS = ["web", "chrome", "ios", "android", "vscode", "api"];

type TierId = "free" | "featured" | "sponsored";
type PageProps = {
  params: { locale: string };
};

export default function SubmitToolPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const isZh = locale === "zh";
  const [tier, setTier] = useState<TierId>("free");
  const [form, setForm] = useState({
    email: "",
    tool_name: "",
    official_url: "",
    pitch: "",
    pricing: "freemium",
    platforms: [] as string[],
    logo_url: "",
  });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const togglePlatform = (p: string) => {
    setForm((current) => {
      const has = current.platforms.includes(p);
      return {
        ...current,
        platforms: has ? current.platforms.filter((item) => item !== p) : [...current.platforms, p],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.tool_name.trim()) return;
    setBusy(true);
    setErr(null);
    setOk(false);

    try {
      const { error } = await supabase.from("submissions").insert({
        submitter_email: form.email || null,
        tool_name: form.tool_name,
        official_url: form.official_url || null,
        pitch: form.pitch || null,
        pricing: form.pricing || null,
        platforms: form.platforms,
        logo_url: form.logo_url || null,
        status: tier === "free" ? "pending" : "paid_pending",
        tier,
      });
      if (error) throw error;

      if (tier !== "free" && PAYMENT_LINKS[tier]) {
        window.location.href = PAYMENT_LINKS[tier];
        return;
      }

      setOk(true);
      setForm({ email: "", tool_name: "", official_url: "", pitch: "", pricing: "freemium", platforms: [], logo_url: "" });
    } catch (error: any) {
      setErr(error?.message || "Submit failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = isZh
    ? {
        title: "提交你的 AI 工具或解决方案",
        subtitle: "Jilo.ai 优先收录能解决真实任务、适合评测和转化的 AI 工具、Access 方案和工作流产品。",
        details: "提交信息",
        email: "联系邮箱",
        tool: "工具名称",
        url: "官网或产品链接",
        pitch: "一句话介绍",
        pricing: "定价模式",
        logo: "Logo URL",
        platforms: "平台",
        submitFree: "提交免费审核",
        success: "已收到提交，我们会审核后联系你。",
        paidNote: "付费方案会跳转到 PayPal。上线前如不适合发布，可退款。",
      }
    : {
        title: "Submit your AI tool or solution",
        subtitle: "Jilo.ai prioritizes products that solve real jobs, fit reviews, and can convert high-intent users.",
        details: "Submission details",
        email: "Contact email",
        tool: "Tool name",
        url: "Official URL",
        pitch: "One-line pitch",
        pricing: "Pricing model",
        logo: "Logo URL",
        platforms: "Platforms",
        submitFree: "Submit for free review",
        success: "Thanks. Your submission is in the review queue.",
        paidNote: "Paid tiers redirect to PayPal. Refund available if the submission is not a fit before publication.",
      };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-950">{copy.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">{copy.subtitle}</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {TIERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTier(item.id as TierId)}
              className={`rounded-lg border p-5 text-left transition ${
                tier === item.id ? "border-slate-950 bg-slate-950 text-white" : "bg-white hover:border-emerald-300"
              }`}
            >
              <div className="text-lg font-bold">{item.label}</div>
              <div className={`mt-1 text-3xl font-bold ${tier === item.id ? "text-white" : "text-slate-950"}`}>{item.price}</div>
              <p className={`mt-2 text-sm ${tier === item.id ? "text-slate-300" : "text-slate-600"}`}>{item.description}</p>
              <ul className="mt-4 space-y-2">
                {item.features.map((feature) => (
                  <li key={feature} className={`text-xs ${tier === item.id ? "text-slate-200" : "text-slate-600"}`}>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-950">{copy.details}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              {copy.email}
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="name@company.com"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {copy.tool}
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                required
                value={form.tool_name}
                onChange={(event) => setForm({ ...form, tool_name: event.target.value })}
                placeholder="Awesome AI"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            {copy.url}
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              type="url"
              value={form.official_url}
              onChange={(event) => setForm({ ...form, official_url: event.target.value })}
              placeholder="https://example.com"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            {copy.pitch}
            <textarea
              className="mt-1 min-h-[100px] w-full rounded-md border px-3 py-2"
              required
              value={form.pitch}
              onChange={(event) => setForm({ ...form, pitch: event.target.value })}
              placeholder="What is it? Who is it for? What job does it solve?"
            />
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              {copy.pricing}
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.pricing}
                onChange={(event) => setForm({ ...form, pricing: event.target.value })}
              >
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
                <option value="opensource">Open-source</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              {copy.logo}
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.logo_url}
                onChange={(event) => setForm({ ...form, logo_url: event.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </label>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm font-medium text-slate-700">{copy.platforms}</div>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  type="button"
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`rounded-md border px-3 py-1 text-sm capitalize ${
                    form.platforms.includes(platform) ? "border-slate-950 bg-slate-950 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Processing..." : tier === "free" ? copy.submitFree : `Continue to payment (${TIERS.find((item) => item.id === tier)?.price})`}
          </button>
          {tier !== "free" ? <p className="mt-2 text-center text-xs text-slate-500">{copy.paidNote}</p> : null}

          {ok ? <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{copy.success}</div> : null}
          {err ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{err}</div> : null}
        </form>
      </div>
    </main>
  );
}

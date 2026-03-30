"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// ─── Submission tiers ────────────────────────────────────────────
const TIERS = [
  {
    id: "free",
    label: "Free",
    price: "$0",
    description: "Standard review queue (3–5 business days)",
    features: ["Listed in directory", "Basic profile page", "Organic ranking"],
    highlight: false,
  },
  {
    id: "featured",
    label: "Featured",
    price: "$49",
    description: "Priority review + 7-day homepage placement",
    features: [
      "⚡ 24h priority review",
      "🔥 Homepage Featured badge (7 days)",
      "📌 Category page top placement (7 days)",
      "Email notification to 500+ subscribers",
    ],
    highlight: true,
  },
  {
    id: "sponsored",
    label: "Sponsored",
    price: "$99",
    description: "Maximum visibility for 14 days",
    features: [
      "⚡ Same-day review",
      "🏆 Sponsored label + homepage carousel (14 days)",
      "📌 All category pages top placement (14 days)",
      "📧 Dedicated newsletter mention",
      "🔗 Do-follow backlink in review article",
    ],
    highlight: false,
  },
];

// ─── PayPal payment links ─────────────────────────────────────────
const PAYMENT_LINKS: Record<string, string> = {
  featured: "https://paypal.me/jiloai001/49",
  sponsored: "https://paypal.me/jiloai001/99",
};

const PLATFORMS = ["web", "chrome", "ios", "android", "vscode", "api"];

type TierId = "free" | "featured" | "sponsored";

export default function SubmitToolPage() {
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
    setForm((f) => {
      const has = f.platforms.includes(p);
      return { ...f, platforms: has ? f.platforms.filter((x) => x !== p) : [...f.platforms, p] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tool_name.trim()) return;
    setBusy(true);
    setErr(null);
    setOk(false);

    try {
      // Save submission to Supabase regardless of tier
      const { error } = await supabase.from("submissions").insert({
        submitter_email: form.email || null,
        tool_name: form.tool_name,
        official_url: form.official_url || null,
        pitch: form.pitch || null,
        pricing: form.pricing || null,
        platforms: form.platforms,
        logo_url: form.logo_url || null,
        status: tier === "free" ? "pending" : "paid_pending",
        tier: tier,
      });
      if (error) throw error;

      // For paid tiers: redirect to PayPal
      if (tier !== "free" && PAYMENT_LINKS[tier]) {
        window.location.href = PAYMENT_LINKS[tier];
        return;
      }

      setOk(true);
      setForm({ email: "", tool_name: "", official_url: "", pitch: "", pricing: "freemium", platforms: [], logo_url: "" });
    } catch (e: any) {
      setErr(e?.message || "Submit failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Submit Your AI Tool</h1>
        <p className="text-muted-foreground">
          Join 70+ curated AI tools trusted by 10K+ users. Choose the plan that fits your goals.
        </p>
      </div>

      {/* ─── Tier Selector ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTier(t.id as TierId)}
            className={`relative text-left rounded-xl border-2 p-5 transition-all ${
              tier === t.id
                ? "border-black bg-black text-white"
                : "border-gray-200 bg-white hover:border-gray-400"
            } ${t.highlight && tier !== t.id ? "border-purple-400" : ""}`}
          >
            {t.highlight && (
              <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                tier === t.id ? "bg-white text-black" : "bg-purple-500 text-white"
              }`}>
                Most Popular
              </span>
            )}
            <div className="font-bold text-lg">{t.label}</div>
            <div className={`text-2xl font-extrabold my-1 ${tier === t.id ? "text-white" : "text-black"}`}>
              {t.price}
            </div>
            <div className={`text-xs mb-3 ${tier === t.id ? "text-gray-300" : "text-muted-foreground"}`}>
              {t.description}
            </div>
            <ul className="space-y-1">
              {t.features.map((f) => (
                <li key={f} className={`text-xs ${tier === t.id ? "text-gray-200" : "text-gray-600"}`}>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* ─── Submission Form ───────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-5 bg-gray-50 rounded-2xl p-6 border">
        <h2 className="font-semibold text-lg">Tool Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contact Email *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 bg-white"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tool Name *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 bg-white"
              required
              value={form.tool_name}
              onChange={(e) => setForm({ ...form, tool_name: e.target.value })}
              placeholder="Awesome AI"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Official URL</label>
          <input
            className="w-full border rounded-lg px-3 py-2 bg-white"
            type="url"
            value={form.official_url}
            onChange={(e) => setForm({ ...form, official_url: e.target.value })}
            placeholder="https://yourtool.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">One-liner pitch *</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 bg-white min-h-[90px]"
            required
            value={form.pitch}
            onChange={(e) => setForm({ ...form, pitch: e.target.value })}
            placeholder="What is it? Who is it for? What's the main value? (2-3 sentences)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pricing Model</label>
            <select
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={form.pricing}
              onChange={(e) => setForm({ ...form, pricing: e.target.value })}
            >
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
              <option value="opensource">Open-source</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Logo URL</label>
            <input
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://yourtool.com/logo.png"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1 rounded-full border text-sm capitalize transition-colors ${
                  form.platforms.includes(p)
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-60 hover:bg-gray-800 transition-colors"
          >
            {busy
              ? "Processing…"
              : tier === "free"
              ? "Submit for Free Review"
              : `Continue to Payment (${TIERS.find((t) => t.id === tier)?.price})`}
          </button>
          {tier !== "free" && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Secure payment via PayPal · 30-day refund if not published
            </p>
          )}
        </div>

        {ok && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-sm">
            ✅ Thanks! Your submission is in queue. We'll email you when it's reviewed (3–5 days).
          </div>
        )}
        {err && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
            ❌ {err}
          </div>
        )}
      </form>

      {/* Social proof */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Questions? Email <a href="mailto:submit@jilo.ai" className="underline">submit@jilo.ai</a></p>
      </div>
    </div>
  );
}

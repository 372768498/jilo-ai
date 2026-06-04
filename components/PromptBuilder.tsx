"use client";

import { useMemo, useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import type { PromptBlock, PromptTemplate } from "@/lib/prompt-templates";

type Props = {
  template: PromptTemplate;
  blocks: PromptBlock[];
  locale: string;
};

// Localized placeholder hints per generic block key.
const HINTS: Record<string, { en: string; zh: string }> = {
  subject: { en: "e.g. a ceramic pour-over coffee dripper, hero product shot", zh: "例如：陶瓷手冲咖啡滤杯，作为主体特写" },
  composition: { en: "e.g. centered, top-down 3/4 angle, generous negative space", zh: "例如：居中、俯视 3/4 视角、大量留白" },
  style: { en: "e.g. clean studio realism, soft shadows, warm palette", zh: "例如：干净的影棚写实、柔和阴影、暖色调" },
  text: { en: "e.g. label reads 'Slow Brew', small, readable, no other text", zh: "例如：标签写「慢萃」，小字、可读，无其他文字" },
  format: { en: "e.g. 1:1 square, high resolution", zh: "例如：1:1 方图，高分辨率" },
  constraints: { en: "e.g. no extra props, no watermark, no distorted text", zh: "例如：无多余道具、无水印、无扭曲文字" },
};

export default function PromptBuilder({ template, blocks, locale }: Props) {
  const isZh = locale === "zh";
  const t = (en: string, zh: string) => (isZh ? zh : en);

  // Seed two blocks so the builder feels template-aware out of the box.
  const seedStyle = (isZh ? template.styles : template.styles).join(", ");
  const seedConstraints = (isZh ? template.pitfalls_zh : template.pitfalls_en).join(" ");

  const initial = useMemo<Record<string, string>>(
    () => ({ style: seedStyle, constraints: seedConstraints }),
    [seedStyle, seedConstraints]
  );

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [copied, setCopied] = useState(false);

  const label = (b: PromptBlock) => (isZh ? b.label_zh : b.label_en);

  const assembled = useMemo(() => {
    const lines = blocks
      .map((b) => {
        const v = (values[b.key] || "").trim();
        return v ? `${label(b)}: ${v}` : "";
      })
      .filter(Boolean);
    if (lines.length === 0) return "";
    const name = isZh ? template.name_zh : template.name_en;
    lines.push("");
    lines.push(t(`Template: ${name} · Model: GPT-Image-2`, `模板：${name} · 模型：GPT-Image-2`));
    return lines.join("\n");
  }, [values, blocks, isZh, template]);

  const copy = async () => {
    if (!assembled) return;
    try {
      await navigator.clipboard.writeText(assembled);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — user can still select the textarea */
    }
  };

  return (
    <div className="rounded-xl border bg-white">
      <div className="border-b bg-slate-50 px-5 py-3">
        <h2 className="text-base font-semibold text-slate-950">{t("Prompt Builder", "提示词生成器")}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {t(
            "Fill the blocks, then copy a production-ready GPT-Image-2 prompt.",
            "填写各段，复制即得可直接使用的 GPT-Image-2 提示词。"
          )}
        </p>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        {blocks.map((b) => (
          <label key={b.key} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{label(b)}</span>
            <textarea
              value={values[b.key] || ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [b.key]: e.target.value }))}
              placeholder={isZh ? HINTS[b.key]?.zh : HINTS[b.key]?.en}
              rows={b.key === "constraints" || b.key === "subject" ? 3 : 2}
              className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </label>
        ))}
      </div>

      <div className="border-t p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{t("Generated prompt", "生成的提示词")}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValues(initial)}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("Reset", "重置")}
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={!assembled}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("Copied", "已复制") : t("Copy prompt", "复制提示词")}
            </button>
          </div>
        </div>
        <textarea
          readOnly
          value={assembled}
          placeholder={t("Your assembled prompt will appear here…", "拼装后的提示词会显示在这里…")}
          rows={8}
          className="w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-800 focus:outline-none"
        />
      </div>
    </div>
  );
}

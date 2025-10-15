// components/PlanCard.tsx
"use client";

import { useState } from "react";

type Plan = {
  name: string;
  steps: string[];
  tools: { name: string; why: string; url?: string }[];
  time_hours?: string | number;
  cost_month_usd?: string | number;
  caveats?: string[];
};

export default function PlanCard({ plan }: { plan: Plan }) {
  const [copied, setCopied] = useState(false);

  const md =
`### ${plan.name}
**Steps**
${(plan.steps || []).map((s) => `- ${s}`).join("\n")}
**Tool stack**
${(plan.tools || []).map((t) => `- ${t.name}${t.url ? ` (${t.url})` : ""}: ${t.why}`).join("\n")}
**Time**: ${plan.time_hours ?? "-"} hours  
**Cost**: $${plan.cost_month_usd ?? "-"} / mo  
**Caveats**
${(plan.caveats || []).map((c) => `- ${c}`).join("\n")}`;

  const copy = async () => {
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="border rounded-2xl p-4 bg-white/70 flex flex-col">
      <h3 className="font-medium text-lg">{plan.name}</h3>

      <div className="mt-3">
        <div className="text-sm font-semibold">Steps</div>
        <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
          {(plan.steps || []).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <div className="mt-3">
        <div className="text-sm font-semibold">Tool stack</div>
        <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
          {(plan.tools || []).map((t, i) => (
            <li key={i}>
              {t.url ? <a className="underline" href={t.url} target="_blank">{t.name}</a> : t.name}
              {": "}{t.why}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 text-sm grid grid-cols-2 gap-2">
        <div><span className="text-muted-foreground">Time:</span> {String(plan.time_hours ?? "-")} h</div>
        <div><span className="text-muted-foreground">Cost:</span> ${String(plan.cost_month_usd ?? "-")}/mo</div>
      </div>

      {plan.caveats && plan.caveats.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-semibold">Caveats</div>
          <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
            {plan.caveats.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <button onClick={copy} className="px-3 py-1 rounded-full border text-sm bg-white hover:bg-muted">
          {copied ? "Copied!" : "Copy as Markdown"}
        </button>
      </div>
    </div>
  );
}

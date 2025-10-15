// components/WeeklyExport.tsx
"use client";

import { useState } from "react";

type News = { slug: string; title: string; summary?: string | null; source_url?: string | null; published_at?: string | null };
type Update = {
  tools?: { name: string; slug: string };
  version?: string | null; changelog?: string | null; source_url?: string | null; published_at?: string | null;
};

export default function WeeklyExport({
  startISO,
  endISO,
  headlines,
  updates,
}: {
  startISO: string;
  endISO: string;
  headlines: News[];
  updates: Update[];
}) {
  const [copied, setCopied] = useState<"md" | "html" | null>(null);

  const site = "https://www.jilo.ai";

  const md =
`# Weekly AI Digest (${startISO.slice(0,10)} — ${endISO.slice(0,10)})
## Top headlines
${headlines.map((n, i) => `**${i+1}. ${n.title}** (${(n.published_at||"").slice(0,10)})  
${n.summary || ""}  
[Read](${site}/en/news/${n.slug})${n.source_url ? ` · [Original](${n.source_url})` : ""}`).join("\n\n")}

## New & updated tools
${updates.map((u) => `- **${u.tools?.name}**${u.version ? ` v${u.version}` : ""} (${(u.published_at||"").slice(0,10)})  
${u.changelog || ""}  
${u.source_url ? `[Release notes](${u.source_url})` : ""}`).join("\n\n")}
`;

  const html =
`<h1>Weekly AI Digest (${startISO.slice(0,10)} — ${endISO.slice(0,10)})</h1>
<h2>Top headlines</h2>
${headlines.map((n, i) => `
  <p><strong>${i+1}. ${n.title}</strong> (${(n.published_at||"").slice(0,10)})<br/>
  ${n.summary || ""}<br/>
  <a href="${site}/en/news/${n.slug}">Read</a>${n.source_url ? ` · <a href="${n.source_url}">Original</a>` : ""}</p>`).join("\n")}
<h2>New &amp; updated tools</h2>
${updates.map((u) => `
  <p><strong>${u.tools?.name}</strong>${u.version ? ` v${u.version}` : ""} (${(u.published_at||"").slice(0,10)})<br/>
  ${u.changelog || ""}<br/>
  ${u.source_url ? `<a href="${u.source_url}">Release notes</a>` : ""}</p>`).join("\n")}
`;

  const copy = async (type: "md" | "html") => {
    await navigator.clipboard.writeText(type === "md" ? md : html);
    setCopied(type);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="mt-6 flex gap-3">
      <button onClick={() => copy("md")} className="px-3 py-1 rounded-full border text-sm bg-white hover:bg-muted">
        {copied === "md" ? "Copied!" : "Copy Markdown"}
      </button>
      <button onClick={() => copy("html")} className="px-3 py-1 rounded-full border text-sm bg-white hover:bg-muted">
        {copied === "html" ? "Copied!" : "Copy HTML"}
      </button>
    </div>
  );
}

// components/CompareTable.tsx
"use client";

import { useState } from "react";

type Tool = {
  slug: string;
  name: string;
  pricing: string | null;
  languages: string[] | null;
  platforms: string[] | null;
  open_source: boolean | null;
  need_login: boolean | null;
  last_update_at: string | null;
  official_url: string | null;
};

export default function CompareTable({ tools }: { tools: Tool[] }) {
  const [copied, setCopied] = useState(false);

  const header = ["Feature", ...tools.map((t) => t.name)];
  const rows: string[][] = [
    ["Pricing", ...tools.map((t) => t.pricing || "-")],
    ["Languages", ...tools.map((t) => (t.languages || []).join(", ") || "-")],
    ["Platforms", ...tools.map((t) => (t.platforms || []).join(", ") || "-")],
    ["Login required", ...tools.map((t) => (t.need_login ? "Yes" : "No"))],
    ["Open-source", ...tools.map((t) => (t.open_source ? "Yes" : "No"))],
    ["Last update", ...tools.map((t) => (t.last_update_at ? new Date(t.last_update_at).toISOString().slice(0,10) : "-"))],
    ["Link", ...tools.map((t) => (t.official_url ? t.official_url : `https://www.jilo.ai/tools/${t.slug}`))],
  ];

  const md =
    `| ${header.join(" | ")} |\n|${header.map(() => "---").join("|")}|\n` +
    rows.map((r) => `| ${r.join(" | ")} |`).join("\n");

  const copy = async () => {
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-[640px] w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {header.map((h) => (
                <th key={h} className="text-left px-3 py-2 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="odd:bg-white even:bg-muted/20">
                {row.map((cell, i) => (
                  <td key={i} className="px-3 py-2 border-b align-top">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={copy}
        className="mt-4 px-3 py-1 rounded-full border text-sm bg-white hover:bg-muted"
      >
        {copied ? "Copied!" : "Copy as Markdown"}
      </button>
    </div>
  );
}

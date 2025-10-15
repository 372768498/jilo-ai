"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-sm transition ${
        active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const pricing = sp.getAll("pricing");       // free/freemium/paid（可多选）
  const langs = sp.getAll("lang");            // en/zh（可多选）
  const plats = sp.getAll("platform");        // web/chrome/ios/android/vscode（可多选）
  const opensource = sp.get("opensource") === "1";
  const login = sp.get("login") === "1";

  function push(next: URLSearchParams) {
    const q = next.toString();
    router.push(`${pathname}${q ? `?${q}` : ""}`);
  }

  function toggleMulti(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    const values = next.getAll(key);
    if (values.includes(value)) {
      const kept = values.filter((v) => v !== value);
      next.delete(key);
      kept.forEach((v) => next.append(key, v));
    } else {
      next.append(key, value);
    }
    push(next);
  }

  function toggleBool(key: "opensource" | "login") {
    const next = new URLSearchParams(sp.toString());
    if (next.get(key) === "1") next.delete(key);
    else next.set(key, "1");
    push(next);
  }

  function clearAll() {
    router.push(pathname); // 清空所有参数
  }

  return (
    <div className="border rounded-2xl p-4 mb-4 bg-white/60">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xs font-medium opacity-70 w-full sm:w-auto">PRICING</div>
        {["free", "freemium", "paid"].map((p) => (
          <Chip key={p} active={pricing.includes(p)} onClick={() => toggleMulti("pricing", p)}>{p}</Chip>
        ))}

        <div className="text-xs font-medium opacity-70 w-full sm:w-auto sm:ml-4">LANGUAGE</div>
        {["en", "zh"].map((l) => (
          <Chip key={l} active={langs.includes(l)} onClick={() => toggleMulti("lang", l)}>{l.toUpperCase()}</Chip>
        ))}

        <div className="text-xs font-medium opacity-70 w-full sm:w-auto sm:ml-4">PLATFORMS</div>
        {["web", "chrome", "ios", "android", "vscode"].map((pf) => (
          <Chip key={pf} active={plats.includes(pf)} onClick={() => toggleMulti("platform", pf)}>{pf}</Chip>
        ))}

        <div className="flex-1" />

        <Chip active={opensource} onClick={() => toggleBool("opensource")}>Open-source</Chip>
        <Chip active={login} onClick={() => toggleBool("login")}>Login required</Chip>

        <Chip onClick={clearAll}>Clear</Chip>
      </div>
    </div>
  );
}

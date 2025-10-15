// components/CompareToggle.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const KEY = "jilo_compare";

function readList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeList(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export default function CompareToggle({ slug }: { slug: string }) {
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    setList(readList());
  }, []);

  const isChecked = useMemo(() => list.includes(slug), [list, slug]);

  const toggle = () => {
    const next = isChecked ? list.filter((s) => s !== slug) : [...list, slug];
    setList(next);
    writeList(next);
  };

  const compareHref =
    list.length > 0
      ? `/compare?tools=${encodeURIComponent(list.join(","))}`
      : "/compare";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        className={`px-3 py-1 rounded-full border text-sm ${
          isChecked ? "bg-black text-white" : "bg-white"
        }`}
      >
        {isChecked ? "Compared" : "Compare"}
      </button>

      <Link
        href={compareHref}
        className={`px-3 py-1 rounded-full border text-sm ${
          list.length ? "bg-black text-white" : "bg-white pointer-events-none opacity-50"
        }`}
      >
        View compare ({list.length})
      </Link>
    </div>
  );
}

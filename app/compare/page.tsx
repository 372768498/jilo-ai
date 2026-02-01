// app/compare/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CompareTable from "@/components/CompareTable";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";

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

const KEY = "jilo_compare";

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function CompareContent() {
  const sp = useSearchParams();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  // derive slugs
  useEffect(() => {
    const q = sp.get("tools");
    if (q) {
      setSlugs(q.split(",").filter(Boolean).slice(0, 4));
    } else {
      setSlugs(readLocal().slice(0, 4));
    }
  }, [sp]);

  // fetch tools
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (slugs.length === 0) {
        setTools([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("tools")
        .select("slug, name, pricing, languages, platforms, open_source, need_login, last_update_at, official_url")
        .in("slug", slugs);
      if (!cancelled) {
        if (error) console.error(error);
        setTools((data || []).sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug)));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slugs]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Compare tools</h1>

      {!slugs.length && (
        <div className="text-muted-foreground">
          No tools selected. Go to{" "}
          <Link href="/en/tools" className="underline">Tools</Link> and click <b>Compare</b>.
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : tools.length ? (
        <CompareTable tools={tools as any} />
      ) : (
        <div className="text-muted-foreground">No data.</div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <>
      <Navbar locale="en" />
      <Suspense fallback={
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold mb-4">Compare tools</h1>
          <div className="text-muted-foreground">Loading…</div>
        </div>
      }>
        <CompareContent />
      </Suspense>
      <Footer locale="en" />
    </>
  );
}
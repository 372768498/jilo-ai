// app/api/debug-tools/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error, count } = await supabase
    .from("tools_simple")
    .select("slug, name, pricing, languages, platforms, open_source", { count: "exact" })
    .order("slug", { ascending: true })
    .range(0, 9);

  return NextResponse.json({ ok: !error, error: error?.message, count, sample: data }, { status: 200 });
}

// app/api/health/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const report: any = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
      SUPABASE_SERVICE_KEY_OR_ROLE: !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE),
      ADMIN_KEY: !!process.env.ADMIN_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    },
    anon_select_news: null as null | { ok: boolean; count?: number; error?: string },
    service_access: null as null | { ok: boolean; error?: string },
  };

  // anon 读 news
  try {
    const { data, error } = await supabase.from("news").select("id").limit(1);
    report.anon_select_news = { ok: !error, count: data?.length || 0, error: error?.message };
  } catch (e: any) {
    report.anon_select_news = { ok: false, error: e?.message || "unknown" };
  }

  // service 访问（读 tools 计数）
  try {
    const { data, error, count } = await supabaseAdmin
      .from("tools")
      .select("id", { count: "exact", head: true });
    report.service_access = { ok: !error, error: error?.message };
  } catch (e: any) {
    report.service_access = { ok: false, error: e?.message || "unknown" };
  }

  return NextResponse.json(report, { status: 200 });
}

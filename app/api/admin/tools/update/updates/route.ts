// app/api/admin/updates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ADMIN_KEY = process.env.ADMIN_KEY; // 自定义口令

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_KEY) {
      return NextResponse.json({ error: "ADMIN_KEY not configured" }, { status: 500 });
    }
    const key = req.headers.get("x-admin-key");
    if (key !== ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tool_id, version, changelog, source_url, published_at } = body || {};
    if (!tool_id || !published_at) {
      return NextResponse.json({ error: "Missing tool_id or published_at" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("tool_updates")
      .insert({
        tool_id,
        version: version || null,
        changelog: changelog || null,
        source_url: source_url || null,
        published_at,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Insert failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ToolRecord = {
  id: string;
  slug: string;
  official_url: string | null;
  affiliate_url: string | null;
  click_count: number | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSafeHttpUrl(value: string | null | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function getTool(toolRef: string) {
  const query = supabaseAdmin
    .from("tools")
    .select("id,slug,official_url,affiliate_url,click_count")
    .eq("status", "published");

  const { data, error } = uuidPattern.test(toolRef)
    ? await query.eq("id", toolRef).maybeSingle()
    : await query.eq("slug", toolRef).maybeSingle();

  if (error) {
    console.error("outbound_lookup_failed", error.message);
    return null;
  }

  return data as ToolRecord | null;
}

async function trackOutboundClick(tool: ToolRecord, source: string, locale: string | null) {
  const nextClickCount = Number(tool.click_count || 0) + 1;

  const [updateResult, logResult] = await Promise.allSettled([
    supabaseAdmin.from("tools").update({ click_count: nextClickCount }).eq("id", tool.id),
    supabaseAdmin.from("ops_logs").insert({
      job_name: "outbound_click",
      status: "success",
      message: tool.slug,
      details: {
        tool_id: tool.id,
        slug: tool.slug,
        source,
        locale,
        has_affiliate: Boolean(tool.affiliate_url),
      },
    }),
  ]);

  if (updateResult.status === "fulfilled" && updateResult.value.error) {
    console.error("outbound_click_count_failed", updateResult.value.error.message);
  }

  if (logResult.status === "fulfilled" && logResult.value.error) {
    console.error("outbound_click_log_failed", logResult.value.error.message);
  }
}

export async function GET(request: NextRequest) {
  const toolRef = request.nextUrl.searchParams.get("tool");
  const source = request.nextUrl.searchParams.get("source") || "unknown";
  const locale = request.nextUrl.searchParams.get("locale");

  if (!toolRef) {
    return NextResponse.json({ error: "Missing tool parameter" }, { status: 400 });
  }

  const tool = await getTool(toolRef);
  const destination = tool?.affiliate_url || tool?.official_url || "";

  if (!tool || !isSafeHttpUrl(destination)) {
    return NextResponse.json({ error: "Tool destination not available" }, { status: 404 });
  }

  await trackOutboundClick(tool, source.slice(0, 80), locale);

  const response = NextResponse.redirect(destination, { status: 302 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

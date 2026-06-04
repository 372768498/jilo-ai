import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { captureServerEvent } from "@/lib/posthog/server";

type ToolRecord = {
  id: string;
  slug: string;
  official_url: string | null;
  affiliate_url: string | null;
  click_count: number | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const staticTargets: Record<string, { url: string; hasAffiliate: boolean }> = {
  "appsumo-ai": { url: "https://appsumo.com/search/?query=ai", hasAffiliate: false },
  "skool-community": {
    url: "https://www.skool.com/signup?ref=37b1672271fd4149b32cb4947874e1ba",
    hasAffiliate: true,
  },
  // ZH ChatGPT-access demand (the site's #1 search intent) -> commissioned
  // access affiliate. Routed through /api/out so every click is logged + fires
  // the tool_outbound_click conversion event.
  "chatgpt-access": { url: "https://nf.video/65JGC", hasAffiliate: true },
};

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

async function trackStaticOutboundClick(target: string, source: string, locale: string | null, hasAffiliate: boolean) {
  const { error } = await supabaseAdmin.from("ops_logs").insert({
    job_name: "outbound_click",
    status: "success",
    message: target,
    details: {
      target,
      source,
      locale,
      has_affiliate: hasAffiliate,
      static_target: true,
    },
  });

  if (error) {
    console.error("static_outbound_click_log_failed", error.message);
  }
}

export async function GET(request: NextRequest) {
  const toolRef = request.nextUrl.searchParams.get("tool");
  const targetRef = request.nextUrl.searchParams.get("target");
  const source = request.nextUrl.searchParams.get("source") || "unknown";
  const locale = request.nextUrl.searchParams.get("locale");

  if (targetRef && staticTargets[targetRef]) {
    const target = staticTargets[targetRef];
    await trackStaticOutboundClick(targetRef, source.slice(0, 80), locale, target.hasAffiliate);
    await captureServerEvent(request, "tool_outbound_click", {
      target: targetRef,
      source: source.slice(0, 80),
      locale,
      has_affiliate: target.hasAffiliate,
      static_target: true,
    });

    const response = NextResponse.redirect(target.url, { status: 302 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (!toolRef) {
    return NextResponse.json({ error: "Missing tool or target parameter" }, { status: 400 });
  }

  const tool = await getTool(toolRef);
  const destination = tool?.affiliate_url || tool?.official_url || "";

  if (!tool || !isSafeHttpUrl(destination)) {
    return NextResponse.json({ error: "Tool destination not available" }, { status: 404 });
  }

  await trackOutboundClick(tool, source.slice(0, 80), locale);
  await captureServerEvent(request, "tool_outbound_click", {
    tool_id: tool.id,
    slug: tool.slug,
    source: source.slice(0, 80),
    locale,
    has_affiliate: Boolean(tool.affiliate_url),
  });

  const response = NextResponse.redirect(destination, { status: 302 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

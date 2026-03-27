// app/api/cron/health-check/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE!
);

export async function GET(request: Request) {
  const isCron = request.headers.get("x-vercel-cron") === "1";
  const isAdmin = request.headers.get("x-admin-key") === process.env.ADMIN_KEY;
  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check published tools with official URLs
    const { data: tools } = await supabase
      .from("tools")
      .select("id, slug, name_en, official_url, status")
      .eq("status", "published")
      .not("official_url", "is", null)
      .limit(50);

    let checked = 0;
    let broken = 0;

    for (const tool of tools || []) {
      try {
        const resp = await fetch(tool.official_url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(5000),
        });

        if (resp.status === 404 || resp.status === 410) {
          await supabase.from("tools").update({ status: "needs_review" }).eq("id", tool.id);
          broken++;
        }
        checked++;
      } catch {
        // Timeout or network error — skip, don't mark as broken
        checked++;
      }
    }

    // Check for stale tools (not updated in 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { count: staleCount } = await supabase
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .lt("updated_at", ninetyDaysAgo);

    return NextResponse.json({
      checked,
      broken,
      stale: staleCount || 0,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// app/api/cron/indexnow/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE!
);

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "jilo-ai-indexnow-key";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.jilo.ai";

export async function GET(request: Request) {
  // Verify cron or admin auth
  const isCron = request.headers.get("x-vercel-cron") === "1";
  const isAdmin = request.headers.get("x-admin-key") === process.env.ADMIN_KEY;
  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get recently published content (last 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const [newsResult, toolsResult, compareResult] = await Promise.all([
      supabase.from("news").select("slug").eq("status", "published").gte("created_at", sixHoursAgo),
      supabase.from("tools").select("slug").eq("status", "published").gte("created_at", sixHoursAgo),
      supabase.from("compare_articles").select("slug").eq("status", "published").gte("created_at", sixHoursAgo),
    ]);

    const urls: string[] = [];
    for (const item of newsResult.data || []) {
      urls.push(`${SITE_URL}/en/news/${item.slug}`);
    }
    for (const item of toolsResult.data || []) {
      urls.push(`${SITE_URL}/en/tools/${item.slug}`);
    }
    for (const item of compareResult.data || []) {
      urls.push(`${SITE_URL}/en/compare/${item.slug}`);
    }

    if (urls.length === 0) {
      return NextResponse.json({ message: "No new URLs to submit", count: 0 });
    }

    // Submit to IndexNow (Bing endpoint)
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: new URL(SITE_URL).hostname,
        key: INDEXNOW_KEY,
        urlList: urls.slice(0, 100), // Max 100 per request
      }),
    });

    return NextResponse.json({
      message: "URLs submitted to IndexNow",
      count: urls.length,
      status: response.status,
    });
  } catch (error) {
    console.error("IndexNow error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

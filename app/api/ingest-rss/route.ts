// app/api/ingest-rss/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DAY_LIMIT = 3; // 只导最近 3 天
const DEFAULT_FEEDS = [
  "https://techcrunch.com/feed/",
  "https://www.theverge.com/rss/index.xml",
  "https://openai.com/blog/rss.xml",
];

// ————— utils —————
function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/https?:\/\/(www\.)?/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}
function stripTags(html?: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function firstMatch(re: RegExp, s: string) {
  const m = re.exec(s);
  return m ? m[1] : null;
}
function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
function toISO(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(+d) ? null : d.toISOString();
}
function isWithinDays(iso: string | null, days: number) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return t >= cutoff;
}

// 极简 RSS 解析：抽 <item> 块
function parseRss(xml: string) {
  const items: Array<{
    title: string;
    link: string;
    pubDate?: string | null;
    description?: string | null;
    cover?: string | null;
  }> = [];
  const itemRe = /<item\b[\s\S]*?<\/item>/gi;
  const all = xml.match(itemRe) || [];
  for (const raw of all) {
    const title = firstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, raw)?.trim() || "";
    const link =
      firstMatch(/<link[^>]*>([\s\S]*?)<\/link>/i, raw)?.trim() ||
      firstMatch(/<guid[^>]*>([\s\S]*?)<\/guid>/i, raw)?.trim() ||
      "";
    const pubDate =
      firstMatch(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i, raw)?.trim() ||
      firstMatch(/<updated[^>]*>([\s\S]*?)<\/updated>/i, raw)?.trim() ||
      null;
    const description =
      firstMatch(/<description[^>]*>([\s\S]*?)<\/description>/i, raw) ||
      firstMatch(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i, raw) ||
      null;
    const cover =
      firstMatch(/<media:content[^>]*url="([^"]+)"/i, raw) ||
      firstMatch(/<media:thumbnail[^>]*url="([^"]+)"/i, raw) ||
      firstMatch(/<img[^>]*src="([^"]+)"/i, description || "") ||
      null;
    if (title && link) items.push({ title, link, pubDate, description, cover });
  }
  return items;
}

// 尝试抓详情页的 og:image
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: { "user-agent": "jilo.ai-bot" },
      // 超时保护（edge/runtime 下可忽略，node 里可使用 AbortController，这里简单化）
      cache: "no-store",
    });
    const html = await resp.text();
    const og =
      firstMatch(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i, html) ||
      firstMatch(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i, html) ||
      firstMatch(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i, html);
    return og || null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  // 简单鉴权
  // ✅ 允许两种方式：1) 自己的 x-admin-key；2) Vercel Cron（会带 x-vercel-cron: 1）
    const adminKey = process.env.ADMIN_KEY || "";
    const reqKey = req.headers.get("x-admin-key") || "";
    // Vercel 定时任务会自动加这个头（注意大小写都兼容）
    const isVercelCron =
        req.headers.get("x-vercel-cron") === "1" ||
        req.headers.get("X-Vercel-Cron") === "1";

    if (!isVercelCron && (!adminKey || reqKey !== adminKey)) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

  const { searchParams } = new URL(req.url);
  const feeds = searchParams.getAll("feed");
  const feedList = feeds.length > 0 ? feeds : DEFAULT_FEEDS;

  const results: any[] = [];
  let imported = 0;
  let skipped = 0;

  for (const feed of feedList) {
    try {
      const res = await fetch(feed, { headers: { "user-agent": "jilo.ai-bot" }, cache: "no-store" });
      const xml = await res.text();
      const items = parseRss(xml);

      // 仅保留最近 3 天且有 link 的
      const rows = items
        .map((it) => {
          const title = stripTags(it.title);
          const link = (it.link || "").trim();
          const slug = slugify(link || title);
          const summary = stripTags(it.description || "");
          const cover = it.cover || null;
          const publishedISO = toISO(it.pubDate);
          return {
            slug,
            title_en: title,
            summary_en: summary,
            source: hostnameOf(link) || hostnameOf(feed),
            source_url: link,
            cover_image_url: cover,
            published_at: publishedISO,
          };
        })
        .filter((r) => r.slug && r.source_url && isWithinDays(r.published_at, DAY_LIMIT));

      // 如果没有封面，尝试抓 og:image（并发控制为串行即可）
      for (const r of rows) {
        if (!r.cover_image_url) {
          const og = await fetchOgImage(r.source_url);
          if (og) r.cover_image_url = og;
        }
      }

      // upsert
      // @ts-ignore supabase-js v2
      const { error } = await supabase
        .from("news")
        .upsert(rows, { onConflict: "slug", ignoreDuplicates: false });

      if (error) {
        results.push({ feed, ok: false, error: error.message });
      } else {
        imported += rows.length;
        results.push({ feed, ok: true, count: rows.length });
      }
    } catch (e: any) {
      results.push({ feed, ok: false, error: String(e?.message || e) });
    }
  }

  return NextResponse.json({ ok: true, imported, skipped, feeds: results });
}

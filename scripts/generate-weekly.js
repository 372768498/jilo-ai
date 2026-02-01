#!/usr/bin/env node
/**
 * AI 工具周刊生成脚本
 * 用法: node scripts/generate-weekly.js [--week 2025-W28] [--dry-run]
 *
 * 从 Supabase 获取最近 7 天的工具和新闻，用 OpenAI 生成双语周刊文章，
 * 保存到 content/weekly/YYYY-WNN.md
 */

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

// ── 配置 ──────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL / KEY in .env.local");
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || undefined;
const openai = new OpenAI.default({
  apiKey: OPENAI_API_KEY,
  ...(OPENAI_BASE_URL ? { baseURL: OPENAI_BASE_URL } : {}),
});
// Use available model - check env or default
const MODEL = process.env.OPENAI_MODEL || "qwen2.5:7b";

// ── 工具函数 ──────────────────────────────────────────
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function getWeekRange(weekStr) {
  // Parse "2025-W28" -> start (Monday) and end (Sunday) dates
  const [yearStr, weekPart] = weekStr.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekPart);

  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Mon=1 ... Sun=7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

// ── 数据获取 ──────────────────────────────────────────
async function fetchRecentTools(startISO, endISO) {
  // 优先取 7 天内新增/更新的，如果不够就扩大到最近的工具
  let { data, error } = await supabase
    .from("tools")
    .select(
      "id, slug, name_en, name_zh, tagline_en, tagline_zh, description_en, description_zh, category, pricing_type, official_url, logo_url, created_at, updated_at"
    )
    .eq("status", "published")
    .or(`created_at.gte.${startISO},updated_at.gte.${startISO}`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("❌ Fetch tools error:", error.message);
    return [];
  }

  // 如果不够 5 个，补充最新工具
  if (!data || data.length < 5) {
    const { data: fallback } = await supabase
      .from("tools")
      .select(
        "id, slug, name_en, name_zh, tagline_en, tagline_zh, description_en, description_zh, category, pricing_type, official_url, logo_url, created_at, updated_at"
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10);
    data = fallback || data || [];
  }

  return data;
}

async function fetchRecentNews(startISO, endISO) {
  // 先尝试 published_at，再尝试 modified_at
  let { data, error } = await supabase
    .from("news_simple")
    .select(
      "id, slug, title, title_zh, summary, summary_zh, source, source_url, published_at, modified_at"
    )
    .or(`modified_at.gte.${startISO},published_at.gte.${startISO}`)
    .order("modified_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("❌ Fetch news error:", error.message);
    return [];
  }

  // 如果不够，取最新的
  if (!data || data.length < 5) {
    const { data: fallback } = await supabase
      .from("news_simple")
      .select(
        "id, slug, title, title_zh, summary, summary_zh, source, source_url, published_at, modified_at"
      )
      .order("modified_at", { ascending: false })
      .limit(10);
    data = fallback || data || [];
  }

  return data;
}

// ── OpenAI 生成 ──────────────────────────────────────
async function generateWeeklyContent(weekStr, tools, news) {
  const { start, end } = getWeekRange(weekStr);
  const dateRange = `${start.toISOString().slice(0, 10)} ~ ${end.toISOString().slice(0, 10)}`;

  const toolsSummary = tools
    .slice(0, 8)
    .map(
      (t, i) =>
        `${i + 1}. ${t.name_en} (${t.name_zh || t.name_en}) - ${t.category || "AI"} - ${t.tagline_en || t.description_en?.slice(0, 100)}`
    )
    .join("\n");

  const newsSummary = news
    .slice(0, 10)
    .map(
      (n, i) =>
        `${i + 1}. ${n.title} (${n.title_zh || ""}) - ${n.summary?.slice(0, 120) || ""}`
    )
    .join("\n");

  const prompt = `You are the editor of "Jilo.ai Weekly" (AI工具周刊), a bilingual (English + Chinese) newsletter about AI tools and news.

Generate a weekly digest for week ${weekStr} (${dateRange}).

## Available Tools Data:
${toolsSummary || "No new tools this week."}

## Available News Data:
${newsSummary || "No breaking news this week."}

## Output Requirements:
Generate a complete weekly article in Markdown format. The article must be bilingual - each section has both English and Chinese.

Use this EXACT structure:

---
title_en: "Jilo.ai Weekly #XX: [Catchy Title]"
title_zh: "Jilo.ai AI工具周刊 #XX: [吸引人的标题]"
week: "${weekStr}"
date_range: "${dateRange}"
published_at: "${new Date().toISOString().slice(0, 10)}"
description_en: "[One-line summary of this week]"
description_zh: "[本周一句话摘要]"
---

# Jilo.ai Weekly ${weekStr}
# Jilo.ai AI工具周刊 ${weekStr}

> ${dateRange}

## 🛠️ Featured Tools of the Week / 本周精选工具

Pick 3-5 best tools from the list. For each tool:
### [Tool Name]
- **Category**: ...
- **What it does / 功能简介**: One paragraph in English, then Chinese
- **Why we picked it / 推荐理由**: 1-2 sentences each language
- **Pricing / 定价**: ...
- **Link / 链接**: [official_url]

## 📰 AI Headlines / 本周 AI 头条

Pick top 5 news items. For each:
### [Number]. [Headline]
Brief analysis in English (2-3 sentences), then Chinese translation.

## ⭐ Editor's Pick / 编辑推荐

Pick ONE standout tool or news item. Write a deeper 2-paragraph analysis (EN + ZH).

## 🔮 What to Watch / 下周展望

2-3 bullet points about upcoming AI trends or events to watch (EN + ZH).

---

Make the content engaging, insightful, and SEO-friendly. Include relevant keywords naturally.
Do NOT invent tools or news - only use the provided data. If data is limited, focus on quality analysis of what's available.`;

  console.log("🤖 Calling OpenAI to generate weekly content...");

  console.log(`   Using model: ${MODEL}`);
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return response.choices[0].message.content;
}

// ── 主流程 ──────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  let weekStr;

  const weekIdx = args.indexOf("--week");
  if (weekIdx !== -1 && args[weekIdx + 1]) {
    weekStr = args[weekIdx + 1];
  } else {
    weekStr = getISOWeek(new Date());
  }

  console.log(`\n📅 Generating weekly digest for: ${weekStr}`);

  const { start, end } = getWeekRange(weekStr);
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  console.log(`   Date range: ${startISO.slice(0, 10)} ~ ${endISO.slice(0, 10)}`);

  // Fetch data
  console.log("\n📦 Fetching data from Supabase...");
  const [tools, news] = await Promise.all([
    fetchRecentTools(startISO, endISO),
    fetchRecentNews(startISO, endISO),
  ]);

  console.log(`   Found ${tools.length} tools, ${news.length} news items`);

  if (tools.length === 0 && news.length === 0) {
    console.log("⚠️  No data found. Skipping generation.");
    return;
  }

  // Generate content
  const content = await generateWeeklyContent(weekStr, tools, news);

  if (dryRun) {
    console.log("\n--- DRY RUN OUTPUT ---\n");
    console.log(content);
    return;
  }

  // Save to file
  const outDir = path.join(process.cwd(), "content", "weekly");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, `${weekStr}.md`);
  fs.writeFileSync(outFile, content, "utf-8");
  console.log(`\n✅ Weekly digest saved to: ${outFile}`);
  console.log(`   View at: https://jilo.ai/en/weekly/${weekStr}`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});

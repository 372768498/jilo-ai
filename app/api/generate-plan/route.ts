// app/api/generate-plan/route.ts
import { NextRequest, NextResponse } from "next/server";

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

// 统一的系统提示
const SYSTEM_PROMPT = `
You are an AI tool concierge for Jilo.ai. 
Return EXACT JSON with this schema:
{
  "packages": [
    {
      "name": "string",
      "steps": ["3-5 actionable steps"],
      "tools": [{"name":"string","why":"string","url": "string"}],
      "time_hours": "number or range string",
      "cost_month_usd": "number or range string",
      "caveats": ["risks or privacy notes"]
    }
  ]
}
Rules:
- Always produce exactly 3 packages.
- Prefer English UI; include Chinese-friendly stack if constraints mention Chinese.
- No marketing fluff. No extra keys. No markdown. JSON only.
`;

function buildUserPrompt(input: { task: string; budget: string; constraints?: string; locale?: string }) {
  return `Task: ${input.task}
Budget: ${input.budget}
Constraints: ${input.constraints || "none"}
Locale: ${input.locale || "en"}
Output: JSON only as specified.`;
}

async function callAnthropic(prompt: string) {
  const model = "claude-3-5-sonnet-20240620";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey as string,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic error: ${text}`);
  }
  const data = await res.json();
  const content = (data?.content?.[0]?.text || "").trim();
  return content;
}

async function callOpenAI(prompt: string) {
  const model = "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${text}`);
  }
  const data = await res.json();
  const content = (data?.choices?.[0]?.message?.content || "").trim();
  return content;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, budget, constraints, locale } = body || {};
    if (!task || !budget) {
      return NextResponse.json({ error: "Missing task or budget" }, { status: 400 });
    }
    const userPrompt = buildUserPrompt({ task, budget, constraints, locale });

    let raw = "";
    if (anthropicKey) raw = await callAnthropic(userPrompt);
    else if (openaiKey) raw = await callOpenAI(userPrompt);
    else return NextResponse.json({ error: "No model key configured" }, { status: 500 });

    // 解析 JSON
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // 某些模型会包裹 ```json
      const cleaned = raw.replace(/^```json|```$/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    // 最小校验
    if (!parsed || !Array.isArray(parsed.packages)) {
      throw new Error("Bad JSON shape");
    }
    // 截断到3个
    parsed.packages = parsed.packages.slice(0, 3);

    return NextResponse.json(parsed, { status: 200 });
  } catch (e: any) {
    console.error("[generate-plan]", e?.message || e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

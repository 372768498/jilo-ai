// Access layer for the GPT-Image-2 prompt template library.
// Data is static (curated editorial set) in data/prompt-templates.json — no DB.
// Source: awesome-gpt-image-2 (https://github.com/freestylefly/awesome-gpt-image-2).
import raw from "@/data/prompt-templates.json";

export type PromptBlock = {
  key: string;
  label_en: string;
  label_zh: string;
};

export type PromptTemplate = {
  slug: string;
  name_en: string;
  name_zh: string;
  category: string;
  styles: string[];
  scenes: string[];
  tags: string[];
  useWhen_en: string;
  useWhen_zh: string;
  guidance_en: string[];
  guidance_zh: string[];
  pitfalls_en: string[];
  pitfalls_zh: string[];
  exampleCases: string[];
};

export const PROMPT_MODEL: string = raw.model;
export const PROMPT_SOURCE: string = raw.source;
export const PROMPT_BLOCKS: PromptBlock[] = raw.blocks as PromptBlock[];
export const PROMPT_TEMPLATES: PromptTemplate[] = raw.templates as PromptTemplate[];

// Bilingual labels + lucide icon name per category (icon resolved in components).
export const CATEGORY_META: Record<string, { en: string; zh: string; icon: string }> = {
  "UI & Interfaces": { en: "UI & Interfaces", zh: "UI 与界面", icon: "Layout" },
  "Charts & Infographics": { en: "Charts & Infographics", zh: "图表与信息可视化", icon: "BarChart3" },
  "Posters & Typography": { en: "Posters & Typography", zh: "海报与排版", icon: "Type" },
  "Products & E-commerce": { en: "Products & E-commerce", zh: "商品与电商", icon: "ShoppingBag" },
  "Brand & Logos": { en: "Brand & Logos", zh: "品牌与标志", icon: "Sparkles" },
  "Architecture & Spaces": { en: "Architecture & Spaces", zh: "建筑与空间", icon: "Building2" },
  "Photography & Realism": { en: "Photography & Realism", zh: "摄影与写实", icon: "Camera" },
  "Illustration & Art": { en: "Illustration & Art", zh: "插画与艺术", icon: "Palette" },
  "Characters & People": { en: "Characters & People", zh: "人物与角色", icon: "Users" },
  "Scenes & Storytelling": { en: "Scenes & Storytelling", zh: "场景与叙事", icon: "Clapperboard" },
  "History & Classical Themes": { en: "History & Classical Themes", zh: "历史与古风题材", icon: "Scroll" },
  "Documents & Publishing": { en: "Documents & Publishing", zh: "文档与出版物", icon: "FileText" },
  "Other Use Cases": { en: "Other Use Cases", zh: "其他应用场景", icon: "FlaskConical" },
};

export function categoryLabel(category: string, locale: string): string {
  const meta = CATEGORY_META[category];
  if (!meta) return category;
  return locale === "zh" ? meta.zh : meta.en;
}

export function getTemplate(slug: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find((t) => t.slug === slug);
}

export function templateName(t: PromptTemplate, locale: string): string {
  return locale === "zh" ? t.name_zh || t.name_en : t.name_en || t.name_zh;
}

// Stable category order = first appearance in the dataset.
export function orderedCategories(): string[] {
  const seen: string[] = [];
  for (const t of PROMPT_TEMPLATES) if (!seen.includes(t.category)) seen.push(t.category);
  return seen;
}

export function templatesByCategory(): { category: string; items: PromptTemplate[] }[] {
  return orderedCategories().map((category) => ({
    category,
    items: PROMPT_TEMPLATES.filter((t) => t.category === category),
  }));
}

// Related templates: same category first, then shared style/scene, capped.
export function relatedTemplates(t: PromptTemplate, limit = 4): PromptTemplate[] {
  const others = PROMPT_TEMPLATES.filter((x) => x.slug !== t.slug);
  const score = (x: PromptTemplate) => {
    let s = 0;
    if (x.category === t.category) s += 3;
    s += x.styles.filter((v) => t.styles.includes(v)).length;
    s += x.scenes.filter((v) => t.scenes.includes(v)).length;
    return s;
  };
  return others
    .map((x) => ({ x, s: score(x) }))
    .filter((o) => o.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((o) => o.x);
}

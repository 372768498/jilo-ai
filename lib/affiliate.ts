// Affiliate 链接管理
// 当工具有 affiliate 计划时，自动替换为带追踪的链接
// 这是变现的核心 — 用户通过我们的链接注册，我们获得佣金

export type AffiliateConfig = {
  slug: string;       // 工具 slug
  url: string;        // affiliate 链接
  commission: string; // 佣金说明
  program: string;    // 联盟计划名称
  dealText?: string;  // 优惠信息 (e.g. "Free trial + 30% off")
};

// 已接入的 Affiliate 计划
export const affiliateLinks: Record<string, AffiliateConfig> = {
  // ===== AI 写作工具 =====
  "jasper": {
    slug: "jasper",
    url: "https://www.jasper.ai?fpr=jilo",
    commission: "30% recurring",
    program: "Jasper Partner Program",
    dealText: "Free trial + 30% recurring commission",
  },
  "copy-ai": {
    slug: "copy-ai",
    url: "https://www.copy.ai?via=jilo",
    commission: "45% first payment",
    program: "Copy.ai Affiliates",
    dealText: "45% commission on first payment",
  },
  "writesonic": {
    slug: "writesonic",
    url: "https://writesonic.com?ref=jilo",
    commission: "30% recurring",
    program: "Writesonic Affiliates",
    dealText: "Free trial + 30% recurring",
  },
  "grammarly": {
    slug: "grammarly",
    url: "https://www.grammarly.com/upgrade?ref=jilo",
    commission: "20%",
    program: "Grammarly Affiliates",
    dealText: "Free plan available, premium upgrade",
  },
  "rytr": {
    slug: "rytr",
    url: "https://rytr.me?via=jilo",
    commission: "30% recurring",
    program: "Rytr Affiliates",
    dealText: "Free plan + 30% recurring",
  },
  "wordtune": {
    slug: "wordtune",
    url: "https://www.wordtune.com?ref=jilo",
    commission: "20%",
    program: "Wordtune Affiliates",
    dealText: "Free tier available",
  },
  "anyword": {
    slug: "anyword",
    url: "https://anyword.com?fpr=jilo",
    commission: "40% recurring",
    program: "Anyword Partner Program",
    dealText: "Free trial + 40% recurring",
  },

  // ===== AI 视频工具 =====
  "synthesia": {
    slug: "synthesia",
    url: "https://www.synthesia.io?via=jilo",
    commission: "25%",
    program: "Synthesia Affiliates",
    dealText: "25% commission, free demo",
  },
  "pictory": {
    slug: "pictory",
    url: "https://pictory.ai?ref=jilo",
    commission: "20-50%",
    program: "Pictory Affiliates",
    dealText: "Free trial + up to 50% commission",
  },
  "descript": {
    slug: "descript",
    url: "https://www.descript.com?via=jilo",
    commission: "25-40%",
    program: "Descript Affiliates",
    dealText: "Free plan + up to 40% commission",
  },
  "runway-ml": {
    slug: "runway-ml",
    url: "https://runwayml.com?ref=jilo",
    commission: "20%",
    program: "Runway Affiliates",
    dealText: "Free tier + 20% commission",
  },
  "heygen": {
    slug: "heygen",
    url: "https://www.heygen.com?via=jilo",
    commission: "25%",
    program: "HeyGen Affiliates",
    dealText: "Free trial + 25% commission",
  },

  // ===== AI 音频工具 =====
  "elevenlabs": {
    slug: "elevenlabs",
    url: "https://elevenlabs.io?ref=jilo",
    commission: "22%",
    program: "ElevenLabs Affiliates",
    dealText: "Free tier + 22% recurring",
  },
  "murf-ai": {
    slug: "murf-ai",
    url: "https://murf.ai?ref=jilo",
    commission: "20%",
    program: "Murf AI Affiliates",
    dealText: "Free trial + 20% recurring",
  },
  "otter-ai": {
    slug: "otter-ai",
    url: "https://otter.ai?ref=jilo",
    commission: "25%",
    program: "Otter.ai Affiliates",
    dealText: "Free plan available",
  },
  "fireflies-ai": {
    slug: "fireflies-ai",
    url: "https://fireflies.ai?fpr=jilo",
    commission: "30%",
    program: "Fireflies.ai Affiliates",
    dealText: "Free plan + 30% recurring",
  },

  // ===== AI 图片 / 设计工具 =====
  "leonardo-ai": {
    slug: "leonardo-ai",
    url: "https://leonardo.ai?ref=jilo",
    commission: "20%",
    program: "Leonardo AI Affiliates",
    dealText: "Free credits + 20% commission",
  },
  "canva": {
    slug: "canva",
    url: "https://www.canva.com?ref=jilo",
    commission: "15-36%",
    program: "Canva Affiliates",
    dealText: "Free plan + Pro discount",
  },
  "photoroom": {
    slug: "photoroom",
    url: "https://www.photoroom.com?ref=jilo",
    commission: "20%",
    program: "PhotoRoom Affiliates",
    dealText: "Free tier + 20% commission",
  },
  "remove-bg": {
    slug: "remove-bg",
    url: "https://www.remove.bg?ref=jilo",
    commission: "25%",
    program: "remove.bg Affiliates",
    dealText: "Free previews + 25% commission",
  },

  // ===== AI SEO / 营销工具 =====
  "surfer-seo": {
    slug: "surfer-seo",
    url: "https://surferseo.com?fpr=jilo",
    commission: "25%",
    program: "Surfer SEO Affiliates",
    dealText: "Free trial + 25% recurring",
  },
  "semrush": {
    slug: "semrush",
    url: "https://www.semrush.com?ref=jilo",
    commission: "$200/sale",
    program: "Semrush Affiliates (BeRush)",
    dealText: "Free trial + $200 per sale",
  },
  "frase": {
    slug: "frase",
    url: "https://www.frase.io?via=jilo",
    commission: "30% recurring",
    program: "Frase Affiliates",
    dealText: "Free trial + 30% recurring",
  },
  "scalenut": {
    slug: "scalenut",
    url: "https://www.scalenut.com?ref=jilo",
    commission: "30%",
    program: "Scalenut Affiliates",
    dealText: "Free trial + 30% commission",
  },

  // ===== AI 生产力 / 办公工具 =====
  "notion": {
    slug: "notion",
    url: "https://www.notion.so?ref=jilo",
    commission: "15%",
    program: "Notion Affiliates",
    dealText: "Free plan + Plus discount",
  },
  "clickup": {
    slug: "clickup",
    url: "https://clickup.com?ref=jilo",
    commission: "20%",
    program: "ClickUp Affiliates",
    dealText: "Free plan + 20% commission",
  },
  "taskade": {
    slug: "taskade",
    url: "https://www.taskade.com?via=jilo",
    commission: "30%",
    program: "Taskade Affiliates",
    dealText: "Free plan + 30% recurring",
  },

  // ===== AI 编程工具 =====
  "github-copilot": {
    slug: "github-copilot",
    url: "https://github.com/features/copilot",
    commission: "N/A",
    program: "Direct link",
  },
  "cursor": {
    slug: "cursor",
    url: "https://cursor.sh",
    commission: "N/A",
    program: "Direct link",
  },
  "tabnine": {
    slug: "tabnine",
    url: "https://www.tabnine.com?ref=jilo",
    commission: "20%",
    program: "Tabnine Affiliates",
    dealText: "Free plan + 20% commission",
  },

  // ===== AI 图片生成 =====
  "midjourney": {
    slug: "midjourney",
    url: "https://www.midjourney.com",
    commission: "N/A",
    program: "Direct link",
  },

  // ===== 学习平台 =====
  "skool": {
    slug: "skool",
    url: "https://www.skool.com/signup?ref=37b1672271fd4149b32cb4947874e1ba",
    commission: "40% recurring",
    program: "Skool Affiliates",
    dealText: "14-day free trial + 40% recurring",
  },

  // ===== AI 聊天 / 通用 =====
  "tidio": {
    slug: "tidio",
    url: "https://www.tidio.com?ref=jilo",
    commission: "20%",
    program: "Tidio Affiliates",
    dealText: "Free plan + 20% commission",
  },
  "intercom": {
    slug: "intercom",
    url: "https://www.intercom.com?ref=jilo",
    commission: "15%",
    program: "Intercom Affiliates",
    dealText: "Free trial + 15% commission",
  },
};

/**
 * 获取工具的 affiliate 链接，如果没有则返回原始 URL
 */
export function getAffiliateUrl(slug: string, originalUrl?: string): string {
  const config = affiliateLinks[slug];
  if (config) return config.url;
  return originalUrl || '#';
}

/**
 * 判断链接是否是 affiliate 链接 (有佣金的)
 */
export function isAffiliateLink(slug: string): boolean {
  const config = affiliateLinks[slug];
  return !!config && config.commission !== "N/A";
}

/**
 * 获取所有有 affiliate 计划的工具列表
 */
export function getAffiliateTools(): AffiliateConfig[] {
  return Object.values(affiliateLinks).filter(a => a.commission !== "N/A");
}

/**
 * 获取单个工具的 affiliate 配置
 */
export function getAffiliateConfig(slug: string): AffiliateConfig | undefined {
  return affiliateLinks[slug];
}

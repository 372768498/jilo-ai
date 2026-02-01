// Affiliate 链接管理
// 当工具有 affiliate 计划时，自动替换为带追踪的链接
// 这是变现的核心 — 用户通过我们的链接注册，我们获得佣金

export type AffiliateConfig = {
  slug: string;       // 工具 slug
  url: string;        // affiliate 链接
  commission: string; // 佣金说明
  program: string;    // 联盟计划名称
};

// 已接入的 Affiliate 计划
export const affiliateLinks: Record<string, AffiliateConfig> = {
  // AI 写作工具
  "jasper": {
    slug: "jasper",
    url: "https://www.jasper.ai?fpr=jilo",
    commission: "30% recurring",
    program: "Jasper Partner Program",
  },
  "copy-ai": {
    slug: "copy-ai",
    url: "https://www.copy.ai?via=jilo",
    commission: "45% first payment",
    program: "Copy.ai Affiliates",
  },
  "writesonic": {
    slug: "writesonic",
    url: "https://writesonic.com?ref=jilo",
    commission: "30% recurring",
    program: "Writesonic Affiliates",
  },
  // AI 编程工具
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
  // AI 图片工具
  "midjourney": {
    slug: "midjourney",
    url: "https://www.midjourney.com",
    commission: "N/A",
    program: "Direct link",
  },
  "leonardo-ai": {
    slug: "leonardo-ai",
    url: "https://leonardo.ai?ref=jilo",
    commission: "20%",
    program: "Leonardo AI Affiliates",
  },
  // 学习平台
  "skool": {
    slug: "skool",
    url: "https://www.skool.com/signup?ref=37b1672271fd4149b32cb4947874e1ba",
    commission: "40% recurring",
    program: "Skool Affiliates",
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
 * 判断链接是否是 affiliate 链接
 */
export function isAffiliateLink(slug: string): boolean {
  return slug in affiliateLinks;
}

/**
 * 获取所有有 affiliate 计划的工具列表
 */
export function getAffiliateTools(): AffiliateConfig[] {
  return Object.values(affiliateLinks).filter(a => a.commission !== "N/A");
}

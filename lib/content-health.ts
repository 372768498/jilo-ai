/**
 * Content Health Monitor — Protocol 3
 * 
 * 每个页面挂载 lastVerified 时间戳。
 * 超过阈值自动标记为 stale，触发刷新队列。
 */

import { tools, comparisons, alternatives, bestLists } from './link-registry';

export interface HealthStatus {
  slug: string;
  type: 'tool' | 'comparison' | 'alternative' | 'best-list';
  lastVerified: string;
  daysSinceVerified: number;
  status: 'fresh' | 'aging' | 'stale' | 'critical';
  needsRefresh: boolean;
}

const THRESHOLDS = {
  fresh: 14,     // < 14 days = fresh
  aging: 30,     // 14-30 days = aging
  stale: 60,     // 30-60 days = stale
  critical: 90,  // > 90 days = critical
};

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(days: number): HealthStatus['status'] {
  if (days < THRESHOLDS.fresh) return 'fresh';
  if (days < THRESHOLDS.aging) return 'aging';
  if (days < THRESHOLDS.stale) return 'stale';
  return 'critical';
}

export function checkToolHealth(slug: string): HealthStatus | null {
  const tool = tools[slug];
  if (!tool) return null;
  const days = daysSince(tool.lastVerified);
  const status = getStatus(days);
  return {
    slug, type: 'tool', lastVerified: tool.lastVerified,
    daysSinceVerified: days, status,
    needsRefresh: days >= THRESHOLDS.aging,
  };
}

export function getFullHealthReport(): {
  summary: { total: number; fresh: number; aging: number; stale: number; critical: number };
  items: HealthStatus[];
  refreshQueue: HealthStatus[];
} {
  const items: HealthStatus[] = [];

  // Check all tools
  for (const [slug, tool] of Object.entries(tools)) {
    const days = daysSince(tool.lastVerified);
    const status = getStatus(days);
    items.push({
      slug, type: 'tool', lastVerified: tool.lastVerified,
      daysSinceVerified: days, status,
      needsRefresh: days >= THRESHOLDS.aging,
    });
  }

  // Check comparisons (use earliest tool date)
  for (const [slug, comp] of Object.entries(comparisons)) {
    const dates = comp.tools.map(t => tools[t]?.lastVerified).filter(Boolean);
    const earliest = dates.sort()[0] || '2026-01-01';
    const days = daysSince(earliest);
    const status = getStatus(days);
    items.push({
      slug, type: 'comparison', lastVerified: earliest,
      daysSinceVerified: days, status,
      needsRefresh: days >= THRESHOLDS.aging,
    });
  }

  // Check alternatives
  for (const [slug, alt] of Object.entries(alternatives)) {
    const baseDate = tools[alt.baseTool]?.lastVerified || '2026-01-01';
    const days = daysSince(baseDate);
    const status = getStatus(days);
    items.push({
      slug, type: 'alternative', lastVerified: baseDate,
      daysSinceVerified: days, status,
      needsRefresh: days >= THRESHOLDS.aging,
    });
  }

  // Check best lists
  for (const [slug, list] of Object.entries(bestLists)) {
    const dates = list.tools.map(t => tools[t]?.lastVerified).filter(Boolean);
    const earliest = dates.sort()[0] || '2026-01-01';
    const days = daysSince(earliest);
    const status = getStatus(days);
    items.push({
      slug, type: 'best-list', lastVerified: earliest,
      daysSinceVerified: days, status,
      needsRefresh: days >= THRESHOLDS.aging,
    });
  }

  const summary = {
    total: items.length,
    fresh: items.filter(i => i.status === 'fresh').length,
    aging: items.filter(i => i.status === 'aging').length,
    stale: items.filter(i => i.status === 'stale').length,
    critical: items.filter(i => i.status === 'critical').length,
  };

  const refreshQueue = items
    .filter(i => i.needsRefresh)
    .sort((a, b) => b.daysSinceVerified - a.daysSinceVerified);

  return { summary, items, refreshQueue };
}

/**
 * API 端点用：返回需要刷新的内容清单
 */
export function getRefreshQueue(): { slug: string; type: string; daysSince: number }[] {
  const { refreshQueue } = getFullHealthReport();
  return refreshQueue.map(i => ({
    slug: i.slug,
    type: i.type,
    daysSince: i.daysSinceVerified,
  }));
}

/**
 * Link Resolver — 动态链接解析引擎
 * 
 * 根据当前页面上下文，从 Registry 动态匹配三层链接：
 * 1. 向上（Breadcrumbs）— 回溯至分类
 * 2. 向下（Deep Dive）— 指向具体工具
 * 3. 横向（Sidekick）— 竞品 + 对比
 */

import {
  tools, categories, comparisons, alternatives, bestLists,
  type ToolEntity, type CategoryEntity
} from './link-registry';

// ========== Types ==========

export type PageType = 'tool' | 'comparison' | 'alternative' | 'best-list' | 'category' | 'home';

export interface BreadcrumbItem {
  label: string;
  label_zh: string;
  href: string;
}

export interface LinkItem {
  label: string;
  label_zh: string;
  href: string;
  icon?: string;
  description?: string;
  description_zh?: string;
}

export interface ResolvedLinks {
  breadcrumbs: BreadcrumbItem[];
  deepDive: LinkItem[];
  sidekick: {
    competitors: LinkItem[];
    comparisons: LinkItem[];
    alternatives: LinkItem[];
    bestLists: LinkItem[];
  };
}

// ========== Resolver ==========

export function resolveLinks(
  slug: string,
  pageType: PageType,
  locale: string = 'en'
): ResolvedLinks {
  const prefix = `/${locale}`;

  switch (pageType) {
    case 'tool':
      return resolveToolLinks(slug, prefix);
    case 'comparison':
      return resolveComparisonLinks(slug, prefix);
    case 'alternative':
      return resolveAlternativeLinks(slug, prefix);
    case 'best-list':
      return resolveBestListLinks(slug, prefix);
    case 'category':
      return resolveCategoryLinks(slug, prefix);
    default:
      return emptyLinks();
  }
}

function resolveToolLinks(slug: string, prefix: string): ResolvedLinks {
  const tool = tools[slug];
  if (!tool) return emptyLinks();

  // Breadcrumbs: Home → Category → Tool
  const primaryCategory = categories[tool.categories[0]];
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', label_zh: '首页', href: prefix },
    ...(primaryCategory ? [{
      label: primaryCategory.name_en,
      label_zh: primaryCategory.name_zh,
      href: `${prefix}/tools?category=${primaryCategory.slug}`,
    }] : []),
    { label: tool.name, label_zh: tool.name, href: `${prefix}/tools/${tool.slug}` },
  ];

  // Deep Dive: related reviews, guides
  const deepDive: LinkItem[] = [];

  // Sidekick: competitors + comparisons + alternatives
  const competitorLinks = tool.competitors
    .filter(c => tools[c])
    .slice(0, 3)
    .map(c => ({
      label: tools[c].name,
      label_zh: tools[c].name,
      href: `${prefix}/tools/${c}`,
      icon: getCategoryIcon(tools[c].categories[0]),
      description: `View ${tools[c].name} details`,
      description_zh: `查看 ${tools[c].name} 详情`,
    }));

  const comparisonLinks = Object.values(comparisons)
    .filter(c => c.tools.includes(slug))
    .slice(0, 3)
    .map(c => {
      const otherSlug = c.tools.find(t => t !== slug) || c.tools[1];
      const otherTool = tools[otherSlug];
      return {
        label: `${tool.name} vs ${otherTool?.name || otherSlug}`,
        label_zh: `${tool.name} vs ${otherTool?.name || otherSlug}`,
        href: `${prefix}/compare/${c.slug}`,
        icon: '🆚',
      };
    });

  const altLinks = Object.values(alternatives)
    .filter(a => a.baseTool === slug)
    .slice(0, 1)
    .map(a => ({
      label: `${tool.name} Alternatives`,
      label_zh: `${tool.name} 替代方案`,
      href: `${prefix}/alternatives/${a.slug}`,
      icon: '🔄',
    }));

  const bestLinks = Object.values(bestLists)
    .filter(b => b.tools.includes(slug))
    .slice(0, 2)
    .map(b => {
      const cat = categories[b.category];
      return {
        label: `Best ${cat?.name_en || b.category} Tools`,
        label_zh: `最佳${cat?.name_zh || b.category}工具`,
        href: `${prefix}/best/${b.slug}`,
        icon: '🏆',
      };
    });

  return {
    breadcrumbs,
    deepDive,
    sidekick: {
      competitors: competitorLinks,
      comparisons: comparisonLinks,
      alternatives: altLinks,
      bestLists: bestLinks,
    },
  };
}

function resolveComparisonLinks(slug: string, prefix: string): ResolvedLinks {
  const comp = comparisons[slug];
  if (!comp) return emptyLinks();

  const [toolA, toolB] = comp.tools.map(t => tools[t]);
  const cat = categories[comp.category];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', label_zh: '首页', href: prefix },
    { label: 'Compare', label_zh: '对比', href: `${prefix}/compare` },
    { label: `${toolA?.name || comp.tools[0]} vs ${toolB?.name || comp.tools[1]}`, label_zh: `${toolA?.name || comp.tools[0]} vs ${toolB?.name || comp.tools[1]}`, href: `${prefix}/compare/${slug}` },
  ];

  // Deep Dive: link to both tool detail pages
  const deepDive: LinkItem[] = comp.tools
    .filter(t => tools[t])
    .map(t => ({
      label: `${tools[t].name} Full Review`,
      label_zh: `${tools[t].name} 完整评测`,
      href: `${prefix}/tools/${t}`,
      icon: '📋',
    }));

  // Sidekick: other comparisons involving these tools
  const relatedComps = Object.values(comparisons)
    .filter(c => c.slug !== slug && (c.tools.includes(comp.tools[0]) || c.tools.includes(comp.tools[1])))
    .slice(0, 3)
    .map(c => {
      const [a, b] = c.tools.map(t => tools[t]?.name || t);
      return { label: `${a} vs ${b}`, label_zh: `${a} vs ${b}`, href: `${prefix}/compare/${c.slug}`, icon: '🆚' };
    });

  // Alternatives for both tools
  const altLinks = comp.tools
    .map(t => Object.values(alternatives).find(a => a.baseTool === t))
    .filter(Boolean)
    .map(a => ({
      label: `${tools[a!.baseTool]?.name} Alternatives`,
      label_zh: `${tools[a!.baseTool]?.name} 替代方案`,
      href: `${prefix}/alternatives/${a!.slug}`,
      icon: '🔄',
    }));

  return {
    breadcrumbs,
    deepDive,
    sidekick: {
      competitors: [],
      comparisons: relatedComps,
      alternatives: altLinks,
      bestLists: [],
    },
  };
}

function resolveAlternativeLinks(slug: string, prefix: string): ResolvedLinks {
  const alt = alternatives[slug];
  if (!alt) return emptyLinks();

  const baseTool = tools[alt.baseTool];
  const cat = categories[alt.category];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', label_zh: '首页', href: prefix },
    { label: 'Alternatives', label_zh: '替代方案', href: `${prefix}/alternatives` },
    { label: `${baseTool?.name || alt.baseTool} Alternatives`, label_zh: `${baseTool?.name || alt.baseTool} 替代方案`, href: `${prefix}/alternatives/${slug}` },
  ];

  // Deep Dive: each alternative tool's detail page
  const deepDive: LinkItem[] = [
    ...(baseTool ? [{ label: baseTool.name, label_zh: baseTool.name, href: `${prefix}/tools/${baseTool.slug}`, icon: '⭐', description: 'The original tool', description_zh: '原工具' }] : []),
    ...alt.alternatives
      .filter(t => tools[t])
      .map(t => ({
        label: tools[t].name,
        label_zh: tools[t].name,
        href: `${prefix}/tools/${t}`,
        icon: getCategoryIcon(tools[t].categories[0]),
      })),
  ];

  // Sidekick: comparison pages between base tool and alternatives
  const compLinks = Object.values(comparisons)
    .filter(c => c.tools.includes(alt.baseTool))
    .slice(0, 3)
    .map(c => {
      const [a, b] = c.tools.map(t => tools[t]?.name || t);
      return { label: `${a} vs ${b}`, label_zh: `${a} vs ${b}`, href: `${prefix}/compare/${c.slug}`, icon: '🆚' };
    });

  // Related best lists
  const bestLinks = Object.values(bestLists)
    .filter(b => b.category === alt.category)
    .slice(0, 2)
    .map(b => ({
      label: `Best ${cat?.name_en || alt.category} Tools`,
      label_zh: `最佳${cat?.name_zh || alt.category}工具`,
      href: `${prefix}/best/${b.slug}`,
      icon: '🏆',
    }));

  return {
    breadcrumbs,
    deepDive,
    sidekick: {
      competitors: [],
      comparisons: compLinks,
      alternatives: Object.values(alternatives)
        .filter(a => a.slug !== slug && a.category === alt.category)
        .slice(0, 3)
        .map(a => ({
          label: `${tools[a.baseTool]?.name || a.baseTool} Alternatives`,
          label_zh: `${tools[a.baseTool]?.name || a.baseTool} 替代方案`,
          href: `${prefix}/alternatives/${a.slug}`,
          icon: '🔄',
        })),
      bestLists: bestLinks,
    },
  };
}

function resolveBestListLinks(slug: string, prefix: string): ResolvedLinks {
  const list = bestLists[slug];
  if (!list) return emptyLinks();

  const cat = categories[list.category];

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', label_zh: '首页', href: prefix },
    { label: 'Best Tools', label_zh: '最佳工具', href: `${prefix}/best` },
    { label: cat?.name_en || list.category, label_zh: cat?.name_zh || list.category, href: `${prefix}/best/${slug}` },
  ];

  // Deep Dive: each tool in the list
  const deepDive: LinkItem[] = list.tools
    .filter(t => tools[t])
    .map((t, i) => ({
      label: `#${i + 1} ${tools[t].name}`,
      label_zh: `#${i + 1} ${tools[t].name}`,
      href: `${prefix}/tools/${t}`,
      icon: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📋',
    }));

  // Sidekick: related alternatives and comparisons
  const altLinks = Object.values(alternatives)
    .filter(a => a.category === list.category)
    .slice(0, 3)
    .map(a => ({
      label: `${tools[a.baseTool]?.name || a.baseTool} Alternatives`,
      label_zh: `${tools[a.baseTool]?.name || a.baseTool} 替代方案`,
      href: `${prefix}/alternatives/${a.slug}`,
      icon: '🔄',
    }));

  const compLinks = Object.values(comparisons)
    .filter(c => c.category === list.category)
    .slice(0, 3)
    .map(c => {
      const [a, b] = c.tools.map(t => tools[t]?.name || t);
      return { label: `${a} vs ${b}`, label_zh: `${a} vs ${b}`, href: `${prefix}/compare/${c.slug}`, icon: '🆚' };
    });

  return {
    breadcrumbs,
    deepDive,
    sidekick: {
      competitors: [],
      comparisons: compLinks,
      alternatives: altLinks,
      bestLists: Object.values(bestLists)
        .filter(b => b.slug !== slug)
        .slice(0, 3)
        .map(b => {
          const bCat = categories[b.category];
          return {
            label: `Best ${bCat?.name_en || b.category} Tools`,
            label_zh: `最佳${bCat?.name_zh || b.category}工具`,
            href: `${prefix}/best/${b.slug}`,
            icon: '🏆',
          };
        }),
    },
  };
}

function resolveCategoryLinks(slug: string, prefix: string): ResolvedLinks {
  const cat = categories[slug];
  if (!cat) return emptyLinks();

  return {
    breadcrumbs: [
      { label: 'Home', label_zh: '首页', href: prefix },
      { label: cat.name_en, label_zh: cat.name_zh, href: `${prefix}/tools?category=${slug}` },
    ],
    deepDive: cat.tools
      .filter(t => tools[t])
      .map(t => ({
        label: tools[t].name,
        label_zh: tools[t].name,
        href: `${prefix}/tools/${t}`,
        icon: cat.icon,
      })),
    sidekick: {
      competitors: [],
      comparisons: Object.values(comparisons)
        .filter(c => c.category === slug)
        .slice(0, 3)
        .map(c => {
          const [a, b] = c.tools.map(t => tools[t]?.name || t);
          return { label: `${a} vs ${b}`, label_zh: `${a} vs ${b}`, href: `${prefix}/compare/${c.slug}`, icon: '🆚' };
        }),
      alternatives: Object.values(alternatives)
        .filter(a => a.category === slug)
        .slice(0, 3)
        .map(a => ({
          label: `${tools[a.baseTool]?.name || a.baseTool} Alternatives`,
          label_zh: `${tools[a.baseTool]?.name || a.baseTool} 替代方案`,
          href: `${prefix}/alternatives/${a.slug}`,
          icon: '🔄',
        })),
      bestLists: Object.values(bestLists)
        .filter(b => b.category === slug)
        .map(b => ({
          label: `Best ${cat.name_en} Tools`,
          label_zh: `最佳${cat.name_zh}工具`,
          href: `${prefix}/best/${b.slug}`,
          icon: '🏆',
        })),
    },
  };
}

// ========== Helpers ==========

function getCategoryIcon(catSlug: string): string {
  return categories[catSlug]?.icon || '🔧';
}

function emptyLinks(): ResolvedLinks {
  return {
    breadcrumbs: [],
    deepDive: [],
    sidekick: { competitors: [], comparisons: [], alternatives: [], bestLists: [] },
  };
}

/**
 * 获取工具的所有相关页面数量（用于 SEO 权重计算）
 */
export function getToolLinkDensity(slug: string): number {
  const tool = tools[slug];
  if (!tool) return 0;

  const compCount = Object.values(comparisons).filter(c => c.tools.includes(slug)).length;
  const altCount = Object.values(alternatives).filter(a => a.baseTool === slug || a.alternatives.includes(slug)).length;
  const bestCount = Object.values(bestLists).filter(b => b.tools.includes(slug)).length;

  return tool.competitors.length + compCount + altCount + bestCount;
}

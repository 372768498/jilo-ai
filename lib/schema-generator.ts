/**
 * AI-First Schema Generator — Protocol 4
 * 
 * 所有页面的第一步不是写正文，是输出 JSON-LD。
 * 统一生成器，确保 Perplexity/ChatGPT Search/Google Rich Results 引用率。
 */

import { tools, categories, comparisons, alternatives, bestLists } from './link-registry';

const BASE_URL = 'https://jilo.ai';
const ORG = {
  "@type": "Organization",
  "name": "Jilo.ai",
  "url": BASE_URL,
  "logo": `${BASE_URL}/icon.png`,
};

// ========== Tool Detail Page ==========
export function generateToolSchema(slug: string, locale: string, extra?: {
  rating?: number;
  reviewCount?: number;
  description?: string;
}) {
  const tool = tools[slug];
  if (!tool) return [];

  const cat = categories[tool.categories[0]];
  const url = `${BASE_URL}/${locale}/tools/${slug}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": tool.name,
      "url": tool.url,
      "applicationCategory": cat?.name_en || "AI Tool",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": tool.pricing === "free" ? "0" : undefined,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
      },
      ...(extra?.rating && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": extra.rating,
          "bestRating": 5,
          "ratingCount": extra.reviewCount || 1,
        }
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "Review",
      "itemReviewed": { "@type": "SoftwareApplication", "name": tool.name },
      "author": ORG,
      "publisher": ORG,
      "datePublished": tool.lastVerified,
      "reviewBody": extra?.description || `Expert review of ${tool.name}`,
      "url": url,
    },
    generateBreadcrumbSchema([
      { name: "Home", url: `${BASE_URL}/${locale}` },
      { name: cat?.name_en || "Tools", url: `${BASE_URL}/${locale}/tools?category=${tool.categories[0]}` },
      { name: tool.name, url },
    ]),
  ];
}

// ========== Comparison Page ==========
export function generateComparisonSchema(slug: string, locale: string, extra?: {
  description?: string;
  faqs?: { question: string; answer: string }[];
}) {
  const comp = comparisons[slug];
  if (!comp) return [];

  const [toolA, toolB] = comp.tools.map(t => tools[t]);
  const url = `${BASE_URL}/${locale}/compare/${slug}`;
  const title = `${toolA?.name || comp.tools[0]} vs ${toolB?.name || comp.tools[1]}`;

  const schemas: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": `${title}: Complete Comparison Guide`,
      "description": extra?.description || `Detailed comparison of ${title}`,
      "author": ORG,
      "publisher": ORG,
      "datePublished": toolA?.lastVerified || "2026-02-01",
      "dateModified": toolA?.lastVerified || "2026-02-01",
      "mainEntityOfPage": url,
      "about": comp.tools.filter(t => tools[t]).map(t => ({
        "@type": "SoftwareApplication",
        "name": tools[t].name,
        "url": tools[t].url,
      })),
    },
    generateBreadcrumbSchema([
      { name: "Home", url: `${BASE_URL}/${locale}` },
      { name: "Compare", url: `${BASE_URL}/${locale}/compare` },
      { name: title, url },
    ]),
  ];

  if (extra?.faqs && extra.faqs.length > 0) {
    schemas.push(generateFAQSchema(extra.faqs));
  }

  return schemas;
}

// ========== Alternative Page ==========
export function generateAlternativeSchema(slug: string, locale: string, extra?: {
  description?: string;
  faqs?: { question: string; answer: string }[];
}) {
  const alt = alternatives[slug];
  if (!alt) return [];

  const baseTool = tools[alt.baseTool];
  const url = `${BASE_URL}/${locale}/alternatives/${slug}`;
  const title = `Best ${baseTool?.name || alt.baseTool} Alternatives`;

  const altTools = alt.alternatives
    .filter(t => tools[t])
    .map((t, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": tools[t].name,
        "url": tools[t].url,
      },
    }));

  const schemas: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": extra?.description || `Top alternatives to ${baseTool?.name}`,
      "author": ORG,
      "publisher": ORG,
      "datePublished": baseTool?.lastVerified || "2026-02-01",
      "dateModified": baseTool?.lastVerified || "2026-02-01",
      "mainEntityOfPage": url,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": title,
      "numberOfItems": altTools.length,
      "itemListElement": altTools,
    },
    generateBreadcrumbSchema([
      { name: "Home", url: `${BASE_URL}/${locale}` },
      { name: "Alternatives", url: `${BASE_URL}/${locale}/alternatives` },
      { name: title, url },
    ]),
  ];

  if (extra?.faqs && extra.faqs.length > 0) {
    schemas.push(generateFAQSchema(extra.faqs));
  }

  return schemas;
}

// ========== Best List Page ==========
export function generateBestListSchema(slug: string, locale: string, extra?: {
  description?: string;
  faqs?: { question: string; answer: string }[];
}) {
  const list = bestLists[slug];
  if (!list) return [];

  const cat = categories[list.category];
  const url = `${BASE_URL}/${locale}/best/${slug}`;
  const title = `Best ${cat?.name_en || list.category} Tools`;

  const listItems = list.tools
    .filter(t => tools[t])
    .map((t, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": tools[t].name,
        "url": tools[t].url,
      },
    }));

  const schemas: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": extra?.description || `Expert-reviewed list of the best ${cat?.name_en || ''} AI tools`,
      "author": ORG,
      "publisher": ORG,
      "datePublished": "2026-02-01",
      "dateModified": "2026-02-01",
      "mainEntityOfPage": url,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": title,
      "numberOfItems": listItems.length,
      "itemListElement": listItems,
    },
    generateBreadcrumbSchema([
      { name: "Home", url: `${BASE_URL}/${locale}` },
      { name: "Best Tools", url: `${BASE_URL}/${locale}/best` },
      { name: cat?.name_en || list.category, url },
    ]),
  ];

  if (extra?.faqs && extra.faqs.length > 0) {
    schemas.push(generateFAQSchema(extra.faqs));
  }

  return schemas;
}

// ========== Shared Schema Builders ==========

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url,
    })),
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Jilo.ai",
    "url": BASE_URL,
    "description": "Discover, compare and review the best AI tools",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/en/tools?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    ...ORG,
    "sameAs": [],
  };
}

/**
 * 渲染 JSON-LD script tags 的辅助函数
 */
export function renderSchemas(schemas: any[]): string {
  return schemas
    .filter(Boolean)
    .map(s => JSON.stringify(s))
    .join('');
}

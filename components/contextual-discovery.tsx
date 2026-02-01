/**
 * Contextual Discovery 组件 — 无限兔子洞导航
 * 
 * 零配置：只需传入 slug + pageType + locale
 * 自动渲染三层内链：向上（Breadcrumbs）、向下（Deep Dive）、横向（Sidekick）
 * 所有链接由 Link Registry 动态生成，永不硬编码。
 */

import Link from "next/link";
import { resolveLinks, type PageType } from "@/lib/link-resolver";
import { Badge } from "@/components/ui/badge";

interface ContextualDiscoveryProps {
  slug: string;
  pageType: PageType;
  locale: string;
  showBreadcrumbs?: boolean;
  showDeepDive?: boolean;
  showSidekick?: boolean;
}

export function ContextualBreadcrumbs({
  slug,
  pageType,
  locale,
}: {
  slug: string;
  pageType: PageType;
  locale: string;
}) {
  const { breadcrumbs } = resolveLinks(slug, pageType, locale);
  const isZh = locale === "zh";

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        {breadcrumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            {i < breadcrumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {isZh ? crumb.label_zh : crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">
                {isZh ? crumb.label_zh : crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ContextualDeepDive({
  slug,
  pageType,
  locale,
}: {
  slug: string;
  pageType: PageType;
  locale: string;
}) {
  const { deepDive } = resolveLinks(slug, pageType, locale);
  const isZh = locale === "zh";

  if (deepDive.length === 0) return null;

  return (
    <div className="mt-8 p-6 bg-secondary/30 rounded-xl border border-border/50">
      <h3 className="font-bold text-lg mb-4">
        {isZh ? "🔍 深入了解" : "🔍 Deep Dive"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {deepDive.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors group"
          >
            {item.icon && <span className="text-lg">{item.icon}</span>}
            <div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors">
                {isZh ? item.label_zh : item.label}
              </span>
              {item.description && (
                <p className="text-xs text-muted-foreground">
                  {isZh ? item.description_zh : item.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ContextualSidekick({
  slug,
  pageType,
  locale,
}: {
  slug: string;
  pageType: PageType;
  locale: string;
}) {
  const { sidekick } = resolveLinks(slug, pageType, locale);
  const isZh = locale === "zh";

  const hasContent =
    sidekick.competitors.length > 0 ||
    sidekick.comparisons.length > 0 ||
    sidekick.alternatives.length > 0 ||
    sidekick.bestLists.length > 0;

  if (!hasContent) return null;

  return (
    <div className="mt-8 space-y-6">
      {/* Competitors */}
      {sidekick.competitors.length > 0 && (
        <SidekickSection
          title={isZh ? "🏷️ 相关工具" : "🏷️ Related Tools"}
          items={sidekick.competitors}
          locale={locale}
        />
      )}

      {/* Comparisons */}
      {sidekick.comparisons.length > 0 && (
        <SidekickSection
          title={isZh ? "🆚 对比方案" : "🆚 Compare"}
          items={sidekick.comparisons}
          locale={locale}
        />
      )}

      {/* Alternatives */}
      {sidekick.alternatives.length > 0 && (
        <SidekickSection
          title={isZh ? "🔄 替代方案" : "🔄 Alternatives"}
          items={sidekick.alternatives}
          locale={locale}
        />
      )}

      {/* Best Lists */}
      {sidekick.bestLists.length > 0 && (
        <SidekickSection
          title={isZh ? "🏆 最佳推荐" : "🏆 Best Of"}
          items={sidekick.bestLists}
          locale={locale}
        />
      )}
    </div>
  );
}

function SidekickSection({
  title,
  items,
  locale,
}: {
  title: string;
  items: { label: string; label_zh: string; href: string; icon?: string }[];
  locale: string;
}) {
  const isZh = locale === "zh";

  return (
    <div className="p-5 bg-secondary/20 rounded-xl border border-border/30">
      <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Badge
              variant="outline"
              className="hover:bg-primary/10 hover:border-primary/30 cursor-pointer transition-all px-3 py-1.5"
            >
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {isZh ? item.label_zh : item.label}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * 完整的 Contextual Discovery 组件
 * 包含 Deep Dive + Sidekick（Breadcrumbs 通常单独放在页面顶部）
 */
export default function ContextualDiscovery({
  slug,
  pageType,
  locale,
  showBreadcrumbs = false,
  showDeepDive = true,
  showSidekick = true,
}: ContextualDiscoveryProps) {
  return (
    <div className="contextual-discovery">
      {showBreadcrumbs && (
        <ContextualBreadcrumbs slug={slug} pageType={pageType} locale={locale} />
      )}
      {showDeepDive && (
        <ContextualDeepDive slug={slug} pageType={pageType} locale={locale} />
      )}
      {showSidekick && (
        <ContextualSidekick slug={slug} pageType={pageType} locale={locale} />
      )}
    </div>
  );
}

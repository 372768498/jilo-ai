# Jilo.ai Growth Engine Protocol — $10M 系统化增长协议

> 不做一次性装修，做持续复利的增长引擎。

## Protocol 1: Semantic Link Registry（语义映射表）

### 核心理念
禁止硬编码链接。所有实体（工具、分类、对比、替代方案）注册到全局映射表。
页面渲染时根据 Topic Tags 动态匹配注入相关链接。

### 数据结构
```typescript
// lib/link-registry.ts
interface ToolEntity {
  slug: string;
  name: string;
  category: string[];      // ["ai-chatbot", "writing", "coding"]
  tags: string[];           // ["gpt", "llm", "free", "api"]
  competitors: string[];    // ["claude", "gemini", "perplexity"]
  pricing: string;          // "freemium" | "paid" | "free" | "enterprise"
  lastVerified: string;     // ISO date
  status: "active" | "deprecated" | "beta"
}

interface LinkRegistry {
  tools: Record<string, ToolEntity>;
  categories: Record<string, { slug: string; tools: string[] }>;
  comparisons: Record<string, { tools: [string, string] }>;
  alternatives: Record<string, { baseToolSlug: string; altSlugs: string[] }>;
  bestLists: Record<string, { category: string; toolSlugs: string[] }>;
}
```

### 链接解析器
```typescript
// lib/link-resolver.ts
function resolveLinks(currentPage: PageContext): ResolvedLinks {
  // 根据当前页面的 tags/category，从 Registry 动态匹配
  // 返回: breadcrumbs, deepDive, sidekick 三层链接
}
```

### 改版影响
URL 变更 → 只改 Registry → 全站 2000+ 页同步

---

## Protocol 2: Contextual Discovery（情境发现 / 无限兔子洞）

### 三层内链规则
每个页面必须包含：

1. **向上（Breadcrumbs）** — 回溯至所属分类
   - 工具详情 → 分类页 → 首页
   - 对比页 → 对比列表 → 首页

2. **向下（Deep Dive）** — 综述页指向具体工具
   - "Best AI Writing Tools" → 每个工具的详情页
   - 替代方案 → 每个替代工具详情

3. **横向（Sidekick）** — 3 个竞品 + 1 个对比
   - ChatGPT 详情页 → Claude, Gemini, Perplexity + "ChatGPT vs Claude"
   - 由 Link Registry 的 competitors 字段自动生成

### 组件
```typescript
// components/contextual-links.tsx
<ContextualDiscovery 
  currentSlug="chatgpt"
  currentType="tool"
  locale="en"
/>
// 自动渲染三层链接，零配置
```

### 目标
- 0 Orphan Pages（无孤岛页）
- 平均爬取深度 > 5
- 用户平均浏览 > 3 页

---

## Protocol 3: Content Health Monitor（内容健康监控）

### Last-Verified 机制
每个 Programmatic 页面挂载时间戳：
```yaml
lastVerified: "2026-02-01"
lastVerifiedBy: "auto" | "manual"
healthScore: 0.95  # 0-1
staleThreshold: 30 # days
```

### 自动触发规则
- 工具价格变更 → 触发重写所有引用该工具的页面
- 工具排名变动 → 更新 "Best X" 列表
- 工具下线/改名 → 全站链接自动更新（靠 Registry）
- 超过 staleThreshold → 标记为需要刷新

### Cron Job
```
每日 03:00 AM: 扫描所有工具的 lastVerified
- 超过 30 天 → 加入刷新队列
- 超过 90 天 → 标记为 stale，降低展示优先级
每周一: 批量检查工具官网是否存活（HTTP probe）
每月 1 日: 价格/功能全量校验
```

---

## Protocol 4: AI-First Schema（结构化数据优先）

### 规则
所有新生成页面的第一步不是写正文，是输出 JSON-LD。

### 必须包含的 Schema 类型

| 页面类型 | 必须 Schema |
|---------|------------|
| 工具详情 | Product + Review + FAQ + HowTo |
| 对比页 | Article + FAQ + ComparisonTable |
| 替代方案 | Article + ItemList + FAQ |
| 最佳工具 | Article + ItemList + Review |
| 分类页 | CollectionPage + ItemList |
| 首页 | WebSite + Organization + SearchAction |

### 验证
每次构建自动检查：
- 所有页面是否包含必须的 Schema 类型
- JSON-LD 是否符合 Google Rich Results 规范
- FAQ 是否至少 3 个问答

---

## 实施优先级

| 优先级 | 协议 | 预估工时 | 影响面 |
|-------|------|---------|-------|
| P0 | Link Registry + Resolver | 4h | 全站基础设施 |
| P1 | Contextual Discovery 组件 | 3h | 全站内链 |
| P2 | AI-First Schema 统一 | 2h | SEO/GEO |
| P3 | Content Health Monitor | 3h | 长期维护 |

总计约 12h，一次性投入，长期复利。

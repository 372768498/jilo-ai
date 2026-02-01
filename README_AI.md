# README_AI.md — Jilo.ai 项目说明书

## 技术栈
- **框架**: Next.js 14.2.0 (Pages Router + App Router 混合)
- **语言**: TypeScript
- **数据库**: Supabase (PostgreSQL)
- **样式**: Tailwind CSS 3.4 + shadcn/ui
- **部署**: Vercel
- **爬虫**: Python (BeautifulSoup + requests)
- **多语言**: 手动 i18n (en/zh), 路由 `[locale]`

## API 密钥位置
- `.env.local` — 所有密钥（不入 Git）
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase 项目 URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 匿名 Key
  - `SUPABASE_SERVICE_KEY` — Supabase 服务端 Key
  - `OPENAI_API_KEY` — OpenAI API
  - `FAL_KEY` — FAL.AI (Sora2 视频生成)
  - `ADMIN_KEY` — 后台管理密码 (miaosuankeji1121)

## 域名
- 目标域名: `jilo.ai`（需重新绑定 Vercel）
- Vercel 项目: `jilo-ai` (projectId: prj_3BVLcsxQghM5dL52IBCSPfRXgffd)

## 数据库表结构（Supabase）
- `tools` — AI 工具（name_en, name_zh, slug, pricing_type, status...）
- `news` / `news_simple` — 新闻
- `tool_updates` — 工具更新记录

## 部署指令
```bash
cd D:\MiaosuanHQ\jilo-ai
npm install --legacy-peer-deps
npm run build && vercel --prod --yes
```

## 爬虫运行
```bash
cd D:\MiaosuanHQ\jilo-ai\crawler
pip install -r requirements.txt
python main.py
```

## 注意事项
- Vercel cron: 每天 UTC 2:00 跑 `/api/cron`
- 代理问题: 运行前清除 `$env:HTTPS_PROXY=""`
- npm 依赖冲突: 始终用 `--legacy-peer-deps`
- sitemap 当前只有 7 个静态 URL，需要动态生成

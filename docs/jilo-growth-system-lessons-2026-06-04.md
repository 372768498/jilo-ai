# jilo.ai 增长系统 · 经验沉淀(2026-06-04)

> 配套文档:`jilo-growth-commander-upgrade-spec-2026-06-03.md`(目标契约/不变量/判据)。
> 本文是「建成了什么 + 关键决策 + 操作须知 + 教训」的耐用记录,供日后接手。

---

## 1. 系统形态(一句话)

一台**自驱动 + 自迭代**的增长系统:北极星是「每日 PV 在前一日基础上 +20%」,人给方向,执行和学习由系统自己做。两层咬合——
- **增长引擎**(Python crawler,GitHub Actions cron):梯度预算 → 收益反灌 → 健康门控 → 接需求 → ROI 变现。
- **前端/转化层**(Next.js):目录式首页、搜索、量化排行榜、再循环、堵漏。

---

## 2. 增长引擎:三条死边接回(系统从 workflow → Loop 的关键)

审计(2026-06-03,62 分)发现的根因:**反馈数据采到了但读不回决策**。三条死边,用一张共享状态表 `growth_state` 在轮首读取接回:

| 死边 | 接法 | 文件 |
|---|---|---|
| deficit 只做开关不做预算 | `required_pages=ceil(deficit/EST_PV)` 动态 clamp `MAX_*`(不再是常量,I4) | `traffic_growth_agent.py` |
| per-mode PV 收益采了不用 | `effectiveness_lookback` 聚合 → 轮首读 → 加权预算 + 连续0收益 suppress(I2) | `effectiveness_lookback.py` + `traffic_growth_agent.py` |
| guardian verdict 是死胡同 | verdict 写 `growth_state` → 次日 strategy/growth 门控(degraded 冻结新增只留 rewrite) | `autonomy_guardian_agent.py` + `strategy_engine.py` |

**承重墙**:`growth_state`(key/jsonb 状态表)。`scripts/create-growth-state.sql` 已在生产应用。读取**优雅降级**(表缺时返默认值,不崩)。

**实跑验证(已确认)**:第二次 growth 运行 `weighting: static→effectiveness`、aeo 预算 2→6(系统自动把产量倾向最高 PV 的 mode)。这是铁律2 当场被证明——反馈改了下一轮决策。

其余 rank(已做):rank8 日报「目标+20%/缺口」、rank5 GSC 上升词转 alternatives、rank10 真 engagement+竞品 sitemap、rank12 affiliate tracking 校验、rank6 重写保 AEO 格式、rank2 变现进策略+ROI 排序+申请材料包。

---

## 3. 前端/转化层:布局审计 + 重做(PR #4–10)

对标 TAAFT / Futurepedia / Toolify / Future Tools。修了审计找到的每一项:
- 堵漏钱(工具详情 CTA 门控:`official_url` → `affiliate_url||official_url`)
- 孤岛止血(news/reviews/answers 补 Navbar/Footer + `ArticleToolStrip` 再循环 + money 出口;answers Sources 加 nofollow 不喂竞品)
- 全站搜索(navbar → `/tools?q=` 服务端搜索)
- 目录可用化(/tools 搜索/排序默认热度/评分或访问数/Visit)
- 量化排行榜 `/rankings/[type]`(most-popular/top-rated/newest/best-free + ItemList JSON-LD)
- 详情页 alternatives 兜底必出;统一 footer 指向强 hub `/c/[slug]`;填空壳页(reviews 去自链拉真实文章、access/radar 加转化出口)
- **首页重做**:从顾问式分栏 → 目录式(居中搜索主导 + 热门快捷词 + 12 个真实工具 + 分类网格带工具数 + 最新收录)

---

## 4. 关键决策(为什么这么做)

1. **密度瓶颈已从布局转成目录规模**:103 个工具时,硬塞 TAAFT 式行式高密度会显空。下一个密度杠杆是**扩目录 + 补 rating 数据**(自驱动系统的活),不是前端 UI。→ 前端密度收口。
2. **变现最后一步必须人工**:申请联盟 + 粘 tracking link 平台要真人。前面全自动(ROI 排序、申请材料包、自动销账)。
3. **+20%/天对新站是跟域名权重对撞**:58 PV 复利 +20%/天,两个月破 50 万,纯堆内容追不上。真实杠杆是接住已有需求(GSC-rising)+ 提排名 + 时间。系统会持续推,但不会一夜到。

---

## 5. 操作须知(接手必读)

- **本地验证**:`cd crawler && python -m unittest tests.<name>`(Python 逻辑);`npx tsc --noEmit` + `npm run build`(前端,node_modules 已在)。crawler 共 ~80 单测。
- **预存坑**:① `test_rss_news_crawler` 在 Python 3.13 报 `cgi` 缺失(CI 用 3.11,不影响生产)。② 仓库 HEAD 混 CRLF/LF,raw `git diff` 膨胀——审代码用 `git diff --ignore-cr-at-eol`;提交前按 HEAD 行尾归一化。
- **生产凭证**:`.env.local`(根目录)有 `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_KEY`,只读诊断在白名单内。
- **部署**:合并 main → Vercel 自动构建;jilo.ai 有 ~分钟级 CDN 缓存(www.jilo.ai 不同 host 可绕缓存验证)。**定时任务只在 main 跑**(feature 分支的 schedule 不触发)。

---

## 6. 推后项(需先跑出真实数据/DB迁移,不空做)

见 task 跟踪:rank7 重写效果回路、rank11 /answers DB 化、rank9 关键词 suppress + analytics 掉日重试、rank8 A8b 三卡合一、daily_report 基线脆弱(met=None,复用 robust_baseline)、变现 est_epc 真实数据 + API 程序化申请。

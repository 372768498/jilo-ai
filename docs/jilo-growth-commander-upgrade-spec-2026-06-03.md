# jilo.ai 增长指挥官升级 · 目标契约

> 本文件是「防跑偏」的唯一真相源(north star contract)。
> 每一步开工前重读「不变量」,每一条 gap 合并前必须满足其「验收判据」。
> 来源:2026-06-03 的 7 维审计 + 对抗性核验(总分 62,工件 `weyp9soxs.output`)。

---

## 0. 北极星(North Star)

**业务目标:每日 PV 在前一日基础上增长 20%(`PV_GROWTH_TARGET=0.20`)。**

但 +20% 是反馈极慢的指标(数天~数周才显现),**不能用来卡每一步代码**。
本契约把它翻译成**可在每一步当场验证**的系统形态——两根主梁:

1. **缺口 → 梯度预算**:把当日 PV 缺口 `deficit` 翻译成可伸缩的总产量预算,缺口越大产量越大(而非固定上限的开/关)。
2. **收益 → 反灌配额**:把每类动作(source × mode)的真实 PV 收益聚合回 `growth_state`,在轮首改变下一轮的预算分配——高收益加配额,连续 0 收益降配额并撤资。

> **判据总则**:任何一步的「完成」都不是「改好了」,而是**一条可复跑的命令 / dry-run 断言 / git diff** 证明判据成立(铁律 4)。

### 目标决策回路(应有形态,每日一轮)
```
采集 analytics+lookback → 感知 deficit(抗噪基线)+guardian健康+per-mode历史收益
 → 裁决 required_pages=ceil(deficit/EST_PV_PER_PAGE),按收益分配到 SEO/AEO/compare/rewrite/狙击
   (degraded→冻结新增清积压;连续未达标→升档;0产出→suppress撤资)
 → 执行 单一 action_queue,消费端上限随预算浮动
 → 回灌 上线表现进lookback→按source/mode聚合进growth_state→改下一轮配额
 → 通知 一张卡:今日距+20%差多少 / 系统替你做了什么 / 你必须做什么
```

---

## 1. 不变量(Invariants · 红线,不准破)

这些红线直接对应审计里已踩过的坑,写死在此防重犯。任何 PR 破其一即视为跑偏。

| # | 不变量 | 防的坑 |
|---|---|---|
| **I1** | **单一队列裁决**:所有 新增/重写/对比/狙击 动作只走一个 `action_queue`,统一排序。不准旁路出第二条队列。 | 多路产线各自为政 |
| **I2** | **反馈必须有消费者(铁律2)**:任何新写入 `growth_state`/`*_effectiveness` 的字段,必须在**同一 PR 内**有一个轮首读取者据此改变决策。不准只写不读。 | verdict/learning_snapshot 死胡同 |
| **I3** | **AEO 资产不可降级**:重写 `content_type='aeo_answer'` 的页必须保持 AEO 结构并通过结构门,不准用普通 SEO 长文覆盖。 | rank6 反向学习 |
| **I4** | **deficit 必须按比例传导**:`MAX_*_ACTIONS` 不得再是写死常量,必须是 `deficit`/收益的函数(带上下限)。 | rank1 布尔门控 |
| **I5** | **resolve 不得是「字段非空」**:涉及质量/变现的闭合判定必须有真实校验。 | rank12 脏数据误判闭合 |
| **I6** | **通知三类收口**:只发 系统健康结论 / 人工阻塞 / 业务结果变化;空报告必须自抑制(对齐 heartbeat)。 | rank8/11 流水账 |
| **I7** | **外部证据(铁律4)**:每条 gap 合并前,验收判据必须有一条可复跑命令/diff 作证。 | 「已验证」无效 |
| **I8** | **影响面全列(铁律5)**:改 `traffic_growth_agent.py`/`strategy_engine.py` 等热点文件前,先列全调用点。 | 只改一处=没改完 |

---

## 2. 共享地基(承重墙,必须先落一次)

**`growth_state` 状态表** —— rank1/3/4 全建于此。先单独落、单独验,之后才允许任何依赖它的 gap 动工。

- **验收判据 G0**:表存在且可读写;一条 `python -c` 能 upsert 一行(mode/source/pv_per_page/verdict/updated_at)并读回;`traffic_growth_agent` 与 `strategy_engine` 各有一个轮首读取点(grep 可见 reader,满足 I2 的前置)。

---

## 3. 12 条验收判据

> 排序 = 对 +20% 的杠杆。`dep` = 依赖前序。每条只列**可复跑判据**;具体改法见审计工件。

### rank 1 · 【主梁】deficit→梯度预算 · high · M · dep: G0
- **判据 A1**:对 `enqueue_gsc_growth_actions` 注入 `deficit` 做 dry-run:
  - `deficit=5` → 入队数 = 下限(floor);
  - `deficit=5000` → 入队数 ≈ 上限(cap);
  - 中间值**单调递增**。
  打印断言通过,且 `MAX_*` 不再是常量(满足 I4)。
- **判据 A1b**:rewrite 候选(position 11-20、低 CTR 高曝光)与新增进**同一预算池**统一按边际 PV 排序——dry-run 可见缺口变大时 rewrite 量同步上升。

### rank 2 · 变现进 strategy · medium · L · dep: G0
- **判据 A2**:`strategy_engine` dry-run 对「有 `affiliate_url` 但缺 best/compare 落地页 + 高点击」的工具,产出 ≥1 条 `generate_comparison/seo_content` 动作,且该动作进入 `all_actions` 统一排序(不旁路,满足 I1)。
- **判据 A2b**:`monitor_agent._priority` = `click_count*est_epc`,喂两条不同 epc 的同点击工具,高 epc 者排前。

### rank 3 · 【主梁】per-mode 收益反灌配额 · high · L · dep: rank1
- **判据 A3**:seed `growth_state`(mode A 高 PV/页、mode B 连续 N 轮 0),`traffic_growth_agent` dry-run:A 配额上浮、B 降配额或进 suppress。切换 seed 配额随之变(证明在读,满足 I2)。
- **判据 A3b**:`self_iteration_agent` 的 `write_learning_snapshot` 不再写死字符串——grep 确认写入的是真实聚合值。

### rank 4 · guardian 健康回流 · high · M · dep: G0
- **判据 A4**:seed `growth_state.verdict`:
  - `degraded` → 下一轮 `MAX_*=0` 仅留 rewrite;
  - `healthy` → 正常配额;
  - blockers 含 `seo_backlog` → 本轮 `MAX_SEO_ACTIONS=0`。
  切换 verdict 输出随之变(满足 I2)。

### rank 5 · GSC 上升 query 接入热点环 · high · M
- **判据 A5**:给 `search_console_daily` 注入一条 query 从 ~0 跃升至高曝光,`trend_agent` 产出 `source='GSC-rising'` 信号,**绕过 LLM 社区判定**直接走 forced 高优入队;阈值/位置不满足的 query 不注入。

### rank 6 · 重写保 AEO 格式 · high · M · dep: rank7基线机制可并
- **判据 A6**:表现差的 `aeo_answer` 页重写后 `mode='aeo'`,产物通过新增的 `quality_gates._aeo_structure` 门(≥1 table、≥3 FAQ、short-answer 标记、updated 行、≥2 内链),缺任一项触发 retry。
- **判据 A6b**:重写按 **slug update** 而非 insert(无重复行),`news_type` 仍为 `aeo_answer`(无数据错配,满足 I3)。

### rank 7 · 重写效果回写 · medium · M · dep: G0
- **判据 A7**:重写时存 baseline(position/ctr/pv);下个分龄快照到达后算 delta 写入 `rewrite_effectiveness`;`strategy_engine` 有 reader 据此调阈值/cooldown(满足 I2)。seed「重写后无改善」→ dry-run 见该页型门槛抬高/cooldown 拉长。
- **判据 A7b**:确认重写后能触发新快照采集(年龄时钟问题已处理),否则 delta 永远算不出。

### rank 8 · +20% 进通知层 · high · S
- **判据 A8**:`format_daily_report` 对 fixture stats 输出含「目标 +20% / 实际 +X% / 缺口 Y%」一行;未达标卡 color = yellow;连续 3 天未达标(查 `analytics_site_daily`)触发独立「业务结果变化」告警。
- **判据 A8b**:三张日终卡(guardian/daily/manual)收敛为一张「增长指挥官日报」,顶部红/绿 = 今日是否达标。

### rank 9 · 撤资闭环 + 基线抗噪 · medium · M · dep: rank3
- **判据 A9**:N 天 0 click/0 PV 的关键词写入 suppress,enqueue 候选阶段跳过(断言它**不再被重投**)。
- **判据 A9b**:`latest_pv_pair` 返回 `max(yesterday, rolling7_avg)`,对 `total_pageviews=0`/缺行剔除;`analytics_collector` upsert 失败有重试/告警(不再静默掉日)。

### rank 10 · 竞品新页 + 真 engagement · medium · M
- **判据 A10**:`trend_sources` 解析真实 `stars_text`/votes 填 engagement(不再写死 120/100)——喂两个不同 star 数的项目,engagement 不同。
- **判据 A10b**:`COMPETITOR_SITEMAPS` 每日 diff 出新增 URL → 新 slug 反推 keyword 以中权重注入,enqueue 映射成 compare/rewrite(非纯 generate)。

### rank 11 · AEO 渲染 + 空报告抑制 · medium · M
- **判据 A11**:`/answers/<slug>` 改 DB 驱动(读 `news where news_type='aeo_answer'` 复用强模板,含决策表 + Sources 区);`sitemap.ts` 输出 `/answers/<slug>` priority 0.85;`llms.txt` 含 `## Best Answers` 动态段。
- **判据 A11b**:`manual_blockers_report` 在无 schema/变现 flag 时 `return False` 不发送(满足 I6)。

### rank 12 · affiliate 健康校验 · medium · L · dep: rank2
- **判据 A12**:`monitor_agent.check_affiliate_link_health` 对不含 tracking 模式(ref=/aff=/impact 域)或 HEAD 不可达的 URL 入队 `affiliate_link_broken` flag;**喂一个 generic 官网 URL,断言它仍被 flag(不再误判闭合,满足 I5)**。
- **判据 A12b**:有 API 的 program 程序化 update `affiliate_url`;纯网页申请的自动生成申请材料草稿包写进 flag payload。

---

## 4. 建议施工顺序(地基优先,每步过判据再进下一步)

```
阶段0  G0 growth_state 表 ───────────────── 承重墙
阶段1  rank1(A1)──────────────────────── deficit 梯度预算通了
阶段2  rank3(A3)+ rank4(A4)─────────── 收益/健康反灌(补铁律2三条死边)
阶段3  rank8(A8)──────────────────────── +20% 进通知(顺手,S)
阶段4  叶子批(互不重叠,可并行):rank5 / rank10 / rank11 / rank12
阶段5  rank2 / rank6 / rank7 / rank9 ──── 热点文件改动,逐条过影响面(I8)
```

> 每个阶段完成 = 对应判据有可复跑证据(I7),且未破任何不变量。
> 跑偏自检:开工前问三句——「这步对的是哪条北极星主梁?破了哪条不变量没有?判据怎么当场验?」

---

## 5. 构建状态(2026-06-03 实现轮)

证据:`cd crawler && python -m unittest tests.<name>`,共 75 条通过,零回归。

| rank | 状态 | 证据 / 说明 |
|---|---|---|
| G0 growth_state | ✅ 完成 | `test_growth_state`(10)— roundtrip + 降级 |
| rank1 梯度预算 | ✅ 完成 | `test_traffic_growth_budget`(6)— A1/A1b,I4 证明 |
| rank3 收益反灌 | ✅ 完成 | `test_effectiveness_feedback`(9)— A3/A3b,I2 证明 |
| rank4 健康回流 | ✅ 完成 | `test_health_gating`(8)— A4,两 producer 门控 |
| rank8 +20%通知 | ✅ 完成(A8) | `test_daily_report_target`(9);**A8b 三卡合一推后** |
| rank5 GSC上升query | ✅ 完成 | `test_trend_sources_rank5_10` — A5 |
| rank10 真engagement+竞品 | ✅ 完成 | 同上 — A10(GitHub stars + sitemap diff) |
| rank12 affiliate校验 | ✅ 完成 | `test_monetization_health`(6)— A12,I5 证明 |
| rank11 AEO渲染/空报告 | 🟡 部分 | A11b 抑制(`test_manual_blockers_suppress`)+ llms.txt Best Answers 完成;**A11a /answers 页 DB 化推后**(需结构化生成器输出 + Next 构建验证,本地无法验) |
| rank6 重写保AEO格式 | ✅ 完成 | `test_hotfile_rank2_6_9` — A6,I3 证明(结构门 + aeo 重写分派) |
| rank2 变现进策略 | ✅ 完成(核心) | 同上 — A2(monetization 动作 + has_affiliate 标注);**est_epc 列推后**(需 tools 表 schema + 数据) |
| rank9 撤资+基线抗噪 | 🟡 部分 | A9b 抗噪基线(`robust_baseline`)完成;**关键词级 suppress + analytics 重试推后** |
| rank7 重写效果回写 | 🔴 推后 | 本质是跨多日的因果回路(存 baseline→下次快照算 delta→改阈值),**本地无可复跑证据**,半实现会破 I2(写无消费者)。需一次生产运行才能验,故不盲发。 |

### 必须的人工步骤(我无权碰生产库 / 外部)
1. Supabase SQL editor 跑一次 `scripts/create-growth-state.sql`(否则线上读取一直走降级返回默认值,rank3/4 无数据可用)。
2. 可选:GitHub Actions vars 配 `COMPETITOR_SITEMAPS=逗号分隔竞品 sitemap`(启用 rank10 竞品新页监控,默认空=no-op)。
3. 可选:前端改动建议 `npm run build` 验证(llms.txt Best Answers 段我未跑 Next 构建)。

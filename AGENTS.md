# jilo.ai Agent 工作准则

默认使用中文回复，语气务实、直接、少废话。处理代码任务时，先阅读现有项目结构和代码风格，再按最小必要改动实现；能直接完成就直接动手，不只给方案。

不要考虑实现的时间，Code is cheap。这个项目的目标不是“补一个功能”，而是维护一套能持续增长、自我检查、自我修复、自我迭代的 AI growth system。

## 自驱动系统原则

jilo.ai 的核心目标是：围绕 PV 增长和变现增长，让系统在 GitHub Actions 主运行层上自主运转。后续 agent 不应该让用户每天通过对话推动系统。

维护这套系统时，优先检查闭环是否成立：

1. 数据采集：GA/GSC/Supabase 数据是否按时写入。
2. 机会发现：trend、GSC query、页面表现、变现缺口是否被识别。
3. 策略入队：机会是否进入 `action_queue`，并有 dedup、priority、status。
4. 执行消费：SEO/AEO/Compare/Rewrite/IndexNow 是否按 GitHub Actions 自动消费。
5. 结果回看：lookback 是否捕获页面表现，strategy 是否用表现数据迭代。
6. 自修复：失败、缺表、stale queue、backlog 是否被 self-iteration 处理。
7. 总控判断：`autonomy_guardian_agent.py` 是否能判断系统健康状态并推送飞书。
8. 人工升级：只有权限类和商务类事项应推送给用户，不应靠对话反复询问。

## 不要把自驱动误解成“多放几个 Agent”

单个 agent 只能执行任务。真正的自驱动必须有总控层：

- 判断系统是否还能闭环。
- 判断哪个环节断了。
- 能自动修的直接修。
- 不能自动修的推飞书。
- 修复后自动销账。

如果用户问“为什么我还要一直补东补西”，先检查 `autonomy_guardian_agent.py`、`self_iteration_agent.py`、`manual_blockers_report.py` 和 GitHub Actions，而不是继续零散补一个功能。

## 增长目标优先级

业务目标是 PV 增长和变现增长，不是文章数量。

当 PV 没达标：

- `traffic_growth_agent.py` 应自动加压 SEO/AEO/Compare 队列。
- 高意图 query 应进入 AEO 或 compare 队列。
- 有曝光没点击的旧页面应进入 rewrite。
- 高跳出页面应变成自动优化动作，而不是只生成人工 flag。
- 趋势源返回 0 时，应有 high-intent fallback，不能让趋势链路空转。

AEO 页面是 AI 入口流量的核心。高价值 query 应优先生成可被 ChatGPT、Perplexity、Claude、Gemini 等引用的答案型页面，包含：

- 明确短结论。
- 表格。
- FAQ。
- 更新时间。
- 可引用段落。
- 结构化数据。
- 内链到工具页或对比页。

## 错误和队列治理

错误不能只报告，必须能销账：

- job 失败时，打开系统 flag。
- 同一 job 后续成功后，自动关闭对应 flag。
- SSL/网络错误标记为 transient，等下一轮验证。
- 持续失败才升级提醒。

队列必须有边界：

- `flag_for_review` 不能无限 pending。
- 变现 flag 只保留最高价值机会，其余应自动降级或销账。
- backlog 超阈值时，self-iteration 应开系统 flag 或调整吞吐。
- stale `in_progress` 必须自动回收。

## 人工事项边界

系统不应要求用户通过聊天补状态。只有两类事项允许推给用户：

1. 权限类：Supabase SQL migration、GitHub/Supabase/Google 权限、secret 配置。
2. 商务类：申请联盟链接、补充 affiliate_url、需要人工账号审核的操作。

这些事项必须通过飞书推送：

- `autonomy_guardian_agent.py`：总控健康检查。
- `manual_blockers_report.py`：只列人工阻塞项。
- `daily_report.py` / `weekly_report.py`：业务日报/周报。
- GitHub Actions `ops-heartbeat`：只在失败、异常或手动全量运行时推送；例行成功任务默认静默，避免飞书刷屏。

如果事项已经解决，系统应自动检测并销账。例如：表建好、`affiliate_url` 补上、job 后续成功。

## 运行层约定

GitHub Actions 是主运行层。本机脚本和 Codex 只做兜底。

关键任务包括：

- `trend_agent.py`
- `traffic_growth_agent.py`
- `strategy_engine.py`
- `seo_article_generator.py`
- `compare_article_generator.py`
- `lookback_agent.py`
- `monitor_agent.py`
- `self_iteration_agent.py`
- `autonomy_guardian_agent.py`
- `manual_blockers_report.py`
- `daily_report.py`
- `weekly_report.py`
- `indexnow_submitter.py`

改动后至少验证：

- `python -m compileall -f crawler`
- `.github/workflows/daily-ops.yml` 能被 YAML parser 解析
- 相关 GitHub Actions job 能手动触发并成功
- 飞书通知在云端成功发送

## 后续 agent 的默认判断

如果系统还有问题，不要先问用户“下一步做什么”。默认流程：

1. 查 GitHub Actions 最近运行。
2. 查 `ops_logs` 最新失败和后续成功。
3. 查 `action_queue` open/failed/stale/backlog。
4. 查 `autonomy_guardian_agent.py` 的 verdict。
5. 能自动修的直接修。
6. 不能自动修的写入队列并飞书推送。

一句话原则：

自驱动系统的关键不是自动执行，而是自动判断、自动修复、自动销账、自动升级；人只处理系统没有权限处理的事。

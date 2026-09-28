# 增长闭环修复与恢复验收

日期：2026-09-28。分支：`codex/repair-growth-loop-20260928`。

## 已修复

1. Windows 兜底运行器固定使用 `.venv-crawler` Python 3.11，可用 `JILO_PYTHON` 指定解释器；先做依赖预检。子进程失败最终返回非零退出码，日志统一为 UTF-8，成功例行运行静默。保留原文件 BOM。
2. RSS 使用 `feedparser==6.0.12`。本机已建立独立环境，不修改全局 Python 或系统代理。
3. SEO/Compare 批次中的 `failed > 0` 会写入 `ops_logs.status=error` 并返回非零退出码；完整批次明细仍保留，后续成功可继续按既有责任链销账。
4. GA/GSC 支持显式起止日期，限制为最多 62 个已结束日期。GA 按 offset/row_count 分页，GSC 按 startRow 分页；超过安全上限、API 失败或关键表写入失败均不得报告完整成功。
5. GA 全站日表在页面与 referrer 明细成功后最后写入；GSC 整日分页完成后，在现有 `growth_state` 写入 `gsc_collection:YYYY-MM-DD`。新鲜度检查只接受 GSC 完成标记，避免半页写入冒充完整采集。最近三天没有 final 行的结果暂不确认真实零值。
6. 过期或缺测数据会阻断 strategy、growth 和 lookback。GA 容忍 2 天、GSC 容忍 5 天延迟。回看只读取已验证的数据日期；真实零流量保留，发布时间之后尚未可观测的 GSC 指标留空。增长基线保留 0 值，要求从当前日期连续向前取样，不跨缺口使用旧数据。
7. Guardian 报告增加数据日期和缺测原因，移除重复函数；健康判断写入失败会使任务失败。
8. GitHub Actions 增加独立 `analytics-backfill` 入口，日期通过环境变量传递；与日常 analytics 共用作业锁，禁止并发覆盖。`all` 不包含补采，补采不启动内容发布链路。Heartbeat 覆盖全部业务 job。
9. 本机增加独立 `cloud_watchdog.py`，默认只读检查云工作流与最近成功的定时运行。显式 `--repair`/运行器 `-RepairCloud` 才能恢复 `disabled_inactivity` 并请求云端 guardian；人工停用不会被恢复。现有计划任务尚未启用这个修复开关。

## 已完成的验证

- 191 项 Python 测试通过，含批次错误退出、采集分页/日期边界/关键写入失败、缺测与真实零值、Windows 真子进程退出码和监督器边界。
- Python 编译、PowerShell AST 解析、YAML 解析及补采隔离/作业锁/Heartbeat 依赖检查通过。
- 本机实际 `-CheckOnly` 通过，Python 3.11.15、feedparser 6.0.12；内存 RSS 正常解析。
- Supabase HTTPX 继承路由与显式直连均为 HTTP 200，Supabase SDK 只读查询成功；当前模型小请求成功。
- 第一轮独立复核发现的“GSC 部分页放行”和“最新零值被跳过”均已补充回归并修正；最终独立复核记录见本地 mailbox。

这些结果证明本地代码与当前连接可用，不代表云端已恢复。当前云端仍为 `disabled_inactivity`；没有执行提交、推送、云端补采或真实飞书验收发送。

本地证据：`_local_archive/repair-2026-09-28/`；独立审查：`.mailbox/20260928-{pipeline,runtime}-verification.md`。

## 获得发布授权后的执行顺序

1. 只提交本次修复文件，保留原有用户改动；推送修复分支，经 PR 合入 main。
2. 启用 `daily-ops.yml`，确认状态为 active。
3. 单独触发 `job=analytics-backfill`，`start_date=2026-08-14`、`end_date=2026-09-27`。范围覆盖 GSC 最早断档；既有日期使用相同唯一键 upsert，可重跑。
4. 等待该 job 完成，再只读核对 GA 日期覆盖、GSC 完成标记、行数与最新 ops 状态。GSC API 本身仅返回可用的搜索明细，匿名 query、Google 内部上限和数据延迟不等于客户端漏页；不能把明细 UV 相加当月去重访客。
5. 触发 guardian 及所需的采集后任务，核验新 verdict 与责任链销账，并验证一次飞书通知实际响应。单次手动成功不等于定时调度恢复，仍需观察后续 schedule。
6. 将现有 Windows 任务显式加入 `-RepairCloud`，启用云停用自动恢复。机器须在线，任务账号须有可用 gh 权限；本机离线时此兜底不可用。

授权前不要运行带生产写入的业务入口或 `--repair`。仅检查环境可执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-autonomous-growth.ps1 -CheckOnly
.venv-crawler/Scripts/python.exe crawler/cloud_watchdog.py
```

## 回滚与尚未声称完成的事项

- 代码回滚应只回退本次提交；原运行器已备份到 `_local_archive/repair-2026-09-28/runner-before.ps1`，不覆盖用户原有改动。
- 本轮不删除历史数据、不改变数据库 schema、不批量发布草稿，也不填造 affiliate 链接。
- 历史 lookback 和 effectiveness 可能受此前缺测影响，本轮保留历史事实；只有新采集与新回看能作为恢复验收证据。消费者其他查询的历史分页/slug 匹配、内容选题质量与商业联盟资料仍须按独立目标处理。
- 云端权限、补采结果、通知送达、后续定时成功尚待实际验收；整体状态为 PARTIAL。

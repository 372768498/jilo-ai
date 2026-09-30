# 增长闭环修复（2026-09-30）

## 问题与最终行为

- 模型鉴权/上游不可用错误能从嵌套批次明细归类。SEO、AEO、hub、compare 领取动作前做 45 秒无重试真实模型预检；中途鉴权失败停止整批并退回尝试额度。错误消息对密钥字段脱敏。
- 日报采用完整 UTC 日并标明日期；缺测显示缺测，不能填零或把页面 UV 相加。周比较要求连续完整日期。跨日报日保留未恢复错误，空队列和跳过模型的成功不能当成恢复证据。部分失败批次的 saved 仍计为实际产出；队列/回看读取失败显示未知。
- 每个历史可修复 SEO 原动作最多增加一轮三次额度，每轮最多恢复 5 个、活动队列达到 16 则停止；需要 6 小时内模型真实健康证据，保留原尝试次数和失败原因。源动作完成才关闭对应失败标记。旧版修复副本仅在显式 source_repair 关联、同 dedup 且 done 时销账，写入中断可重入。
- 只有 review 积压时允许每模式最多一个新动作；实际任务失败或数据缺测仍限制新内容。AEO 与 SEO 共用积压门禁。增长候选按成功入队数量消耗额度，避免高位候选去重导致低位机会饿死。
- 趋势来源失败保留为可见来源降级；模型失败即使有 fallback 也不伪装成 success。少量信号时仍尝试有界 fallback。
- 持续存在的变现标记刷新当前点击快照。EPC 明确是排序假设，不是实际佣金或损失。仅有近期来源证据的入口可列为申请事项；旧记录过期后转待核实；无效现有链接单列修正，不误报配置完成。

## 入口证据（2026-09-30 核实）

以下仅证明公开入口，不证明 jilo.ai 已获批准、符合全部资格或已经获得佣金：

- [Pixlr](https://pixlr.com/es/affiliate/)
- [Gamma](https://help.gamma.app/en/articles/11048092-how-do-i-join-the-gamma-affiliate-program)
- [Manychat](https://affiliate.manychat.com/)
- [QuillBot](https://quillbot.com/affiliates)
- [Grammarly](https://www.grammarly.com/affiliates)
- [Fliki](https://fliki.ai/affiliate-program)
- [Looka](https://looka.com/affiliate-program/)
- [Speechify](https://speechify.com/affiliates/)

Canva/Canva AI 需先核实 [Canvassador 资格](https://www.canva.com/help/canva-affiliate-marketing-program/)；[NightCafe](https://nightcafe.studio/pages/partner-program) 有关注者门槛。Gemini、Tome 未核实开放申请入口，不能推断没有计划，也不能指派“立即申请”。

## 验收边界

本地回归、独立审查与真实云端验收分别记录在 `_local_archive/repair-2026-09-30/` 和 `.mailbox/20260930-*-verification.md`。本地模型小请求成功不代表云端长内容生成成功；恢复额度不代表所有历史动作已经完成；公开入口不代表商务申请已完成。

回滚代码使用本次提交的 revert。队列恢复保留原动作、原错误和原额度，不通过删除历史或批量假关闭使监控变绿。

# Jilo.ai 用户路径与市场调研报告

日期：2026-05-15

## 1. 核心结论

Jilo.ai 还有机会做到每月 5,000 美金利润，但不能继续做“泛 AI 工具目录”或“战略展示型首页”。现在的问题不是方向错，而是普通用户进入网站后不知道下一步该做什么，站内也没有把流量导向可变现动作。

下一阶段应该把 Jilo.ai 改成：

> 帮普通用户找到、理解、开始使用并决定是否付费的 AI 工具导航站。

商业上，英文线负责高意图 SEO、评测、对比、affiliate、赞助评测、付费提交；中文线负责 AI 入门、工具选择、访问/订阅/工作流落地、少量合规主流渠道推荐。

短期不建议继续堆更多战略页面。应该先重构首页、Tool Finder、工具详情页和外链追踪，把已经有的 GSC 曝光和工具库转成点击、线索和佣金。

## 2. 本站数据诊断

基于本地代码和 Supabase 查询，当前状态如下：

| 项目 | 当前状态 | 判断 |
| --- | --- | --- |
| 工具库 | 418 条工具，108 条 published | 基础资产存在，但还不是可变现目录 |
| affiliate_url | 0 条 | 变现闭环尚未启动 |
| click_count | 样本全为 0 | 外链点击未形成有效追踪和反馈 |
| GSC 数据 | 2,906 条历史查询记录；抽样 2026-04-01 后 1,000 条，曝光 1,636，点击 3 | 已有 SEO 信号，但 CTR 和内容承接弱 |
| GA 页面数据 | 578 条，最新停在 2026-04-08 | GA 链路不完整，近期站内行为不可依赖 |
| analytics_site_daily | 表不存在 | 代码和数据库 schema 漂移 |
| 自动化 | tool_discovery、news_crawler、strategy_engine 在跑 | 抓取能力存在，但产品化筛选不足 |

关键发现：

1. 目前真正露头的 GSC 页面不是首页，而是 review、best、compare、alternatives。
2. 英文 GSC 查询多于中文，但中文旧 GA 页面曾拿到较多页面访问，说明中文需求不是没有，而是现在数据链路断了。
3. `affiliate_url` 为 0，是最直接的收入缺口。即使流量起来，也不会自然产生佣金。
4. 自动化策略现在偏“生成更多内容”，但缺少“用户路径、点击、购买、反馈”的闭环。

## 3. 已出现的 SEO 机会

抽样 GSC 中有价值的方向：

| 页面/关键词 | 信号 | 机会 |
| --- | --- | --- |
| `best-ai-music-generators` | 曝光 271，最高位置 2 | 音乐生成工具适合做 Top list + affiliate + paid alternatives |
| `best-ai-video-generators` | 曝光 218，最高位置 1 | 视频生成是高商业价值赛道，应加入价格、用例、推荐路径 |
| `best-ai-agents` | 曝光 190，已有点击 | Agent 对比内容有机会，但普通用户理解门槛高 |
| `midjourney-v7-review` | 曝光 175，最高位置 1 | 适合做英文评测 + 中文使用路径 |
| `best-ai-video-editing-tools` | 曝光 104 | 可连接 CapCut、Descript、Runway、HeyGen 等替代和购买意图 |
| 中文免费 AI 工具相关 | 多个 query 位置靠前 | 中文用户入口应是“能马上开始用什么” |

这说明 Jilo.ai 不应该从“全站首页讲商业模式”开始，而应该让首页承接这些高意图内容：

- 我想做视频/图片/音乐/写作/编程/学习，应该用哪个 AI？
- 我是小白，先用免费工具还是付费工具？
- ChatGPT、Claude、Cursor、Midjourney 怎么开始？
- 某个工具值不值得买？
- 有没有替代品和优惠？

## 4. 市场对照

外部竞品的共同点：

| 类型 | 代表 | 启发 |
| --- | --- | --- |
| 大目录 | Futurepedia、Toolify、There Is An AI For That | 覆盖广，但普通用户容易迷路；Jilo 不适合只拼数量 |
| 问答/测验式推荐 | AI Cloudbase 等工具站 | 对普通用户更友好，适合首页第一屏 |
| Launch/发现平台 | Product Hunt | 可作为新品扫描源，但不能只搬运，需要筛选和评分 |
| Deal 平台 | AppSumo | 用户购买意图强，适合做 AI deal、Lifetime deal、替代品推荐 |
| 内容评测站 | 各类 `best / vs / alternatives` SEO 站 | 最接近 affiliate 收入，但需要真实测评和清晰 CTA |

参考来源：

- [Product Hunt Launch Guide](https://help.producthunt.com/)
- [AppSumo Marketplace](https://appsumo.com/sell/)
- [AppSumo Affiliate Program](https://appsumo.com/affiliate/)
- [Futurepedia](https://www.futurepedia.io/)
- [Toolify](https://www.toolify.ai/)
- [There Is An AI For That](https://theresanaiforthat.com/)
- [OpenAI Publishers and Developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)

市场判断：

1. “AI 工具目录”已经拥挤，单纯全量扫描没有壁垒。
2. “筛选 + 任务路径 + 是否值得付费 + 如何开始使用”仍然有机会。
3. GEO/AI Search 会让结构化内容、清晰作者判断、对比表、FAQ、引用友好页面更重要。
4. 中文用户对“访问、订阅、上手、避坑”的需求更直接，但必须避开账号灰产和规避风控内容。
5. 英文用户购买力更强，但竞争也更强。要从已有 GSC 信号切入，而不是硬冲 `best ai tools` 这种大词。

## 5. 用户意图矩阵

### 英文用户

| 意图 | 搜索表达 | 最好页面 | 变现方式 |
| --- | --- | --- | --- |
| 找工具 | best AI tools for video editing | Best list | affiliate、赞助位 |
| 做对比 | Runway vs Kling vs Luma | Compare | affiliate、邮件订阅 |
| 找替代 | HeyGen alternatives | Alternatives | affiliate、赞助替代品 |
| 决策购买 | is Midjourney worth it | Review | affiliate、deal |
| 提交产品 | submit AI tool | Submit | 付费提交、赞助评测 |

### 中文用户

| 意图 | 搜索表达 | 最好页面 | 变现方式 |
| --- | --- | --- | --- |
| 小白入门 | AI 工具怎么用、免费 AI 工具推荐 | 入门路径页 | 订阅、社群、课程/资料包 |
| 访问与订阅 | ChatGPT 怎么用、Claude 怎么订阅 | Access 页 | 合规主流渠道 referral |
| 工作流落地 | AI 做 PPT、AI 做视频、AI 写简历 | Workflow 页 | 工具 affiliate、模板包 |
| 避坑 | 某工具值不值得买 | Review/Compare | affiliate、邮件订阅 |
| 信息筛选 | 今天值得看的 AI 工具 | Radar | newsletter、赞助 |

## 6. 下一版首页原则

首页第一屏应该回答一个问题：

> 你想用 AI 解决什么问题？

不再优先展示“Jilo.ai 2.0 的商业战略”。普通用户不关心我们的战略，他们关心自己应该点哪里。

建议首页结构：

1. 第一屏：任务分流器
   - 标题：`找到你真正用得上的 AI 工具`
   - 副标题：`按任务、预算、访问条件和使用难度筛选，不再从几百个工具里乱翻。`
   - 主 CTA：`开始选择`
   - 次 CTA：`查看今天值得关注的 AI 工具`

2. 六个入口卡片
   - 我是 AI 新手
   - 我想做视频/图片/音乐
   - 我想写作/办公/学习
   - 我想编程/自动化
   - 我想找 ChatGPT/Claude/Cursor/Midjourney 的使用方案
   - 我想提交或推广我的 AI 产品

3. Tool Finder 2.0
   - 第一步：选择身份，普通用户、学生、创作者、运营、销售、开发者、创业者
   - 第二步：选择任务，写作、图片、视频、音乐、PPT、编程、搜索、自动化
   - 第三步：选择条件，免费优先、愿意付费、国内可用、需要中文、团队协作
   - 输出：3 个推荐工具，每个给出 `推荐理由 / 免费额度 / 使用门槛 / 是否值得付费 / 下一步`

4. 高意图 SEO 模块
   - Best AI Video Generators
   - Best AI Music Generators
   - Midjourney V7 Review
   - HeyGen Alternatives
   - Cursor vs Copilot vs Windsurf

5. 中文 Access 模块
   - 只放 2-3 个主流合规渠道
   - 不教批量注册、绕风控、账号买卖、规避实名或支付限制
   - 文案重点是“合规、稳定、适合普通用户”

6. Founder/Submit 模块
   - 免费提交
   - 快速审核
   - 赞助评测
   - 分类推荐位

## 7. Tool Finder 2.0 的产品规则

Tool Finder 不是搜索框，而是转化器。

每次推荐都必须包含：

| 字段 | 目的 |
| --- | --- |
| 推荐工具 | 给用户明确答案 |
| 为什么适合你 | 降低理解成本 |
| 价格/免费额度 | 连接购买意图 |
| 国内使用提示 | 服务中文用户 |
| 最佳替代品 | 增加内链和选择感 |
| 访问按钮 | 产生 outbound click |
| 追踪参数 | 统计转化 |

排序不应该只按 `click_count`，而应综合：

- 任务匹配度
- 是否有 affiliate
- 免费/付费偏好
- 中文可用性
- 页面质量
- 最近搜索信号
- 编辑推荐分

## 8. 变现路径

优先级如下：

1. SaaS affiliate
   - 先覆盖有明确购买意图的工具：视频、设计、写作、SEO、PPT、语音、编程。
   - 不要一开始追求 100 个 affiliate，先做 15 个能成交的。

2. 付费提交/赞助评测
   - 面向 AI 创业者和新工具。
   - 前提是站内有清楚的分类页和推荐规则。

3. 中文 Access referral
   - 只保留 2-3 个合规主流渠道。
   - 页面要弱化“灰色技巧”，强化“普通用户如何稳定开始使用”。

4. Newsletter
   - 每周 AI 工具筛选。
   - 承接 GitHub、X、Product Hunt、AppSumo、Hacker News 的扫描结果。

5. 展示广告
   - 暂时不是重点。当前流量规模不足，且会破坏普通用户体验。

## 9. 数据和追踪必须补齐

上线前必须新增或修复这些事件：

| 事件 | 说明 |
| --- | --- |
| `finder_started` | 用户开始选择 |
| `role_selected` | 身份选择 |
| `task_selected` | 任务选择 |
| `budget_selected` | 预算/条件选择 |
| `recommendation_viewed` | 推荐结果曝光 |
| `outbound_click` | 点击官网/联盟链接 |
| `affiliate_click` | 点击 affiliate 链接 |
| `access_solution_click` | 点击中文 access 渠道 |
| `submit_tool_click` | 工具提交入口 |
| `newsletter_signup` | 邮件订阅 |

技术上建议：

1. 新增 `/api/out` 中转链接，统一记录外链点击。
2. 所有外链加 `rel="sponsored nofollow noopener noreferrer"`。
3. 修复 `analytics_site_daily` 表缺失或代码引用。
4. 确认 GA4 和 GSC 凭证在 Vercel/GitHub Actions 中都可用。
5. 每日自动报告不只看曝光，也看点击、推荐结果、affiliate 点击。

## 10. 七天执行计划

### Day 1：产品重构

- 重写首页信息架构。
- 定义 Tool Finder 2.0 数据结构。
- 确定 6 个首页入口和 10 个首批推荐任务。

### Day 2：转化基础设施

- 做 `/api/out` 外链追踪。
- 工具表补 `editor_score`、`access_notes_zh`、`best_for`、`not_for` 等字段。
- 先填 15 个高商业价值 affiliate 或官方 referral。

### Day 3：首页与 Finder 改版

- 首页第一屏变成任务分流器。
- Tool Finder 输出 3 个推荐结果。
- 首页露出已有 GSC 强势页面。

### Day 4：高意图页面改造

- 优先改视频、音乐、Midjourney、HeyGen、Cursor/Copilot 页面。
- 加价格、替代品、推荐理由、CTA、FAQ。

### Day 5：中文路径

- 建 `AI 新手路径`、`ChatGPT/Claude/Cursor/Midjourney 开始使用`。
- 只放 2-3 个合规主流渠道。

### Day 6：扫描和筛选

- 接入或强化 GitHub、Product Hunt、Hacker News、AppSumo、X 的候选池。
- 不直接全量展示，先进入 `Radar`，按评分筛选。

### Day 7：复盘和部署

- 看 GSC、外链点击、Finder 开始率、推荐点击率。
- 决定下一批内容和 affiliate。

## 11. 我会优先做什么

如果我是站长，接下来我会按这个顺序做：

1. 停止继续扩大战略展示页面。
2. 把首页改成普通用户任务分流器。
3. 做 Tool Finder 2.0，让用户 3 步得到推荐。
4. 补外链点击追踪和 15 个 affiliate 链接。
5. 优先改造已有 GSC 曝光的 5 个高意图页面。
6. 中文线只做“新手开始使用 AI”的稳定路径，不碰账号灰产。
7. 每周只看四个指标：GSC 曝光、CTR、Finder 使用率、outbound/affiliate 点击。

这条路更慢一点，但更接近每月 5,000 美金利润。继续堆工具、堆新闻、堆大而全页面，会让网站看起来更丰富，但不会自然变现。

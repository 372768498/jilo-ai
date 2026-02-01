---
title: "OpenClaw 深度评测：GitHub 12万Star的AI助手到底有多强？"
slug: openclaw-review-and-setup-guide
date: 2026-01-31
description: "OpenClaw 深度评测与安装教程。这个 GitHub 12万+ Star 的开源 AI 助手，能在 WhatsApp、Telegram、Discord 上使用，支持邮件管理、日历提醒、浏览器控制、代码执行。本文带你从零搭建。"
author: "Jilo AI 团队"
tags: ["OpenClaw", "AI助手", "开源", "Telegram Bot", "WhatsApp Bot", "自托管AI", "Claude", "Pi Agent"]
category: reviews
lang: zh
toc: true
---

# OpenClaw 深度评测：GitHub 12万Star的AI助手到底有多强？

朋友们，今天这篇文章，我是真的忍不住要写。

如果你最近关注过 GitHub Trending，或者刷过技术圈的推特/X，你大概率见过这个名字——**OpenClaw**。两个月，从 0 到 12 万 Star。这增速，放在 GitHub 历史上都是炸裂级别的。

但 Star 数只是噱头吗？实际用起来到底怎样？

我们团队已经实际使用 OpenClaw 好几周了。今天这篇，既是深度评测，也是从零到一的完整教程。掏心窝子说——这东西，真的有点东西。

## OpenClaw 是什么？

一句话说清楚：**OpenClaw 是一个开源的 AI 助手网关，让你在 WhatsApp、Telegram、Discord、iMessage 上直接使用 AI Agent。**

它的前身叫 Moltbot/Clawdbot，由知名 iOS 开发者 **Peter Steinberger**（[@steipete](https://x.com/steipete)）创建。现在项目已更名为 OpenClaw，代码托管在 [GitHub](https://github.com/openclaw/openclaw)，完全开源。

OpenClaw 不是又一个 ChatGPT 套壳聊天机器人。它的核心架构是：

```
WhatsApp / Telegram / Discord / iMessage
         │
         ▼
   ┌──────────────┐
   │   Gateway     │  ← 网关进程，长期运行
   │  (openclaw)   │
   └──────┬───────┘
          │
          ├─ Pi Agent（AI 编码代理）
          ├─ CLI 命令行
          ├─ Web Dashboard（网页控制面板）
          ├─ macOS App
          ├─ iOS / Android Node
          └─ 浏览器控制
```

你发一条消息，Gateway 接收后交给 AI Agent 处理，Agent 可以执行代码、读写文件、控制浏览器、查邮件、看日历——然后把结果回复到你的聊天窗口。

**整个过程在你自己的机器上运行，数据不经过第三方服务器。**

## 为什么它能火成这样？

12 万 Star 不是白来的，我总结了几个关键原因：

1. **在你已有的 App 里用 AI** — 不用下载新 App，不用切换窗口，直接在 WhatsApp/Telegram 里发消息就行
2. **完全开源+本地运行** — 数据自主，隐私可控，代码透明
3. **功能真的全** — 不是 Demo 级别的玩具，而是有完整的会话管理、记忆系统、心跳检测、多代理路由、插件架构
4. **创始人的号召力** — @steipete 在开发者圈子里信誉极高

X 上的评价也是一边倒的好评：

> "OpenClaw 是第一个真正替代了我某个工作流的 AI 工具。我在 WhatsApp 上给它发消息，它帮我处理收件箱。太疯狂了。"

> "两个月 12 万 Star 不是炒作——这是我们与 AI 交互方式的范式转变。"

## 核心功能一览

### 📱 多平台消息集成

- **WhatsApp** — 通过 Baileys 库实现 WhatsApp Web 协议
- **Telegram** — Bot API，支持私聊和群聊（群聊默认需要 @提及 才响应）
- **Discord** — Bot API，支持私聊和服务器频道
- **iMessage** — macOS 本地集成
- **Mattermost** — 插件支持

所有平台可以同时运行，统一由一个 Gateway 进程管理。

### 📧 邮件管理

通过 Agent 的工具集成，OpenClaw 可以检查收件箱、总结未读邮件、起草回复。在心跳检查周期中，它会自动扫描你的邮箱并在发现重要邮件时主动通知你。

### 📅 日历集成

同样通过心跳系统，OpenClaw 可以扫描接下来 24-48 小时的日程，在你的消息 App 中提醒你即将到来的会议。

### ⏱️ Cron 任务 & 心跳系统

这是 OpenClaw 最独特的功能之一——**心跳系统（Heartbeats）**。

默认每 30 分钟执行一次心跳，检查工作区中的 `HEARTBEAT.md` 文件是否有待处理的任务。你还可以设置精确的 **Cron 定时任务**，比如"每周一早上 9 点提醒我"。

**心跳 vs Cron 的区别：**
- 心跳：批量检查多项内容（邮件+日历+通知），时间可以有偏差
- Cron：精确定时、独立执行、可以用不同的模型

### 🌐 浏览器控制

这个功能简直是 Killer Feature：

- 导航到指定 URL
- 截图和获取页面快照（无障碍树）
- 点击、输入、拖拽、悬停等全套交互
- 在页面上下文中执行 JavaScript
- 管理标签页

想象一下：你在地铁上，给 Telegram 机器人发一条"帮我看看部署面板的状态"，它就打开浏览器、截图、分析，然后把结果发给你。**这就是未来。**

### 📁 文件操作 & 代码执行

底层的 Pi Agent 可以：
- 读写工作区内的任意文件
- 执行 Shell 命令
- 精准编辑代码文件
- 管理 Git 仓库

你发一条"帮我 commit 并 push"，它就真的 commit 并 push 了。

### 🧠 记忆系统

OpenClaw 的记忆系统优雅到令人感动——**纯 Markdown 文件**。

- `memory/YYYY-MM-DD.md` — 每日日志（每次启动加载今天和昨天的）
- `MEMORY.md` — 精选长期记忆（仅在私聊中加载，保护隐私）

还有一个 **向量记忆搜索** 功能，对记忆文件建立语义索引，即使措辞不同也能找到相关笔记。支持 OpenAI Embeddings、Gemini 或本地模型。

最巧妙的是**预压缩记忆刷写**：当会话快达到上下文限制时，OpenClaw 会触发一个静默轮次，提醒 Agent 在上下文被压缩之前把重要记忆写入文件。

## 安装教程

### 前提条件

- **Node.js ≥ 22**（必须）
- **pnpm**（可选，从源码构建推荐）
- Brave Search API key（推荐，用于网页搜索功能）

### macOS / Linux 安装

最快的方式，一行命令：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

或者用 npm/pnpm 全局安装：

```bash
npm install -g openclaw@latest
# 或
pnpm add -g openclaw@latest
```

然后运行引导向导：

```bash
openclaw onboard --install-daemon
```

向导会引导你完成：
- 选择本地/远程 Gateway
- 设置认证（API Key 或 OAuth）
- 配置消息渠道
- 安装后台服务（macOS 用 launchd，Linux 用 systemd）

### Windows 安装（强烈推荐 WSL2）

**⚠️ 重要：OpenClaw 强烈推荐在 Windows 上使用 WSL2。原生 Windows 未经充分测试，工具兼容性较差。**

1. 安装 WSL2：
```powershell
wsl --install
```

2. 在 WSL2 Ubuntu 中执行 Linux 安装步骤：
```bash
curl -fsSL https://openclaw.bot/install.sh | bash
openclaw onboard --install-daemon
```

PowerShell 安装器（实验性）：
```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

### 从源码构建

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build
pnpm build
openclaw onboard --install-daemon
```

### 验证安装

```bash
openclaw status
openclaw health
openclaw security audit --deep
```

## 连接 Telegram 教程

1. 在 Telegram 中找 [@BotFather](https://t.me/botfather)，创建一个新 Bot，获取 Token
2. 运行 `openclaw onboard` 时选择 Telegram，输入 Token；或者手动写入 `~/.openclaw/openclaw.json`
3. 启动 Gateway：`openclaw gateway`
4. 给你的 Bot 发一条私信，首次会收到一个**配对码**
5. 批准配对：

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <配对码>
```

**群聊提示：** 默认情况下，Bot 在群聊中只响应 @提及。管理员可以用 `/activation always|mention` 切换。

## 连接 WhatsApp 教程

这是让所有人兴奋的功能——WhatsApp 里的 AI 助手。

1. **准备一个第二手机号**（副卡、eSIM 或预付费卡）。千万别用你的主号——否则所有消息都会变成 Agent 输入。

2. 运行 QR 登录：
```bash
openclaw channels login
```

3. 用助手手机打开 WhatsApp → 设置 → 关联设备，扫描 QR 码

4. 配置允许的发送者：
```json
{
  "channels": {
    "whatsapp": {
      "allowFrom": ["+8613800138000"]
    }
  }
}
```

5. 用你的号码给助手号发消息，搞定！

## 🇨🇳 国内使用注意事项

这是中文读者最关心的部分，我直说：

### 网络环境

**OpenClaw 本身不需要翻墙安装**——npm 包正常可装。但是：

1. **AI API 调用需要网络环境支持** — 你需要能访问 Anthropic（Claude）或 OpenAI 的 API。这意味着你的 Gateway 服务器需要能访问这些 API 端点。
2. **WhatsApp 需要网络环境支持** — WhatsApp 在国内无法直接使用。
3. **Telegram 需要网络环境支持** — 同上。

**推荐方案：**
- 方案 A：在海外 VPS 上运行 Gateway（推荐，最省心）
- 方案 B：本地运行 + 代理环境（设置 `HTTPS_PROXY` 环境变量）
- 方案 C：用 Tailscale 组网连接海外服务器

### API Key 获取

| 提供商 | 获取方式 | 注意事项 |
|--------|---------|---------|
| Anthropic (Claude) | [console.anthropic.com](https://console.anthropic.com) | 需要海外手机号注册，支持信用卡付费 |
| OpenAI | [platform.openai.com](https://platform.openai.com) | 同上 |

**💡 小贴士：** 如果你有 Claude Pro/Max 订阅，可以通过 OAuth 方式认证，不需要单独买 API Key。但 OpenClaw 官方更推荐直接用 API Key，更稳定。

### Discord 可正常使用

Discord 在国内可以直接使用（不需要特殊网络环境），所以如果你只打算用 Discord 集成，网络问题会简单很多。

## 实际使用体验

说了这么多功能，实际用起来感觉如何？以下是我们团队几周使用下来的真实感受。

### 🥳 让我们兴奋的点

**"随时随地"的感觉太爽了。** 以前用 AI 助手，得打开电脑、开浏览器、进 ChatGPT。现在？掏出手机，在 Telegram 里打几个字就行。坐地铁的时候让它帮你查邮件、在外面吃饭的时候让它帮你改代码——这种体验一旦习惯了就回不去了。

**记忆系统比想象中好用。** 我们告诉它一次项目截止日期，之后它就一直记着，跨会话也不会忘。Markdown 文件的方案虽然简单，但胜在透明可控——你随时可以打开文件看看它记了什么。

**浏览器控制是杀手锏。** 发一条消息"帮我看看我们的 Vercel 部署状态"，它就打开浏览器、截图、分析，然后把结果发回来。第一次体验的时候我们团队集体"卧槽"了。

**心跳系统改变了人机关系。** 传统 AI 助手是你问它答。有了心跳，OpenClaw 会主动检查你的邮箱和日历，在重要事情发生时主动联系你。这不再是"工具"，而是"助手"。

### 😅 还可以更好的地方

**安装门槛不低。** 需要 Node 22+、第二手机号（WhatsApp 用）、API Key、熟悉命令行……这不是给普通用户的产品。

**API 费用需要管理。** 用 Claude Opus 4.5 + 频繁心跳，一个月账单可以很可观。

**WhatsApp 连接偶尔断线。** Baileys 库有时候会断连，虽然会自动重连，但还是能注意到。

**Windows 支持是二等公民。** 必须用 WSL2，原生 Windows 基本没法用。

## 定价分析

OpenClaw 本身**完全免费开源**。费用来自 AI 模型的 API 调用：

### 月费估算

| 使用强度 | 模型 | 预估月费 |
|---------|------|---------|
| 轻度（10-20条/天） | Claude Sonnet | ¥35–100 |
| 中度（30-50条/天） | Claude Sonnet | ¥100–280 |
| 重度（50+条/天，带心跳） | Claude Opus 4.5 | ¥350–1000+ |
| 极客模式（编码+浏览器+心跳全开） | Claude Opus 4.5 | ¥700–2000+ |

**省钱技巧：**
- 日常任务用 Claude Sonnet，复杂任务才切 Opus
- 心跳间隔设为 60 分钟或不需要时关闭
- 用 `/compact` 压缩会话上下文
- 配置会话自动重置（每天或空闲后重置）

### 其他费用

- **Brave Search API**：有免费额度
- **第二手机号**（WhatsApp 用）：约 ¥20-70/月
- **VPS**（可选）：本地运行免费；海外 VPS 约 ¥35-140/月

## OpenClaw vs ChatGPT vs Claude Desktop 对比

| 功能 | OpenClaw | ChatGPT Plus/Pro | Claude Desktop Pro/Max |
|------|----------|-------------------|------------------------|
| **价格** | 免费（自带 Key） | ¥140–1400/月 | ¥140–700/月 |
| **开源** | ✅ 是 | ❌ 否 | ❌ 否 |
| **数据隐私** | ✅ 完全本地 | ❌ 云端 | ❌ 云端 |
| **WhatsApp 集成** | ✅ 原生 | ❌ 无 | ❌ 无 |
| **Telegram 集成** | ✅ 原生 | ❌ 无 | ❌ 无 |
| **Discord 集成** | ✅ 原生 | ❌ 无 | ❌ 无 |
| **浏览器控制** | ✅ 完整自动化 | ❌ 无 | ✅ 有限（computer use） |
| **代码执行** | ✅ 完整 Shell | ✅ 沙箱 | ✅ 沙箱 |
| **文件系统** | ✅ 完整 | ❌ 有限 | ✅ 本地文件 |
| **持久记忆** | ✅ Markdown+向量 | ✅ 内置 | ✅ 项目记忆 |
| **主动推送（心跳）** | ✅ 可配置 | ❌ 无 | ❌ 无 |
| **Cron 定时任务** | ✅ 有 | ❌ 无 | ❌ 无 |
| **多代理路由** | ✅ 有 | ❌ 无 | ❌ 无 |
| **自定义人设** | ✅ SOUL.md | ❌ 有限（GPTs） | ❌ 系统提示 |
| **安装难度** | 🔧 中高 | ✅ 简单 | ✅ 简单 |
| **手机使用** | ✅ 消息 App | ✅ 原生 App | ✅ 原生 App |

**核心差异化：** OpenClaw 是唯一一个能把全功能 AI Agent 放进你*现有*消息 App 里、且数据完全自主的方案。

## 适合谁？

### ✅ 非常适合

- **开发者和高级用户** — 想要 AI Agent 融入日常消息工作流
- **隐私至上者** — 要求所有数据留在自己的硬件上
- **折腾爱好者** — 喜欢配置、脚本化、扩展工具
- **远程工作者** — 想要通过手机获得主动的邮件/日历管理
- **技术团队** — 想在 Discord/Mattermost 频道中共享 AI 助手

### ❌ 不太适合

- **非技术用户** — 安装需要命令行和 API Key 知识
- **预算敏感用户** — Opus 级别模型的重度使用费用不低
- **只用 iPhone 且不愿折腾的用户** — 有 iOS Node 但不是独立 App
- **想要"开箱即用"的人** — 这是一把瑞士军刀，不是一键式消费产品

## FAQ

### 1. OpenClaw 真的免费吗？

软件 100% 免费开源。但你需要自带 AI 提供商的 API Key（Anthropic 或 OpenAI），这部分按使用量计费。类比：OpenClaw 像一个自托管的邮件客户端——软件免费，但你需要一个邮件服务提供商。

### 2. 不用 WhatsApp 也可以吗？

当然可以！你可以只用 Telegram、Discord、iMessage、Mattermost（插件），甚至只用内置的 Web Dashboard（`http://127.0.0.1:18789/`）。WhatsApp 只是选项之一。

### 3. 数据安全吗？

所有数据存储在你自己的机器上——会话文件、记忆、凭证，全部本地。Gateway 默认绑定到 `127.0.0.1`（仅本地访问）。API 调用会发送到你选择的 AI 提供商，这部分遵循提供商的隐私政策。

### 4. 可以部署在服务器上吗？

可以！很多用户在 Linux VPS 上运行。用 `openclaw onboard --install-daemon` 安装为 systemd 服务。远程访问推荐用 SSH 隧道或 Tailscale。

### 5. 国内用户怎么解决网络问题？

最推荐的方案是在海外 VPS 上运行 Gateway（比如 AWS Tokyo、DigitalOcean Singapore）。本地运行的话需要确保 Gateway 进程能访问 Anthropic/OpenAI 的 API 端点。Discord 集成在国内可以直接使用，WhatsApp 和 Telegram 需要额外的网络环境支持。

## 总结

OpenClaw 是那种**配得上自己热度**的项目。12 万 GitHub Star 不是虚的——它代表了开发者们对"在已有消息 App 中使用全功能 AI Agent"这一愿景的真实渴望。

完美吗？不完美。安装有门槛，API 费用需要管理，Windows 支持还在追赶。但如果你是一个重视隐私、喜欢折腾、想要一个真正的 AI 助手融入日常生活的技术用户——OpenClaw 目前是独一无二的选择。

心跳系统将人机关系从"你问我答"升级为"主动服务"。记忆系统简单到优雅，透明到安心。消息集成让你再也不用为了使用 AI 而打断手头的事情。

**我们的评分：9/10。** 对技术用户而言，这是一个真正改变工作流的工具。唯一扣分的地方是安装门槛——但说实话，配得上这个功能集的用户，大概率也不会被安装难倒。

开始使用：[https://docs.openclaw.ai/start/getting-started](https://docs.openclaw.ai/start/getting-started)

GitHub：[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)

---

*本评测基于我们团队的实际使用体验，与 OpenClaw 项目无利益关联。评测时间：2026 年 1 月。*

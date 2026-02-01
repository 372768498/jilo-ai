---
title: "Midjourney 完全上手指南：从注册到出图的全流程教程"
description: "全面掌握 Midjourney 的使用方法，涵盖注册流程、基础操作、参数详解（--ar、--v、--style、--chaos、--stylize）、10 个场景提示词模板，以及写实、动漫、水彩、油画等风格对比。"
date: 2025-01-31
author: "Jilo AI"
tags: ["Midjourney", "AI绘画", "图像生成", "AI教程", "提示词", "数字艺术", "创意AI"]
---

# Midjourney 完全上手指南：从注册到出图的全流程教程

Midjourney 已经成为 AI 图像生成领域的标杆工具，能够产出媲美专业摄影和插画的惊艳视觉作品。无论你是需要快速原型设计的设计师、需要吸睛素材的营销人员，还是探索新创作可能的艺术爱好者，Midjourney 都是 2025 年不可或缺的创作利器。

本指南将从零开始，带你走完从创建第一张图片到掌握高级参数、建立一致视觉风格的全部旅程。

---

## 目录

1. [入门：注册与设置](#入门注册与设置)
2. [第一张图片：基础操作](#第一张图片基础操作)
3. [了解操作界面](#了解操作界面)
4. [参数深度解析](#参数深度解析)
5. [提示词技巧：提升出图质量](#提示词技巧提升出图质量)
6. [10 个场景专用提示词模板](#10-个场景专用提示词模板)
7. [风格参考与对比](#风格参考与对比)
8. [进阶功能](#进阶功能)
9. [实用技巧与最佳实践](#实用技巧与最佳实践)
10. [常见问题](#常见问题)

---

## 入门：注册与设置

### 第一步：创建 Discord 账号（如尚未注册）

Midjourney 主要通过 Discord 运行，同时也提供了网页界面。

1. 访问 [discord.com](https://discord.com) 并创建账号
2. 下载 Discord 客户端（桌面版或手机版），体验更佳

> 💡 **提示：** Discord 在国内可以正常访问和使用，无需特殊网络工具。

### 第二步：订阅 Midjourney

1. 访问 [midjourney.com](https://www.midjourney.com)
2. 使用 Discord 账号 **Sign In（登录）**
3. 选择订阅方案：

| 方案 | 价格 | GPU 时间 | 功能特点 |
|------|------|----------|----------|
| **Basic** | $10/月 | 约 3.3 小时/月 | 标准生成，网页端访问 |
| **Standard** | $30/月 | 15 小时/月 | 无限慢速模式，隐身模式 |
| **Pro** | $60/月 | 30 小时/月 | 12 个并行快速任务，隐身模式 |
| **Mega** | $120/月 | 60 小时/月 | 12 个并行快速任务，额外 GPU 时间 |

**建议：** 从 Basic 开始学习。当你上手后，升级到 Standard —— 无限的慢速模式对于反复试验来说非常重要。

> 🔔 **付费提示：** 需要海外信用卡或支持国际支付的虚拟卡。

### 第三步：开始使用 Midjourney

**通过 Discord：**
1. 加入 Midjourney 官方 Discord 服务器
2. 进入任意 `#general` 或 `#newbie` 频道
3. 输入 `/imagine` 后跟你的提示词

**通过网页端（midjourney.com）：**
1. 登录 midjourney.com
2. 点击 "Create" 进入网页编辑器
3. 在输入框中输入提示词
4. 网页界面更简洁、更直观

---

## 第一张图片：基础操作

### /imagine 命令

在 Discord 中，一切从 `/imagine` 命令开始：

```
/imagine prompt: a cozy coffee shop on a rainy day, warm lighting, 
steam rising from cups, watercolor style
```

几秒钟后，Midjourney 会生成 4 张图片的网格。接下来你可以：

- **U1-U4**：放大某张图片（获取全分辨率）
- **V1-V4**：基于某张图片生成变体
- **🔄**：重新生成——完全新的 4 张图片

### 好提示词的结构

一个结构良好的 Midjourney 提示词遵循以下模式：

```
[主体] + [描述/细节] + [环境/场景] + [风格/媒介] + [光线] + [参数]
```

**示例：**
```
/imagine prompt: a samurai warrior standing on a cliff, cherry blossoms 
falling, dramatic sunset, cinematic lighting, hyperrealistic photography, 
8K resolution --ar 16:9 --v 6.1
```

### 关键原则

1. **描述性，而非指令性**：说"一辆红色跑车"而不是"把车变成红色"
2. **重要元素放在前面**：Midjourney 对开头的词汇赋予更大权重
3. **用逗号分隔概念**：帮助 AI 区分不同元素
4. **避免否定句**：不要说"没有人"，而是使用 `--no people` 参数

---

## 了解操作界面

### Discord 机器人命令

| 命令 | 功能 |
|------|------|
| `/imagine` | 根据文字提示词生成图片 |
| `/describe` | 上传图片，获取提示词建议 |
| `/blend` | 混合 2-5 张图片 |
| `/shorten` | 分析并优化过长的提示词 |
| `/settings` | 调整默认设置 |
| `/info` | 查看订阅状态和 GPU 使用情况 |

### 网页界面功能

midjourney.com 的网页界面提供：

- **Gallery（画廊）**：浏览你所有生成的图片
- **Create（创建）**：使用简洁编辑器生成新图片
- **Explore（探索）**：发现其他用户的作品和提示词
- **Organize（整理）**：将图片分类到文件夹和集合中
- **Edit（编辑）**：直接使用局部重绘和外扩工具

---

## 参数深度解析

参数使用 `--` 语法添加在提示词末尾。它们是精确控制 Midjourney 输出的关键。

### --ar（宽高比）

控制图片的宽高比例。

```
--ar 1:1    → 正方形（默认）—— 头像、社交媒体帖子
--ar 16:9   → 宽屏 —— 桌面壁纸、YouTube 缩略图
--ar 9:16   → 竖屏 —— 手机壁纸、Instagram 快拍
--ar 3:2    → 经典照片比例 —— 印刷摄影
--ar 4:5    → 竖版照片 —— Instagram 信息流帖子
--ar 21:9   → 超宽屏 —— 电影感、全景图
--ar 2:3    → 高竖版 —— Pinterest 图钉、书籍封面
```

**示例：**
```
/imagine prompt: sweeping mountain landscape at golden hour, 
dramatic clouds --ar 21:9
```

### --v（版本）

选择 Midjourney 模型版本。每个版本有不同的特点。

```
--v 6.1    → 最新版本，整体质量和提示词遵循度最佳
--v 6      → 出色的细节，强大的文字渲染
--v 5.2    → 美丽的审美，稍偏艺术化诠释
--niji 6   → 动漫/插画专用模型
```

**示例：**
```
/imagine prompt: cyberpunk street scene with neon signs --v 6.1
```

### --style（风格）

调整模型版本内的美学强度。

```
--style raw    → 减少 Midjourney 的"美化"，更忠实于提示词
--style scenic → 增强风景和环境美感（niji 模型专用）
--style cute   → 更柔软、可爱的美学（niji 模型专用）
--style expressive → 更动态、更有情感的诠释（niji 模型专用）
```

**示例：**
```
/imagine prompt: product photography of a luxury watch on marble --style raw --v 6.1
```

### --chaos（混乱度，0-100）

控制 4 张初始图片之间的差异程度。

```
--chaos 0     → 4 张图片非常相似（安全、可预测）
--chaos 25    → 适度变化（探索时的好默认值）
--chaos 50    → 显著变化（非常适合头脑风暴）
--chaos 100   → 最大变化（疯狂、意想不到的结果）
```

**示例：**
```
/imagine prompt: futuristic city --chaos 75
```

**何时用高 chaos：** 早期探索、头脑风暴、发现意想不到的构图。
**何时用低 chaos：** 优化特定概念、保持一致性。

### --stylize（风格化程度，0-1000）

控制 Midjourney 自身艺术诠释的程度。可缩写为 `--s`。

```
--s 0       → 最低艺术风格化，紧密遵循提示词
--s 100     → 低风格化（v6 默认值）
--s 250     → v5 默认值，平衡
--s 500     → 强艺术诠释
--s 750     → 很强的风格化，绘画质感
--s 1000    → 最大风格化，高度艺术化
```

**示例对比：**
```
/imagine prompt: a simple wooden chair --s 0
/imagine prompt: a simple wooden chair --s 750
```

第一个会给你一把真实的椅子；第二个会将它变成一件艺术杰作。

### --no（否定提示）

从图片中排除特定元素。

```
--no text, watermark, people, borders
```

**示例：**
```
/imagine prompt: serene forest path, morning light --no people, animals, text
```

### --seed（种子值）

提供特定的种子数字以获得可复现的结果。

```
--seed 12345
```

使用相同种子 + 相似提示词可获得一致的结果。适合在保持相同构图的同时迭代尝试。

### --tile（平铺）

创建无缝可平铺的图案。

```
/imagine prompt: floral pattern, vintage wallpaper design --tile
```

### --q（质量）

控制渲染质量和时间。

```
--q .25   → 四分之一质量（最快，最低细节）
--q .5    → 一半质量
--q 1     → 标准质量（默认）
```

---

## 提示词技巧：提升出图质量

### 1. 分层描述法

逐层构建你的提示词：

```
/imagine prompt: [第1层：主体] a young woman reading a book,
[第2层：细节] wearing a cream knit sweater, round glasses, 
[第3层：场景] sitting by a window in a cozy library,
[第4层：氛围] soft afternoon light streaming in, dust particles in air,
[第5层：风格] shot on Kodak Portra 400, 85mm lens, shallow depth of field
--ar 3:2 --v 6.1
```

### 2. 摄影术语法

使用摄影专业术语能产出极其真实的效果：

```
拍摄角度：close-up（特写）, medium shot（中景）, wide angle（广角）, 
          bird's eye view（鸟瞰）, low angle（低角度）, macro（微距）

镜头规格：35mm lens, 85mm portrait lens, 200mm telephoto, tilt-shift

胶片类型：Kodak Portra 400, Fujifilm Velvia, Ilford HP5, Cinestill 800T

光线类型：golden hour（黄金时段）, blue hour（蓝色时刻）, 
          Rembrandt lighting（伦勃朗光）, rim lighting（轮廓光）, 
          neon lighting（霓虹灯光）, chiaroscuro（明暗对比）
```

### 3. 艺术媒介指定

指定创作媒介可获得截然不同的视觉风格：

```
digital art（数字艺术）, oil painting（油画）, watercolor（水彩）, 
charcoal sketch（炭笔速写）, pencil drawing（铅笔画）, 
acrylic painting（丙烯画）, gouache（水粉）, pastel（粉彩）, 
ink wash（水墨）, linocut print（木刻版画）, risograph（孔版印刷）
```

### 4. 艺术风格参考

引用知名艺术风格（避免在世个人艺术家的名字）：

```
Art Nouveau style（新艺术风格）, Bauhaus design（包豪斯设计）, 
Impressionist painting（印象派）, Studio Ghibli aesthetic（吉卜力风格）, 
Pixar style（皮克斯风格）, Japanese ukiyo-e（浮世绘）, 
Art Deco architecture（装饰艺术建筑）
```

### 5. 多重提示权重

使用 `::` 为不同概念分配权重：

```
/imagine prompt: cat::2 space::1 astronaut suit::1.5
```

这会让"猫"获得最大权重，其次是"宇航服"，然后是"太空"。

---

## 10 个场景专用提示词模板

### 1. 产品摄影

```
/imagine prompt: product photography of [产品], placed on [表面], 
[背景], professional studio lighting, sharp focus, high-end 
commercial photography, 4K --ar 4:5 --style raw --v 6.1

示例：
/imagine prompt: product photography of a minimalist ceramic vase, 
placed on white marble surface, soft gradient background in warm beige, 
professional studio lighting with soft shadows, sharp focus, high-end 
commercial photography, 4K --ar 4:5 --style raw --v 6.1
```

### 2. 专业头像

```
/imagine prompt: professional headshot portrait of [人物描述], 
[服装], [表情], clean background in [颜色], soft studio lighting, 
shot on Canon EOS R5, 85mm f/1.4 lens, shallow depth of field 
--ar 3:4 --v 6.1

示例：
/imagine prompt: professional headshot portrait of a confident 
businesswoman in her 30s, wearing a navy blazer, warm genuine smile, 
clean background in light gray, soft studio lighting, shot on 
Canon EOS R5, 85mm f/1.4 lens --ar 3:4 --v 6.1
```

### 3. 风景场景

```
/imagine prompt: [类型] landscape of [地点/描述], [时间], 
[天气/氛围], [前景元素], dramatic [光线类型], 
award-winning nature photography --ar 16:9 --v 6.1

示例：
/imagine prompt: epic mountain landscape of snow-capped peaks 
reflecting in a crystal-clear alpine lake, golden hour, wispy 
clouds, wildflowers in foreground, dramatic rim lighting, 
award-winning nature photography --ar 16:9 --v 6.1
```

### 4. 插画 / 编辑设计

```
/imagine prompt: editorial illustration of [概念], [艺术风格], 
[配色方案], bold composition, magazine quality, trending on 
Behance --ar 3:4 --v 6.1

示例：
/imagine prompt: editorial illustration of the future of remote work, 
flat design with isometric perspective, vibrant purple and teal 
color palette, bold composition, magazine quality, trending on 
Behance --ar 3:4 --v 6.1
```

### 5. 室内设计

```
/imagine prompt: interior design photography of a [房间类型], 
[设计风格], [关键家具/元素], [配色方案], natural light from 
[方向], architectural digest style, professional interior 
photography --ar 16:9 --v 6.1

示例：
/imagine prompt: interior design photography of a modern Scandinavian 
living room, minimalist design, low-profile sofa in cream linen, 
oak coffee table, large monstera plant, neutral earth tones with 
sage green accents, natural light from floor-to-ceiling windows, 
architectural digest style --ar 16:9 --v 6.1
```

### 6. 美食摄影

```
/imagine prompt: food photography of [菜品], [摆盘风格], 
[道具和场景], [光线], overhead/45-degree angle, appetizing, 
Bon Appetit magazine style --ar 4:5 --v 6.1

示例：
/imagine prompt: food photography of artisan sourdough toast with 
avocado, poached egg, and microgreens, rustic ceramic plate, 
linen napkin, morning light from side window, 45-degree angle, 
appetizing, Bon Appetit magazine style --ar 4:5 --v 6.1
```

### 7. 角色设计

```
/imagine prompt: character design sheet of [角色描述], 
[服装细节], [设计中体现的性格特征], multiple poses, full body, 
[艺术风格], white background --ar 16:9 --niji 6

示例：
/imagine prompt: character design sheet of a steampunk inventor 
girl, goggles on head, leather apron with pockets full of tools, 
mechanical arm prosthetic, curious and energetic personality, 
multiple poses, full body, anime style with Western influence, 
white background --ar 16:9 --niji 6
```

### 8. 社交媒体图

```
/imagine prompt: [平台] social media graphic for [用途], 
[视觉风格], [匹配品牌的配色], eye-catching composition, 
clean and modern design, [情绪] --ar [平台比例] --v 6.1

示例：
/imagine prompt: Instagram post graphic for a summer sale 
announcement, tropical theme with palm leaves and sunset gradient, 
coral pink and golden yellow palette, eye-catching composition, 
clean and modern design, energetic and fun mood --ar 1:1 --v 6.1
```

### 9. 概念艺术 / 环境设计

```
/imagine prompt: concept art of [环境描述], [建筑风格], 
[氛围/情绪], [时代], [光照条件], matte painting, highly 
detailed, cinematic --ar 21:9 --v 6.1

示例：
/imagine prompt: concept art of an ancient underwater temple 
rediscovered by deep-sea explorers, bioluminescent coral growing 
on carved stone pillars, mysterious blue-green atmosphere, beams 
of light from above, matte painting, highly detailed, cinematic 
--ar 21:9 --v 6.1
```

### 10. Logo 与图标设计

```
/imagine prompt: minimalist logo design for [品牌/概念], 
[风格：geometric/organic/abstract], [关键符号或元素], 
clean lines, vector style, [颜色] on white background, 
professional brand identity --ar 1:1 --style raw --v 6.1

示例：
/imagine prompt: minimalist logo design for a mountain coffee 
brand, geometric style, mountain peak integrated with coffee cup 
silhouette, clean lines, vector style, deep brown and forest 
green on white background, professional brand identity 
--ar 1:1 --style raw --v 6.1
```

---

## 风格参考与对比

理解不同风格有助于你获得一致的结果。以下是如何针对每种主要美学风格进行提示：

### 写实摄影风格

```
/imagine prompt: [主体], hyperrealistic photography, shot on 
Sony A7R IV, 85mm lens, natural lighting, 8K resolution, 
photojournalism style --style raw --v 6.1
```

**特征：** 逼真的细节、自然的瑕疵、真实的光影、镜头效果
**最适合：** 产品图、人像、建筑摄影、素材图库

### 动漫 / 漫画风格

```
/imagine prompt: [主体], anime style, Studio Ghibli inspired, 
soft cel shading, vibrant colors, detailed background --niji 6

/imagine prompt: [主体], manga illustration, black and white ink, 
dynamic action lines, dramatic perspective --niji 6 --style expressive
```

**特征：** 干净的线条、富有表现力的眼睛、风格化的比例、鲜艳的配色
**最适合：** 角色设计、叙事插画、粉丝创作、社交媒体头像

### 水彩风格

```
/imagine prompt: [主体], watercolor painting, soft washes of color, 
visible paper texture, gentle color bleeding, delicate brushstrokes, 
white space, ethereal --v 6.1
```

**特征：** 半透明层叠、纸张纹理、柔和边缘、自然的颜色晕染
**最适合：** 邀请函、编辑插画、自然场景、柔和人像

### 油画风格

```
/imagine prompt: [主体], oil painting, thick impasto brushstrokes, 
rich color palette, dramatic chiaroscuro lighting, gallery quality, 
reminiscent of classical masters --v 6.1 --s 500
```

**特征：** 可见的笔触、丰富的纹理、浓郁的色彩、戏剧化的光影
**最适合：** 人像、风景、静物、艺术版画

### 数字艺术 / 概念艺术

```
/imagine prompt: [主体], digital concept art, trending on ArtStation, 
highly detailed, dramatic lighting, cinematic composition, 
matte painting --v 6.1
```

**特征：** 精致的完成度、戏剧化的构图、大气的光影、丰富的细节
**最适合：** 游戏美术、电影概念、奇幻/科幻场景、书籍封面

### 复古 / 怀旧风格

```
/imagine prompt: [主体], vintage 1970s photography, warm color cast, 
film grain, Kodachrome colors, slightly faded, nostalgic atmosphere --v 6.1
```

**特征：** 偏色、胶片颗粒感、褪色色调、年代感美学
**最适合：** 品牌设计、编辑内容、怀旧营销、社交媒体美学

---

## 进阶功能

### 图生图（Image Prompts）

上传参考图片，将其 URL 粘贴在文字提示词之前：

```
/imagine prompt: https://example.com/reference-image.jpg a modern 
reimagining of this scene in cyberpunk style --v 6.1
```

### 混合（Blend）

将多张图片组合成一张：

```
/blend [图片1] [图片2] [图片3]
```

非常适合混合风格、创建混搭概念，或组合参考图片。

### 描述（Describe）

上传图片，Midjourney 会建议可以重现它的提示词：

```
/describe [上传图片]
```

这对以下场景非常有用：
- 学习如何描述你所看到的画面
- 逆向工程你喜欢的风格
- 构建你的提示词词汇库

### 局部重绘（Vary Region）

生成图片后，使用 **Vary (Region)** 按钮：
1. 选择图片的特定区域
2. 描述你想要该区域呈现的内容
3. Midjourney 仅重新生成选中的区域

### 缩小（Zoom Out）

将图片扩展到原始边界之外：
- **Zoom Out 2x**：画布加倍，在原图周围生成新内容
- **Zoom Out 1.5x**：更温和的扩展
- **Custom Zoom**：指定精确的缩放级别并修改提示词

### 平移（Pan）

向特定方向（左、右、上、下）延伸图片，同时保持现有内容不变。

---

## 实用技巧与最佳实践

### 1. 先粗后细
从简单提示词开始观察 Midjourney 的理解，然后逐步添加细节：
- 第 1 轮：`a castle` → 看基线效果
- 第 2 轮：`a gothic castle on a cliff` → 加入场景
- 第 3 轮：`a gothic castle on a cliff, stormy sky, lightning, dramatic` → 加入氛围
- 第 4 轮：添加参数 `--ar 16:9 --v 6.1 --s 400`

### 2. 用 /describe 学习
上传你喜欢的图片，使用 `/describe`，研究它建议的提示词。这是建立词汇量最快的方式。

### 3. 保存种子值
当你喜欢某个构图但想尝试不同风格时，记下种子值并重复使用。

### 4. 创建风格模板
为保持项目一致性，开发一个"风格后缀"附加到每个提示词末尾：
```
, cinematic lighting, muted tones, 35mm photography, 
grain texture --ar 16:9 --v 6.1 --s 300
```

### 5. 尝试意想不到的组合
一些最惊艳的图片来自不寻常的混搭：
```
/imagine prompt: a Japanese zen garden made of circuit boards 
and fiber optic cables, morning mist, serene --v 6.1
```

### 6. 使用排列组合提示词
使用花括号同时测试多种变体：
```
/imagine prompt: a {red, blue, golden} dragon in {watercolor, oil painting, digital art} style
```
这会自动生成所有组合。

---

## 常见问题

### 1. 我用 Midjourney 创建的图片，版权归我吗？

如果你是付费订阅用户，你拥有所创建图片的一般商业使用权。但如果你是免费用户，图片遵循 Creative Commons 非商业 4.0 授权。年营收超过 100 万美元的企业用户需要至少 Pro 方案。请务必查阅 Midjourney 最新的服务条款了解详情。

### 2. 如何在多张图片中生成一致的角色？

结合使用以下技巧：(1) 在每个提示词中使用相同的详细角色描述。(2) 使用相同的 `--seed` 值。(3) 使用之前的结果作为图生图参考。(4) 使用 `--cref`（角色参考）参数配合参考图片 URL，这是 v6 中最可靠的方法。

### 3. 为什么我的图片和描述的不一样？

Midjourney 对提示词进行的是艺术化诠释，而非字面翻译。要更接近你的设想：使用 `--style raw` 获取更忠实的诠释，降低 `--stylize` 值，将最重要的元素放在提示词开头，使用精确的描述性语言而非抽象概念。`/shorten` 命令可以帮助你了解 Midjourney 实际关注哪些词。

### 4. 最大可以生成多高分辨率的图片？

标准生成的图片约为 1024×1024 像素。放大后可达约 2048×2048 或更高（取决于宽高比）。如需印刷级分辨率，可在 Midjourney 生成后使用外部放大工具如 Topaz Gigapixel AI 或 Real-ESRGAN。

### 5. 可以用 Midjourney 生成真人肖像或模仿特定艺术家的风格吗？

Midjourney 有政策禁止生成真实公众人物的图片，并已屏蔽了许多特定艺术家的名字。你可以用通用方式描述艺术风格（如"印象派风格"而非指名某位在世艺术家），但请始终注意肖像权和艺术版权方面的道德和法律考量。

---

## 总结

Midjourney 是一个极其强大的创作工具，它奖励实验和精确的沟通。一张平庸的图片和一张惊艳的图片之间的差距，往往取决于你描述脑海中画面的能力。

从本指南中的模板开始，尝试不同的参数，逐步构建你的个人风格词汇库。你创作得越多，提示词的编写过程就越直觉化。

**下一步行动：**
- 使用以上模板生成你的第一批 10 张图片
- 用相同提示词尝试不同的 `--stylize` 值
- 对你欣赏的 5 张图片使用 `/describe`
- 为你最常用的美学风格建立个人"风格后缀"
- 加入 Midjourney Discord 社区向他人学习

创造出令人惊叹的作品吧！🎨

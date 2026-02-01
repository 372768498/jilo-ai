# 本地测试指南

## 🚀 快速开始

### 1️⃣ 确认环境
确保你已安装 Node.js (版本 >= 16)
```bash
node --version
```

### 2️⃣ 安装依赖
如果还没安装依赖,请运行:
```bash
cd C:\Users\jojo1\jilo-ai\game-video-gen
npm install
```

或双击 `INSTALL.bat`

### 3️⃣ 运行测试

#### 方法 1: 使用批处理文件
直接双击 `run_prison_test.bat`

#### 方法 2: 使用命令行
```bash
cd C:\Users\jojo1\jilo-ai\game-video-gen
node test_prison_battle.js
```

#### 方法 3: 使用 npm 脚本
```bash
cd C:\Users\jojo1\jilo-ai\game-video-gen
npm run prison
```

## 📝 测试说明

当前测试会生成一个 **12秒** 的竖屏(9:16)视频,展示《狱国争霸》游戏:

- **0-3秒**: 监狱堡垒全景俯拍（震撼开场）
- **3-7秒**: 游戏玩法展示（资源、领地、招募）
- **7-10秒**: 史诗战斗场景（特效、慢动作）
- **10-12秒**: 角色特写 + 帝国全景

## ⏱️ 预期时间

- 生成时间: 约 1-2 分钟
- 成本: ~$0.20-0.30 USD

## ✅ 成功标志

看到以下输出说明成功:
```
✅ 生成成功！总耗时: XX秒

📹 视频信息:
   - 视频URL: https://...
   ...

🔗 视频下载链接:
   https://v3.fal.media/files/...
```

## 🔍 如何查看生成的视频

1. 复制控制台输出的视频链接
2. 在浏览器中打开链接
3. 视频会自动播放
4. 右键视频 -> "视频另存为" 下载到本地

## ❌ 常见问题

### 问题 1: 依赖未安装
**错误**: `Cannot find module '@fal-ai/serverless-client'`

**解决**: 
```bash
npm install
```

### 问题 2: API Key 问题
**错误**: `Unauthorized` 或 `Invalid API key`

**解决**: 检查 `test_prison_battle.js` 中的 API Key 是否正确

### 问题 3: 网络问题
**错误**: `ECONNREFUSED` 或超时

**解决**: 
- 检查网络连接
- 使用 VPN 或代理
- 稍后重试

## 🎯 下一步

测试成功后,你可以:

1. **修改参数测试不同场景**
   - 编辑 `test_prison_battle.js` 中的 `prompt`
   - 改变 `duration` (4, 8, 或 12)
   - 改变 `aspect_ratio` ("9:16" 或 "16:9")

2. **开发完整的 Web 应用**
   - 参考 PRD 文档
   - 使用 Next.js + Supabase
   - 集成 OpenAI 生成脚本

3. **优化和扩展**
   - 添加更多平台支持
   - 支持多语言
   - 添加用户界面

## 📚 相关文档

- PRD: `jilo-ai_game-video-gen_PRD_V1_0_MVP_REVISED.md`
- FAL.AI 文档: https://fal.ai/models/sora-2
- 项目 README: `README_PRISON_BATTLE.md`

## 🆘 获取帮助

如果遇到问题:
1. 查看控制台完整错误信息
2. 检查 FAL.AI 服务状态: https://status.fal.ai/
3. 运行带调试的版本: `node test_prison_battle.js --debug`

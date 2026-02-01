# FAL.AI SORA2 API 测试指南

## 🚀 快速开始（Windows）

### 方式1: 双击运行（最简单）

1. **双击** `run_test.bat` 文件
2. 等待 1-2 分钟
3. 查看测试结果和生成的 `test_video.mp4`

### 方式2: 命令行运行

打开 PowerShell 或 CMD，运行：

```powershell
cd C:\Users\jojo1\jilo-ai\game-video-gen
npm install
node test_fal_sora2.js
```

## 📋 你的 API 配置

- **API Key**: 已配置在 `test_fal_sora2.js` 中
- **测试场景**: 赛博朋克城市夜景（5秒视频）
- **预估成本**: ~$0.05-0.10 USD

## ✅ 预期结果

成功的输出应该类似：

```
╔════════════════════════════════════════════════════════════╗
║     FAL.AI SORA2 API 快速测试                              ║
╚════════════════════════════════════════════════════════════╝

🎬 测试场景: 快速测试 - 游戏场景 (5秒)
📝 Prompt: Epic cyberpunk city at night...
⏱️  Duration: 5s

⏳ 正在生成视频，请稍候...

⏳ 在队列中，等待处理...
📊 进度: 正在处理视频...

✅ 生成成功！耗时: 45.23秒

📹 视频信息:
   - URL: https://v3.fal.media/files/...
   - 时长: 5s
   - Seed: 1234567890

⏱️  时间统计:
   - 推理时间: 42.15秒

💰 预估成本: ~$0.05-0.10 USD

⬇️  准备下载视频...
✅ 视频已保存到: test_video.mp4

✨ API 测试通过！SORA2 工作正常。
```

## 🎥 查看生成的视频

测试成功后会生成 `test_video.mp4` 文件：
- 用 Windows Media Player 打开
- 或用 VLC Player 打开
- 检查视频质量和内容

## ❌ 常见问题

### 问题1: "未找到 Node.js"

**解决方案**:
1. 下载安装 Node.js: https://nodejs.org/
2. 选择 LTS 版本（推荐）
3. 安装后重启命令行

### 问题2: "npm install 失败"

**解决方案**:
```powershell
# 清除缓存后重试
npm cache clean --force
npm install
```

### 问题3: "fetch failed" 或网络错误

**原因**: 网络连接问题或防火墙

**解决方案**:
1. 检查网络连接
2. 如果使用代理，配置代理：
   ```powershell
   npm config set proxy http://proxy-server:port
   npm config set https-proxy http://proxy-server:port
   ```
3. 暂时关闭防火墙测试

### 问题4: "API Key 无效"

**检查**:
- API Key 格式: `client-id:client-secret`
- 你的 Key: `77c2b2ce-ed73-4a19-9790-21e674c144a9:811b480911387d8c54ea5d013efb284a`
- 访问 https://fal.ai/dashboard/keys 验证

### 问题5: "Content policy violation"

**原因**: Prompt 违反内容政策

**解决方案**: 修改 `test_fal_sora2.js` 中的 prompt，使用更安全的描述

## 📊 测试成功后

如果测试通过，说明：
- ✅ API Key 有效
- ✅ 网络连接正常
- ✅ SORA2 API 工作正常
- ✅ 视频生成功能可用

**下一步**:
1. 查看生成的视频质量
2. 确认生成时间（预计 30-60秒）
3. 确认成本可接受
4. 继续开发 MCP 服务器

## 🔧 高级调试

### 查看详细日志

在 `test_fal_sora2.js` 中，结果会输出完整的 JSON：

```javascript
console.log(JSON.stringify(result, null, 2));
```

### 测试不同参数

修改测试脚本中的参数：

```javascript
const scenario = {
  prompt: "你的自定义 prompt",
  duration: "10s",  // 改为 10 秒
  aspect_ratio: "9:16"  // 改为竖屏
};
```

### 重现相同视频

使用返回的 seed 值：

```javascript
const result = await fal.subscribe("fal-ai/sora-2/text-to-video", {
  input: {
    prompt: "...",
    duration: "5s",
    seed: 1234567890  // 使用之前的 seed
  }
});
```

## 💰 成本控制

- **快速测试**: ~$0.05-0.10 (5秒)
- **完整测试**: ~$0.15-0.40 (多个场景)
- **实际项目**: 
  - 30秒视频: ~$0.30-0.60
  - 60秒视频: ~$0.60-1.20

## 📞 获取帮助

- FAL.AI 文档: https://fal.ai/models/fal-ai/sora-2/text-to-video
- API 状态: https://status.fal.ai/
- Discord: https://discord.gg/fal-ai

## ✨ 测试成功检查清单

- [ ] npm install 成功
- [ ] 脚本运行无错误
- [ ] 视频 URL 返回
- [ ] test_video.mp4 文件生成
- [ ] 视频可以正常播放
- [ ] 视频内容符合 prompt 描述
- [ ] 生成时间在预期范围（30-90秒）

全部打勾后，就可以进入下一阶段开发了！

---

**测试版本**: 1.0  
**更新日期**: 2025-10-27  
**API Key**: 已配置（请勿分享）

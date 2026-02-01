/**
 * FAL.AI SORA2 API 测试脚本
 * 测试场景：抖音小游戏《狱国争霸》推广视频
 * 更新：使用 12秒时长（SORA2 最新支持）
 * 运行: node test_prison_battle.js
 */

import * as fal from "@fal-ai/serverless-client";

// 配置 FAL API Key
fal.config({
  credentials: "77c2b2ce-ed73-4a19-9790-21e674c144a9:811b480911387d8c54ea5d013efb284a"
});

console.log(`
╔════════════════════════════════════════════════════════════╗
║     抖音小游戏《狱国争霸》推广视频生成测试                    ║
║     FAL.AI SORA2 - 12秒竖屏视频                            ║
╚════════════════════════════════════════════════════════════╝
`);

async function generatePromotionVideo() {
  // 针对抖音优化的视频参数
  const scenario = {
    name: "《狱国争霸》抖音推广视频",
    // 专业的英文 prompt，强调视觉冲击力和游戏特色
    prompt: `Cinematic mobile game advertisement for a prison strategy game called "Prison Battle Royale". 
    Opening shot: dramatic aerial view of a massive medieval prison fortress with high stone walls and guard towers at dusk, dark atmospheric lighting with volumetric fog.
    Camera swoops down dynamically into the prison courtyard revealing animated characters - armored prisoners and guards in tactical formation.
    Quick dynamic cuts showing: glowing resource management interface with golden coins and gems, strategic territory expansion on a war map with animated borders, heroic character recruitment screen with powerful warlord portraits.
    Epic battle sequence: large-scale combat with multiple units clashing, magical skills and special effects activating with particle effects, cinematic slow-motion moments.
    Close-up of a commanding warlord character with fierce determined expression and battle scars.
    Final shot: zooming out to show the entire prison empire under player control.
    Style: AAA mobile game trailer quality, vibrant glowing UI elements, dramatic cinematic lighting, high-octane action-packed sequences, professional game advertisement aesthetic.
    Vertical 9:16 format optimized for mobile TikTok/Douyin viewing.`,
    
    duration: 12,  // 修改为 12 秒（SORA2 支持：4, 8, 12）
    aspect_ratio: "9:16"  // 竖屏格式，适合抖音
  };

  console.log(`🎮 游戏名称: 狱国争霸`);
  console.log(`📱 平台: 抖音小游戏`);
  console.log(`⏱️  视频时长: ${scenario.duration}秒 (SORA2最大时长)`);
  console.log(`📐 视频比例: ${scenario.aspect_ratio} (竖屏)`);
  console.log(`\n📝 视频内容:`);
  console.log(`   - 0-3秒: 监狱堡垒全景俯拍（震撼开场）`);
  console.log(`   - 3-7秒: 游戏玩法展示（资源、领地、招募）`);
  console.log(`   - 7-10秒: 史诗战斗场景（特效、慢动作）`);
  console.log(`   - 10-12秒: 角色特写 + 帝国全景（CTA预留）`);
  console.log(`\n⏳ 正在生成视频，预计需要 1-2 分钟...\n`);

  const startTime = Date.now();
  let lastStatus = "";

  try {
    const result = await fal.subscribe("fal-ai/sora-2/text-to-video", {
      input: {
        prompt: scenario.prompt,
        duration: scenario.duration,  // 现在是数字 12，不是字符串 "12s"
        aspect_ratio: scenario.aspect_ratio,
        safety_tolerance: "2"
      },
      logs: true,
      pollInterval: 3000,
      onQueueUpdate: (update) => {
        const currentTime = ((Date.now() - startTime) / 1000).toFixed(0);
        
        if (update.status === "IN_PROGRESS") {
          const logs = update.logs || [];
          if (logs.length > 0) {
            const latestLog = logs[logs.length - 1].message;
            if (latestLog !== lastStatus) {
              console.log(`[${currentTime}s] 📊 ${latestLog}`);
              lastStatus = latestLog;
            }
          }
        } else if (update.status === "IN_QUEUE") {
          if (update.position !== undefined) {
            console.log(`[${currentTime}s] ⏳ 队列中，位置: ${update.position}`);
          } else {
            console.log(`[${currentTime}s] ⏳ 等待处理...`);
          }
        } else if (update.status === "COMPLETED") {
          console.log(`[${currentTime}s] ✨ 视频生成完成！`);
        }
      }
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ 生成成功！总耗时: ${duration}秒\n`);
    
    console.log(`📹 视频信息:`);
    console.log(`   - 视频URL: ${result.video?.url || "N/A"}`);
    console.log(`   - 文件大小: ${result.video?.file_size ? (result.video.file_size / 1024 / 1024).toFixed(2) + " MB" : "N/A"}`);
    console.log(`   - 视频时长: ${scenario.duration}秒`);
    console.log(`   - 内容类型: ${result.video?.content_type || "video/mp4"}`);
    console.log(`   - 视频比例: ${scenario.aspect_ratio} (竖屏)`);
    
    if (result.seed) {
      console.log(`   - Seed值: ${result.seed} (用于重现)`);
    }

    if (result.timings) {
      console.log(`\n⏱️  性能统计:`);
      console.log(`   - AI推理时间: ${result.timings.inference?.toFixed(2) || "N/A"}秒`);
    }

    console.log(`\n💰 成本估算:`);
    console.log(`   - 12秒竖屏视频: ~$0.20-0.30 USD`);
    
    console.log(`\n📱 视频用途:`);
    console.log(`   ✓ 抖音短视频推广 (12秒完整故事)`);
    console.log(`   ✓ 快手小游戏宣传`);
    console.log(`   ✓ 微信视频号`);
    console.log(`   ✓ B站移动端`);

    console.log(`\n🎯 后续操作建议:`);
    console.log(`   1. 用视频编辑软件添加文字:`);
    console.log(`      - 0-3秒: 游戏LOGO "狱国争霸"`);
    console.log(`      - 3-10秒: 特色文案 "策略为王·称霸狱国"`);
    console.log(`      - 10-12秒: CTA "点击链接，立即开玩"`);
    console.log(`      - 底部常驻: "评论1领CDK码"`);
    console.log(`   2. 添加背景音乐(史诗/紧张感)`);
    console.log(`   3. 添加音效(战斗、技能释放)`);
    console.log(`   4. 可选: 叠加游戏实际画面`);

    // 显示视频链接
    if (result.video?.url) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🔗 视频下载链接:`);
      console.log(`\n   ${result.video.url}`);
      console.log(`\n   💡 复制上方链接到浏览器即可查看和下载视频`);
      console.log(`   💡 或在浏览器中右键 -> 视频另存为`);
      console.log(`${"=".repeat(60)}`);
    }

    console.log(`\n✨ 测试完成！SORA2 API 工作正常。\n`);

    // 输出完整结果供调试
    if (process.argv.includes('--debug')) {
      console.log(`\n📋 完整API响应 (调试模式):`);
      console.log(JSON.stringify(result, null, 2));
    }
    
    return result;

  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.error(`\n${"=".repeat(60)}`);
    console.error(`❌ 生成失败！耗时: ${duration}秒`);
    console.error(`${"=".repeat(60)}\n`);
    console.error(`错误类型: ${error.name || "Unknown"}`);
    console.error(`错误信息: ${error.message}`);
    
    if (error.body) {
      console.error(`\n详细错误信息:`);
      console.error(JSON.stringify(error.body, null, 2));
    }

    if (error.stack) {
      console.error(`\n堆栈跟踪:\n${error.stack}`);
    }

    console.error(`\n🔧 故障排查:`);
    console.error(`   1. 检查网络连接是否正常`);
    console.error(`   2. 验证 API Key 是否有效`);
    console.error(`   3. 确认 FAL.AI 服务状态: https://status.fal.ai/`);
    console.error(`   4. 检查是否超出 API 配额限制`);
    console.error(`   5. 如果是内容审核问题，尝试调整 prompt\n`);

    throw error;
  }
}

// 运行测试
console.log(`🚀 开始生成《狱国争霸》推广视频...\n`);

generatePromotionVideo()
  .then(() => {
    console.log(`\n🎉 全部完成！你现在可以:`);
    console.log(`   1. 点击上方链接在浏览器中查看视频`);
    console.log(`   2. 下载视频并用剪映/PR添加文字和音效`);
    console.log(`   3. 发布到抖音测试推广效果`);
    console.log(`   4. 如果满意，可以继续开发完整的自动化系统\n`);
  })
  .catch((error) => {
    console.error(`\n💥 测试失败，请查看上方错误信息`);
    process.exit(1);
  });

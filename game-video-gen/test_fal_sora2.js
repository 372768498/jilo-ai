/**
 * FAL.AI SORA2 API 快速测试脚本
 * 运行: node test_fal_sora2.js
 */

import * as fal from "@fal-ai/serverless-client";

// 配置 FAL API Key
fal.config({
  credentials: "77c2b2ce-ed73-4a19-9790-21e674c144a9:811b480911387d8c54ea5d013efb284a"
});

console.log(`
╔════════════════════════════════════════════════════════════╗
║     FAL.AI SORA2 API 快速测试                              ║
╚════════════════════════════════════════════════════════════╝
`);

async function quickTest() {
  const scenario = {
    name: "快速测试 - 游戏场景 (5秒)",
    prompt: "Epic cyberpunk city at night with neon lights, flying cars, holographic advertisements, cinematic camera movement descending from sky",
    duration: "5s",
    aspect_ratio: "16:9"
  };

  console.log(`🎬 测试场景: ${scenario.name}`);
  console.log(`📝 Prompt: ${scenario.prompt}`);
  console.log(`⏱️  Duration: ${scenario.duration}`);
  console.log(`📐 Aspect Ratio: ${scenario.aspect_ratio}\n`);
  console.log(`⏳ 正在生成视频，请稍候...\n`);

  const startTime = Date.now();

  try {
    const result = await fal.subscribe("fal-ai/sora-2/text-to-video", {
      input: {
        prompt: scenario.prompt,
        duration: scenario.duration,
        aspect_ratio: scenario.aspect_ratio,
        safety_tolerance: "2"
      },
      logs: true,
      pollInterval: 3000,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          const logs = update.logs || [];
          if (logs.length > 0) {
            console.log(`📊 进度: ${logs[logs.length - 1].message}`);
          }
        } else if (update.status === "IN_QUEUE") {
          console.log(`⏳ 在队列中，等待处理...`);
        }
      }
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ 生成成功！耗时: ${duration}秒\n`);
    console.log(`📹 视频信息:`);
    console.log(`   - URL: ${result.video?.url || "N/A"}`);
    console.log(`   - 时长: ${result.video?.duration || scenario.duration}`);
    console.log(`   - 内容类型: ${result.video?.content_type || "N/A"}`);
    
    if (result.seed) {
      console.log(`   - Seed: ${result.seed} (可用于重现)`);
    }

    if (result.timings) {
      console.log(`\n⏱️  时间统计:`);
      console.log(`   - 推理时间: ${result.timings.inference?.toFixed(2) || "N/A"}秒`);
    }

    console.log(`\n💰 预估成本: ~$0.05-0.10 USD`);
    
    // 下载视频
    if (result.video?.url) {
      console.log(`\n⬇️  准备下载视频...`);
      await downloadVideo(result.video.url, "test_video.mp4");
    }
    
    console.log(`\n✨ API 测试通过！SORA2 工作正常。`);
    console.log(`\n🎉 完整结果:`);
    console.log(JSON.stringify(result, null, 2));
    
    return result;

  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.error(`\n❌ 生成失败！耗时: ${duration}秒`);
    console.error(`错误信息: ${error.message}`);
    
    if (error.body) {
      console.error(`详细错误:`, JSON.stringify(error.body, null, 2));
    }

    if (error.stack) {
      console.error(`\n堆栈跟踪:\n${error.stack}`);
    }

    throw error;
  }
}

async function downloadVideo(videoUrl, filename) {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const fs = await import('fs/promises');
    await fs.writeFile(filename, Buffer.from(buffer));
    
    console.log(`✅ 视频已保存到: ${filename}`);
    return true;
  } catch (error) {
    console.error(`⚠️  下载失败: ${error.message}`);
    console.error(`   但视频 URL 可用，请手动下载: ${videoUrl}`);
    return false;
  }
}

// 运行测试
quickTest().catch((error) => {
  console.error("\n💥 测试失败:", error.message);
  console.error("\n请检查:");
  console.error("  1. API Key 是否正确");
  console.error("  2. 网络连接是否正常");
  console.error("  3. FAL.AI 服务是否可用");
  process.exit(1);
});

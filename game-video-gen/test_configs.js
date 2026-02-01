/**
 * 🧪 平台和时长测试工具
 * 测试不同配置的视频生成
 * 运行: node test_configs.js [platform] [duration]
 * 
 * 示例:
 *   node test_configs.js douyin 8
 *   node test_configs.js youtube 12
 *   node test_configs.js kuaishou 4
 */

import * as fal from "@fal-ai/serverless-client";

// 配置 API Key
fal.config({
  credentials: "77c2b2ce-ed73-4a19-9790-21e674c144a9:811b480911387d8c54ea5d013efb284a"
});

// 平台配置
const platformConfigs = {
  douyin: {
    name: "抖音",
    aspectRatio: "9:16",
    style: "fast-paced, high-impact visuals, trendy effects",
    prompt: "Cinematic mobile game advertisement with fast-paced action. Dramatic lighting, vibrant effects, attention-grabbing opening. Vertical format for mobile viewing."
  },
  kuaishou: {
    name: "快手",
    aspectRatio: "9:16",
    style: "authentic, relatable, entertaining",
    prompt: "Mobile game promotional video with authentic feel. Friendly atmosphere, entertaining moments, social gaming elements. Vertical format optimized for mobile."
  },
  youtube: {
    name: "YouTube",
    aspectRatio: "16:9",
    style: "polished, cinematic, detailed storytelling",
    prompt: "Professional game trailer with cinematic quality. Detailed world-building, epic scale, high production value. Horizontal format for desktop and TV viewing."
  }
};

// 获取命令行参数
const platform = process.argv[2] || "douyin";
const duration = parseInt(process.argv[3]) || 8;

// 验证参数
if (!platformConfigs[platform]) {
  console.error(`❌ 无效平台: ${platform}`);
  console.log(`可用平台: ${Object.keys(platformConfigs).join(", ")}`);
  process.exit(1);
}

if (![4, 8, 12].includes(duration)) {
  console.error(`❌ 无效时长: ${duration}`);
  console.log(`可用时长: 4, 8, 12 秒`);
  process.exit(1);
}

const config = platformConfigs[platform];

console.log(`
╔════════════════════════════════════════════════════════════╗
║     视频生成配置测试                                        ║
╚════════════════════════════════════════════════════════════╝

📱 目标平台: ${config.name} (${platform})
⏱️  视频时长: ${duration}秒
📐 视频比例: ${config.aspectRatio}
🎨 风格特点: ${config.style}

正在生成视频...
`);

async function generateTestVideo() {
  const startTime = Date.now();

  try {
    const result = await fal.subscribe("fal-ai/sora-2/text-to-video", {
      input: {
        prompt: `${config.prompt} Medieval prison strategy game with epic battles, resource management, and character recruitment. ${duration} seconds duration.`,
        duration: duration,
        aspect_ratio: config.aspectRatio,
        safety_tolerance: "2"
      },
      logs: true,
      pollInterval: 3000,
      onQueueUpdate: (update) => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        if (update.status === "IN_PROGRESS") {
          const logs = update.logs || [];
          if (logs.length > 0) {
            console.log(`[${elapsed}s] 📊 ${logs[logs.length - 1].message}`);
          }
        } else if (update.status === "IN_QUEUE") {
          console.log(`[${elapsed}s] ⏳ 队列位置: ${update.position || "等待中"}`);
        }
      }
    });

    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ 生成成功！总耗时: ${totalTime}秒\n`);
    
    console.log(`📹 视频信息:`);
    console.log(`   - 平台: ${config.name}`);
    console.log(`   - 时长: ${duration}秒`);
    console.log(`   - 格式: ${config.aspectRatio}`);
    console.log(`   - 视频URL: ${result.video?.url || "N/A"}`);
    console.log(`   - 文件大小: ${result.video?.file_size ? (result.video.file_size / 1024 / 1024).toFixed(2) + " MB" : "N/A"}`);
    
    const estimatedCost = duration === 4 ? "$0.08-0.12" : duration === 8 ? "$0.15-0.20" : "$0.20-0.30";
    console.log(`\n💰 预估成本: ${estimatedCost}`);
    
    console.log(`\n🔗 视频下载链接:`);
    console.log(`   ${result.video?.url}\n`);
    console.log(`${"=".repeat(60)}`);

    return result;

  } catch (error) {
    console.error(`\n❌ 生成失败: ${error.message}`);
    throw error;
  }
}

// 运行测试
generateTestVideo()
  .then(() => {
    console.log(`\n✨ 测试完成！`);
    console.log(`\n💡 提示:`);
    console.log(`   - 测试其他平台: node test_configs.js youtube 12`);
    console.log(`   - 测试不同时长: node test_configs.js douyin 4`);
    console.log(`   - 测试快手: node test_configs.js kuaishou 8\n`);
  })
  .catch(() => {
    process.exit(1);
  });

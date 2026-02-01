/**
 * 🎮 简化版视频生成测试
 * 快速测试 FAL.AI SORA2 API
 * 运行: node simple_test.js
 */

import * as fal from "@fal-ai/serverless-client";

// 配置 API Key
fal.config({
  credentials: "77c2b2ce-ed73-4a19-9790-21e674c144a9:811b480911387d8c54ea5d013efb284a"
});

console.log("🎬 开始生成测试视频...\n");

async function quickTest() {
  try {
    // 简单的 4 秒测试（最快，最便宜）
    const result = await fal.subscribe("fal-ai/sora-2/text-to-video", {
      input: {
        prompt: "A dramatic medieval prison fortress at dusk with stone walls and guard towers. Camera swoops down into courtyard. Cinematic lighting.",
        duration: 4,  // 最短时长
        aspect_ratio: "9:16",
        safety_tolerance: "2"
      },
      logs: true,
      pollInterval: 3000
    });

    console.log("\n✅ 生成成功!\n");
    console.log("📹 视频URL:", result.video?.url || "N/A");
    console.log("⏱️  时长: 4秒");
    console.log("💰 成本: ~$0.08-0.12");
    console.log("\n🔗 在浏览器中打开上方链接查看视频\n");

    return result;
  } catch (error) {
    console.error("\n❌ 错误:", error.message);
    throw error;
  }
}

// 运行测试
quickTest();

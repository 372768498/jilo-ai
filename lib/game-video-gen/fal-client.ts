import * as fal from '@fal-ai/serverless-client';

// 配置FAL.AI客户端
fal.config({
  credentials: process.env.FAL_KEY || '',
});

export interface GenerateVideoParams {
  prompt: string;
  duration: 4 | 8 | 12;
  aspectRatio: '9:16' | '16:9';
}

export interface VideoResult {
  videoUrl: string;
  duration: number;
  seed?: number;
  cost?: number;
}

export async function generateVideo(
  params: GenerateVideoParams
): Promise<VideoResult> {
  const { prompt, duration, aspectRatio } = params;

  console.log('开始生成视频...', { duration, aspectRatio });

  try {
    const result = await fal.subscribe('fal-ai/sora-2/text-to-video', {
      input: {
        prompt,
        duration,
        aspect_ratio: aspectRatio,
        safety_tolerance: '2',
      },
      logs: true,
      pollInterval: 3000,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('视频生成进度:', update.logs);
        }
      },
    });

    console.log('视频生成完成:', result);

    // 估算成本（基于时长）
    const estimatedCost = duration === 4 ? 0.13 : duration === 8 ? 0.22 : 0.31;

    return {
      videoUrl: result.video?.url || '',
      duration,
      seed: result.seed,
      cost: estimatedCost,
    };
  } catch (error: any) {
    console.error('FAL.AI视频生成失败:', error);
    throw new Error(`视频生成失败: ${error.message}`);
  }
}

export function combineScenePromptsToFullPrompt(scenes: any[]): string {
  // 将所有场景的visual_prompt合并成一个完整的prompt
  const prompts = scenes.map((scene, index) => {
    return `Scene ${index + 1} (${scene.duration}s): ${scene.visual_prompt}`;
  });

  return prompts.join('. ');
}

export { fal };

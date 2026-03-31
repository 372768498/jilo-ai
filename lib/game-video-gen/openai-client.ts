import OpenAI from 'openai';

// 初始化OpenAI客户端（使用占位符避免构建失败）
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'build-placeholder',
});

export interface GenerateScriptParams {
    gameTitle: string;
    gameDescription: string;
    language: 'zh-CN' | 'en-US';
    platform: 'douyin' | 'kuaishou' | 'youtube';
    duration: 4 | 8 | 12;
    aspectRatio: '9:16' | '16:9';
}

export interface Scene {
    scene_number: number;
    duration: number;
    visual_description: string;
    camera_movement: string;
    voiceover: string;
    visual_prompt: string;
}

export interface VideoScript {
    title: string;
    language: string;
    platform: string;
    duration: number;
    aspect_ratio: string;
    scenes: Scene[];
    total_scenes: number;
    hashtags: string[];
}

export async function generateVideoScript(
    params: GenerateScriptParams
  ): Promise<VideoScript> {
    const { gameTitle, gameDescription, language, platform, duration, aspectRatio } = params;
    const sceneCount = duration / 2;
    const systemPrompt = buildSystemPrompt(language);
    const userPrompt = buildUserPrompt({
          gameTitle,
          gameDescription,
          language,
          platform,
          duration,
          sceneCount,
          aspectRatio,
    });

  try {
        const response = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt },
                        ],
                temperature: 0.8,
                max_tokens: 2000,
                response_format: { type: 'json_object' },
        });

      const content = response.choices[0].message.content;
        if (!content) throw new Error('OpenAI返回空内容');
        const script: VideoScript = JSON.parse(content);
        return script;
  } catch (error: any) {
        console.error('OpenAI脚本生成失败:', error);
        throw new Error(`脚本生成失败: ${error.message}`);
  }
}

function buildSystemPrompt(language: string): string {
    if (language === 'zh-CN') {
          return `你是一位专业的游戏视频脚本创作专家。请生成专业的视频脚本，输出必须是有效的JSON格式。`;
    }
    return `You are a professional game video script creator. Output must be valid JSON.`;
}

function buildUserPrompt(params: {
    gameTitle: string;
    gameDescription: string;
    language: string;
    platform: string;
    duration: number;
    sceneCount: number;
    aspectRatio: string;
}): string {
    const { gameTitle, gameDescription, language, platform, duration, sceneCount, aspectRatio } = params;
    if (language === 'zh-CN') {
          return `请为游戏"${gameTitle}"生成${duration}秒视频脚本（${sceneCount}个场景，${aspectRatio}格式，${platform}平台）。游戏介绍：${gameDescription}`;
    }
    return `Generate a ${duration}s script for game "${gameTitle}" (${sceneCount} scenes, ${aspectRatio}, ${platform}). Description: ${gameDescription}`;
}

export { openai };

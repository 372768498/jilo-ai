import OpenAI from 'openai';

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

  // 计算场景数量（每2秒一个场景）
  const sceneCount = duration / 2;

  // 构建prompt
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
    if (!content) {
      throw new Error('OpenAI返回空内容');
    }

    const script: VideoScript = JSON.parse(content);

    // 验证场景数量
    if (script.scenes.length !== sceneCount) {
      throw new Error(`场景数量不匹配：期望${sceneCount}个，实际${script.scenes.length}个`);
    }

    return script;
  } catch (error: any) {
    console.error('OpenAI脚本生成失败:', error);
    throw new Error(`脚本生成失败: ${error.message}`);
  }
}

function buildSystemPrompt(language: string): string {
  if (language === 'zh-CN') {
    return `你是一位专业的游戏视频脚本创作专家，擅长为不同平台创作引人注目的短视频内容。

你的任务是根据游戏信息生成专业的视频脚本，包含：
1. 详细的视觉描述
2. 镜头运动设计
3. 简短有力的旁白
4. 适合AI生成视频的视觉提示词

重要规则：
- 所有内容必须使用中文
- visual_prompt也必须使用中文
- 严格按照指定的场景数量生成
- 每个场景时长固定为2秒
- 输出必须是有效的JSON格式`;
  } else {
    return `You are a professional game video script creator, skilled at creating engaging short video content for different platforms.

Your task is to generate professional video scripts based on game information, including:
1. Detailed visual descriptions
2. Camera movement design
3. Brief and powerful voiceovers
4. Visual prompts suitable for AI video generation

Important rules:
- All content must be in English
- visual_prompt must also be in English
- Strictly generate according to the specified number of scenes
- Each scene duration is fixed at 2 seconds
- Output must be in valid JSON format`;
  }
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

  const platformFeatures = {
    douyin: {
      'zh-CN': '抖音平台特性：快节奏、强冲击、前1秒必须抓住注意力、多用特效和转场',
      'en-US': 'Douyin platform features: Fast-paced, strong impact, must grab attention in first second, use effects and transitions',
    },
    kuaishou: {
      'zh-CN': '快手平台特性：接地气、真实感、娱乐性强、贴近生活',
      'en-US': 'Kuaishou platform features: Down-to-earth, authentic, highly entertaining, close to life',
    },
    youtube: {
      'zh-CN': 'YouTube平台特性：精良制作、完整叙事、高质量画面、专业感',
      'en-US': 'YouTube platform features: High production value, complete narrative, high-quality visuals, professional feel',
    },
  };

  const langKey = language === 'zh-CN' ? 'zh-CN' : 'en-US';

  if (language === 'zh-CN') {
    return `请为以下游戏生成${duration}秒的视频脚本：

游戏名称：${gameTitle}
游戏介绍：${gameDescription}

平台：${platform}
${platformFeatures[platform as keyof typeof platformFeatures][langKey]}

要求：
1. 总时长：${duration}秒
2. 场景数量：${sceneCount}个场景（每个场景2秒）
3. 视频格式：${aspectRatio}
4. 语言：中文
5. visual_prompt必须使用中文

请返回以下JSON格式：
{
  "title": "${gameTitle}",
  "language": "zh-CN",
  "platform": "${platform}",
  "duration": ${duration},
  "aspect_ratio": "${aspectRatio}",
  "scenes": [
    {
      "scene_number": 1,
      "duration": 2,
      "visual_description": "场景视觉描述",
      "camera_movement": "镜头运动",
      "voiceover": "简短旁白",
      "visual_prompt": "详细的中文视觉提示词，用于AI视频生成"
    }
  ],
  "total_scenes": ${sceneCount},
  "hashtags": ["#标签1", "#标签2", "#标签3"]
}`;
  } else {
    return `Please generate a ${duration}-second video script for the following game:

Game Title: ${gameTitle}
Game Description: ${gameDescription}

Platform: ${platform}
${platformFeatures[platform as keyof typeof platformFeatures][langKey]}

Requirements:
1. Total duration: ${duration} seconds
2. Number of scenes: ${sceneCount} scenes (each scene 2 seconds)
3. Video format: ${aspectRatio}
4. Language: English
5. visual_prompt must be in English

Please return the following JSON format:
{
  "title": "${gameTitle}",
  "language": "en-US",
  "platform": "${platform}",
  "duration": ${duration},
  "aspect_ratio": "${aspectRatio}",
  "scenes": [
    {
      "scene_number": 1,
      "duration": 2,
      "visual_description": "Scene visual description",
      "camera_movement": "Camera movement",
      "voiceover": "Brief voiceover",
      "visual_prompt": "Detailed English visual prompt for AI video generation"
    }
  ],
  "total_scenes": ${sceneCount},
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`;
  }
}

export { openai };

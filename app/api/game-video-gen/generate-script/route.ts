import { NextRequest, NextResponse } from 'next/server';
import { generateVideoScript } from '@/lib/game-video-gen/openai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { gameTitle, gameDescription, language, platform, duration, aspectRatio } = body;

    // 验证必需参数
    if (!gameTitle || !gameDescription) {
      return NextResponse.json(
        { error: '缺少必需参数：gameTitle 和 gameDescription' },
        { status: 400 }
      );
    }

    // 验证游戏标题长度
    if (gameTitle.length < 1 || gameTitle.length > 100) {
      return NextResponse.json(
        { error: '游戏名称长度必须在1-100个字符之间' },
        { status: 400 }
      );
    }

    // 验证游戏描述长度
    if (gameDescription.length < 50 || gameDescription.length > 1000) {
      return NextResponse.json(
        { error: '游戏介绍长度必须在50-1000个字符之间' },
        { status: 400 }
      );
    }

    // 验证时长
    if (![4, 8, 12].includes(duration)) {
      return NextResponse.json(
        { error: '时长必须是4、8或12秒' },
        { status: 400 }
      );
    }

    console.log('开始生成脚本...', {
      gameTitle,
      platform,
      duration,
      language,
    });

    // 调用OpenAI生成脚本
    const script = await generateVideoScript({
      gameTitle,
      gameDescription,
      language: language || 'zh-CN',
      platform: platform || 'douyin',
      duration: duration || 8,
      aspectRatio: aspectRatio || '9:16',
    });

    console.log('脚本生成成功:', {
      title: script.title,
      scenes: script.total_scenes,
    });

    return NextResponse.json({
      success: true,
      script,
      cost: 0.02, // OpenAI GPT-4 Turbo 估算成本
    });
  } catch (error: any) {
    console.error('脚本生成失败:', error);
    
    return NextResponse.json(
      {
        error: '脚本生成失败',
        message: error.message || '未知错误',
      },
      { status: 500 }
    );
  }
}

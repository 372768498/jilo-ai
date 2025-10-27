import { NextRequest, NextResponse } from 'next/server';
import { generateVideo, combineScenePromptsToFullPrompt } from '@/lib/game-video-gen/fal-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5分钟超时

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { script, formData } = body;

    // 验证参数
    if (!script || !script.scenes || script.scenes.length === 0) {
      return NextResponse.json(
        { error: '缺少脚本数据' },
        { status: 400 }
      );
    }

    if (!formData || !formData.duration || !formData.aspectRatio) {
      return NextResponse.json(
        { error: '缺少表单数据' },
        { status: 400 }
      );
    }

    console.log('开始生成视频...', {
      scenes: script.scenes.length,
      duration: formData.duration,
      aspectRatio: formData.aspectRatio,
    });

    // 合并所有场景的visual_prompt成一个完整的prompt
    const fullPrompt = combineScenePromptsToFullPrompt(script.scenes);

    console.log('完整Prompt:', fullPrompt);

    // 调用FAL.AI生成视频
    const videoResult = await generateVideo({
      prompt: fullPrompt,
      duration: formData.duration,
      aspectRatio: formData.aspectRatio,
    });

    console.log('视频生成成功:', {
      videoUrl: videoResult.videoUrl,
      duration: videoResult.duration,
      cost: videoResult.cost,
    });

    return NextResponse.json({
      success: true,
      videoUrl: videoResult.videoUrl,
      duration: videoResult.duration,
      seed: videoResult.seed,
      cost: videoResult.cost,
    });
  } catch (error: any) {
    console.error('视频生成失败:', error);
    
    return NextResponse.json(
      {
        error: '视频生成失败',
        message: error.message || '未知错误',
      },
      { status: 500 }
    );
  }
}

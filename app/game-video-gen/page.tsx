'use client';

import { useState } from 'react';
import { VideoGeneratorForm } from '@/components/game-video-gen/VideoGeneratorForm';
import { VideoPreview } from '@/components/game-video-gen/VideoPreview';
import { GenerationProgress } from '@/components/game-video-gen/GenerationProgress';

export default function GameVideoGenPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    stage: '' | 'script' | 'video' | 'complete';
    progress: number;
    currentScene: number;
    totalScenes: number;
    estimatedTime: number;
  }>({
    stage: '',
    progress: 0,
    currentScene: 0,
    totalScenes: 0,
    estimatedTime: 0,
  });
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);

  const handleGenerate = async (formData: any) => {
    setIsGenerating(true);
    setGeneratedVideo(null);

    try {
      // Stage 1: 生成脚本
      setGenerationProgress({
        stage: 'script',
        progress: 10,
        currentScene: 0,
        totalScenes: formData.duration / 2,
        estimatedTime: 20,
      });

      const scriptResponse = await fetch('/api/game-video-gen/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!scriptResponse.ok) {
        throw new Error('脚本生成失败');
      }

      const scriptData = await scriptResponse.json();

      // Stage 2: 生成视频
      setGenerationProgress({
        stage: 'video',
        progress: 30,
        currentScene: 0,
        totalScenes: scriptData.script.total_scenes,
        estimatedTime: formData.duration === 4 ? 60 : formData.duration === 8 ? 90 : 120,
      });

      const videoResponse = await fetch('/api/game-video-gen/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptData.script,
          formData,
        }),
      });

      if (!videoResponse.ok) {
        throw new Error('视频生成失败');
      }

      const videoData = await videoResponse.json();

      // 完成
      setGenerationProgress({
        stage: 'complete',
        progress: 100,
        currentScene: scriptData.script.total_scenes,
        totalScenes: scriptData.script.total_scenes,
        estimatedTime: 0,
      });

      setGeneratedVideo({
        ...videoData,
        formData,
        script: scriptData.script,
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      alert(error.message || '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedVideo(null);
    setIsGenerating(false);
    setGenerationProgress({
      stage: '',
      progress: 0,
      currentScene: 0,
      totalScenes: 0,
      estimatedTime: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎮 AI游戏视频生成器
          </h1>
          <p className="text-gray-400">
            一键生成专业游戏宣传视频 | 支持多平台 | AI驱动
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {!generatedVideo && !isGenerating && (
            <VideoGeneratorForm onGenerate={handleGenerate} />
          )}

          {isGenerating && (
            <GenerationProgress progress={generationProgress} />
          )}

          {generatedVideo && !isGenerating && (
            <VideoPreview video={generatedVideo} onReset={handleReset} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by OpenAI + FAL.AI SORA2</p>
          <p className="mt-1">
            成本透明 | 快速生成 | 高质量输出
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';

interface VideoPreviewProps {
  video: {
    videoUrl: string;
    script: any;
    formData: any;
    cost?: number;
    duration?: number;
  };
  onReset: () => void;
}

export function VideoPreview({ video, onReset }: VideoPreviewProps) {
  const handleDownload = () => {
    window.open(video.videoUrl, '_blank');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(video.videoUrl);
    alert('视频链接已复制到剪贴板！');
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
      {/* Success Header */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-white mb-2">
          视频生成成功！
        </h2>
        <p className="text-gray-400">
          您的游戏宣传视频已经准备就绪
        </p>
      </div>

      {/* Video Player */}
      <div className="mb-6">
        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: video.formData.aspectRatio === '9:16' ? '177.78%' : '56.25%' }}>
          <video
            src={video.videoUrl}
            controls
            className="absolute top-0 left-0 w-full h-full"
            autoPlay
            loop
          >
            您的浏览器不支持视频播放
          </video>
        </div>
      </div>

      {/* Video Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">游戏名称</p>
          <p className="text-white font-semibold">{video.formData.gameTitle}</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">平台</p>
          <p className="text-white font-semibold">
            {video.formData.platform === 'douyin' ? '抖音' : video.formData.platform === 'kuaishou' ? '快手' : 'YouTube'}
          </p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">时长</p>
          <p className="text-white font-semibold">{video.formData.duration}秒</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">格式</p>
          <p className="text-white font-semibold">{video.formData.aspectRatio}</p>
        </div>
      </div>

      {/* Script Info */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <h3 className="text-white font-semibold mb-3">📝 生成的脚本</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {video.script.scenes && video.script.scenes.map((scene: any, index: number) => (
            <div key={index} className="bg-gray-600 rounded p-3">
              <p className="text-gray-300 text-sm">
                <span className="font-semibold text-white">场景 {scene.scene_number}:</span> {scene.visual_description}
              </p>
              {scene.voiceover && (
                <p className="text-gray-400 text-xs mt-1">
                  旁白: {scene.voiceover}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cost Info */}
      {video.cost && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <p className="text-blue-300 text-sm text-center">
            💰 本次生成成本: 约 ${video.cost.toFixed(2)} USD
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleDownload}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        >
          ⬇️ 下载视频
        </Button>
        <Button
          onClick={handleCopyUrl}
          variant="outline"
          className="flex-1 border-gray-600 text-white hover:bg-gray-700"
        >
          📋 复制链接
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="flex-1 border-gray-600 text-white hover:bg-gray-700"
        >
          🔄 生成新视频
        </Button>
      </div>

      {/* Tips */}
      <div className="mt-6 text-center text-sm text-gray-400">
        <p>💡 提示: 视频链接有效期24小时，请及时下载保存</p>
      </div>
    </div>
  );
}

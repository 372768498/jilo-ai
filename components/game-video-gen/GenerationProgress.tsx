'use client';

interface GenerationProgressProps {
  progress: {
    stage: 'script' | 'video' | 'complete' | '';
    progress: number;
    currentScene: number;
    totalScenes: number;
    estimatedTime: number;
  };
}

export function GenerationProgress({ progress }: GenerationProgressProps) {
  const getStageText = () => {
    switch (progress.stage) {
      case 'script':
        return '正在生成脚本...';
      case 'video':
        return '正在生成视频...';
      case 'complete':
        return '生成完成！';
      default:
        return '准备中...';
    }
  };

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'script':
        return '📝';
      case 'video':
        return '🎬';
      case 'complete':
        return '✅';
      default:
        return '⏳';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
      <div className="text-center">
        <div className="text-6xl mb-4">{getStageIcon()}</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {getStageText()}
        </h2>
        <div className="w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        <p className="text-3xl font-bold text-white mb-4">
          {progress.progress}%
        </p>
        {progress.totalScenes > 0 && progress.stage === 'video' && (
          <div className="mb-4">
            <p className="text-gray-400">
              场景进度: {progress.currentScene} / {progress.totalScenes}
            </p>
          </div>
        )}
        {progress.estimatedTime > 0 && (
          <div className="mb-6">
            <p className="text-gray-400">
              预计剩余时间: 约 {progress.estimatedTime} 秒
            </p>
          </div>
        )}
        <div className="bg-gray-700 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">📝 脚本生成</span>
            <span className={progress.stage === 'script' || progress.progress >= 30 ? 'text-green-400' : 'text-gray-500'}>
              {progress.stage === 'script' ? '进行中...' : progress.progress >= 30 ? '已完成' : '等待中'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">🎬 视频生成</span>
            <span className={progress.stage === 'video' ? 'text-blue-400' : progress.stage === 'complete' ? 'text-green-400' : 'text-gray-500'}>
              {progress.stage === 'video' ? '进行中...' : progress.stage === 'complete' ? '已完成' : '等待中'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">✨ 处理完成</span>
            <span className={progress.stage === 'complete' ? 'text-green-400' : 'text-gray-500'}>
              {progress.stage === 'complete' ? '已完成' : '等待中'}
            </span>
          </div>
        </div>
        <div className="mt-6 text-sm text-gray-400">
          <p>💡 提示: 视频生成需要1-2分钟，请耐心等待</p>
        </div>
      </div>
    </div>
  );
}

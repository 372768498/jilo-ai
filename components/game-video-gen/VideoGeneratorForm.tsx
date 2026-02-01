'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface VideoGeneratorFormProps {
  onGenerate: (formData: any) => void;
}

export function VideoGeneratorForm({ onGenerate }: VideoGeneratorFormProps) {
  const [formData, setFormData] = useState({
    gameTitle: '',
    gameDescription: '',
    language: 'zh-CN',
    platform: 'douyin',
    duration: 8,
    aspectRatio: '9:16',
  });

  const [errors, setErrors] = useState<any>({});

  // 根据平台自动推荐格式
  useEffect(() => {
    if (formData.platform === 'youtube') {
      setFormData((prev) => ({ ...prev, aspectRatio: '16:9' }));
    } else {
      setFormData((prev) => ({ ...prev, aspectRatio: '9:16' }));
    }
  }, [formData.platform]);

  const validate = () => {
    const newErrors: any = {};

    if (!formData.gameTitle || formData.gameTitle.length < 1) {
      newErrors.gameTitle = '请输入游戏名称';
    } else if (formData.gameTitle.length > 100) {
      newErrors.gameTitle = '游戏名称不能超过100个字符';
    }

    if (!formData.gameDescription || formData.gameDescription.length < 50) {
      newErrors.gameDescription = '游戏介绍至少需要50个字符';
    } else if (formData.gameDescription.length > 1000) {
      newErrors.gameDescription = '游戏介绍不能超过1000个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onGenerate(formData);
    }
  };

  const sceneCount = formData.duration / 2;
  const estimatedCost =
    formData.duration === 4 ? 0.13 : formData.duration === 8 ? 0.22 : 0.31;

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Game Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            游戏名称 *
          </label>
          <input
            type="text"
            value={formData.gameTitle}
            onChange={(e) =>
              setFormData({ ...formData, gameTitle: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="例如: 狱国争霸"
            maxLength={100}
          />
          {errors.gameTitle && (
            <p className="mt-1 text-sm text-red-400">{errors.gameTitle}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {formData.gameTitle.length}/100 字符
          </p>
        </div>

        {/* Game Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            游戏介绍 *
          </label>
          <textarea
            value={formData.gameDescription}
            onChange={(e) =>
              setFormData({ ...formData, gameDescription: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
            placeholder="描述游戏的核心玩法、特色功能和亮点..."
            maxLength={1000}
          />
          {errors.gameDescription && (
            <p className="mt-1 text-sm text-red-400">{errors.gameDescription}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {formData.gameDescription.length}/1000 字符 (最少50字符)
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-white mb-4">📝 视频配置</h3>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🌍 语言
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="zh-CN"
                checked={formData.language === 'zh-CN'}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value })
                }
                className="w-4 h-4 text-blue-500"
              />
              <span className="ml-2 text-white">中文简体</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="en-US"
                checked={formData.language === 'en-US'}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value })
                }
                className="w-4 h-4 text-blue-500"
              />
              <span className="ml-2 text-white">English</span>
            </label>
          </div>
        </div>

        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📱 目标平台
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'douyin', label: '抖音', icon: '📱' },
              { value: 'kuaishou', label: '快手', icon: '⚡' },
              { value: 'youtube', label: 'YouTube', icon: '📺' },
            ].map((platform) => (
              <label
                key={platform.value}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.platform === platform.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  value={platform.value}
                  checked={formData.platform === platform.value}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value })
                  }
                  className="sr-only"
                />
                <span className="text-2xl mb-1">{platform.icon}</span>
                <span className="text-white font-medium">{platform.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            💡 不同平台会生成不同风格的内容
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ⏱️ 视频时长
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 4, label: '4秒', scenes: 2, desc: '快速冲击' },
              { value: 8, label: '8秒', scenes: 4, desc: '标准版' },
              { value: 12, label: '12秒', scenes: 6, desc: '完整版' },
            ].map((duration) => (
              <label
                key={duration.value}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.duration === duration.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  value={duration.value}
                  checked={formData.duration === duration.value}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: Number(e.target.value) })
                  }
                  className="sr-only"
                />
                <span className="text-white font-bold text-lg">
                  {duration.label}
                </span>
                <span className="text-gray-400 text-sm mt-1">
                  {duration.scenes}个场景
                </span>
                <span className="text-gray-500 text-xs mt-1">
                  {duration.desc}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            预估成本: ~${estimatedCost.toFixed(2)}
          </p>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📐 视频格式
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.aspectRatio === '9:16'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                value="9:16"
                checked={formData.aspectRatio === '9:16'}
                onChange={(e) =>
                  setFormData({ ...formData, aspectRatio: e.target.value })
                }
                className="sr-only"
              />
              <span className="text-2xl mb-1">📱</span>
              <span className="text-white font-medium">竖屏 (9:16)</span>
              <span className="text-gray-400 text-xs mt-1">
                推荐: 抖音/快手
              </span>
            </label>
            <label
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.aspectRatio === '16:9'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                value="16:9"
                checked={formData.aspectRatio === '16:9'}
                onChange={(e) =>
                  setFormData({ ...formData, aspectRatio: e.target.value })
                }
                className="sr-only"
              />
              <span className="text-2xl mb-1">🖥️</span>
              <span className="text-white font-medium">横屏 (16:9)</span>
              <span className="text-gray-400 text-xs mt-1">
                推荐: YouTube
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <Button
            type="submit"
            className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            🎬 生成视频
          </Button>
          <p className="mt-3 text-center text-sm text-gray-400">
            预估: 1-3分钟 | 成本: $
            {(formData.duration === 4 ? 0.08 : formData.duration === 8 ? 0.15 : 0.2).toFixed(2)}-$
            {(formData.duration === 4 ? 0.12 : formData.duration === 8 ? 0.2 : 0.3).toFixed(2)}
          </p>
        </div>
      </form>
    </div>
  );
}

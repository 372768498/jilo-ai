// GameVideoGen 类型定义

export interface VideoFormData {
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

export interface GenerationProgress {
  stage: 'script' | 'video' | 'complete' | '';
  progress: number;
  currentScene: number;
  totalScenes: number;
  estimatedTime: number;
}

export interface GeneratedVideo {
  videoUrl: string;
  script: VideoScript;
  formData: VideoFormData;
  cost?: number;
  duration?: number;
}

export const PLATFORMS = {
  douyin: '抖音',
  kuaishou: '快手',
  youtube: 'YouTube',
} as const;

export const DURATIONS = [4, 8, 12] as const;

export const ASPECT_RATIOS = {
  '9:16': '竖屏',
  '16:9': '横屏',
} as const;

export const LANGUAGES = {
  'zh-CN': '中文',
  'en-US': 'English',
} as const;

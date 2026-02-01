/**
 * Semantic Link Registry — 全局语义映射表
 * 
 * 禁止在页面内硬编码链接。所有实体注册到此表。
 * 页面渲染时根据 tags/category 动态匹配注入。
 * URL 变更只需改此表，全站同步。
 */

// ========== Types ==========

export interface ToolEntity {
  slug: string;
  name: string;
  categories: string[];
  tags: string[];
  competitors: string[];   // slug references
  pricing: "free" | "freemium" | "paid" | "enterprise" | "open-source";
  url: string;
  lastVerified: string;
  status: "active" | "deprecated" | "beta";
}

export interface ComparisonEntity {
  slug: string;
  tools: [string, string];  // tool slugs
  category: string;
}

export interface AlternativeEntity {
  slug: string;
  baseTool: string;         // tool slug
  alternatives: string[];   // tool slugs
  category: string;
}

export interface BestListEntity {
  slug: string;
  category: string;
  tools: string[];           // tool slugs, ordered by rank
}

export interface CategoryEntity {
  slug: string;
  name_en: string;
  name_zh: string;
  icon: string;
  tools: string[];           // tool slugs
}

// ========== Registry ==========

export const categories: Record<string, CategoryEntity> = {
  "ai-chatbot": { slug: "ai-chatbot", name_en: "AI Chatbots", name_zh: "AI 聊天", icon: "💬", tools: ["chatgpt", "claude", "gemini", "perplexity", "deepseek"] },
  "ai-writing": { slug: "ai-writing", name_en: "AI Writing", name_zh: "AI 写作", icon: "✍️", tools: ["chatgpt", "jasper", "grammarly", "copy-ai", "writesonic", "notion-ai"] },
  "ai-coding": { slug: "ai-coding", name_en: "AI Coding", name_zh: "AI 编程", icon: "💻", tools: ["github-copilot", "cursor", "codeium", "tabnine", "amazon-codewhisperer", "replit"] },
  "ai-design": { slug: "ai-design", name_en: "AI Design", name_zh: "AI 设计", icon: "🎨", tools: ["midjourney", "dall-e", "stable-diffusion", "canva", "figma-ai", "adobe-firefly"] },
  "ai-video": { slug: "ai-video", name_en: "AI Video", name_zh: "AI 视频", icon: "🎬", tools: ["runway", "pika", "sora", "synthesia", "descript", "heygen"] },
  "ai-voice": { slug: "ai-voice", name_en: "AI Voice & Audio", name_zh: "AI 语音", icon: "🎙️", tools: ["elevenlabs", "murf", "play-ht", "resemble-ai", "speechify"] },
  "ai-search": { slug: "ai-search", name_en: "AI Search", name_zh: "AI 搜索", icon: "🔍", tools: ["perplexity", "you-com", "phind", "consensus"] },
  "ai-productivity": { slug: "ai-productivity", name_en: "AI Productivity", name_zh: "AI 效率", icon: "📝", tools: ["notion-ai", "otter-ai", "mem", "taskade"] },
  "ai-data": { slug: "ai-data", name_en: "AI Data Analysis", name_zh: "AI 数据分析", icon: "📊", tools: ["julius-ai", "obviously-ai", "monkeylearn"] },
  "ai-translation": { slug: "ai-translation", name_en: "AI Translation", name_zh: "AI 翻译", icon: "🌐", tools: ["deepl", "google-translate", "smartcat"] },
  "ai-education": { slug: "ai-education", name_en: "AI Education", name_zh: "AI 教育", icon: "🎓", tools: ["khan-academy-ai", "duolingo-max", "quizlet-ai"] },
  "ai-business": { slug: "ai-business", name_en: "AI for Business", name_zh: "AI 商业", icon: "💼", tools: ["salesforce-einstein", "hubspot-ai", "drift"] },
  "ai-marketing": { slug: "ai-marketing", name_en: "AI Marketing", name_zh: "AI 营销", icon: "📢", tools: ["jasper", "copy-ai", "surfer-seo", "semrush-ai"] },
};

export const tools: Record<string, ToolEntity> = {
  "chatgpt": {
    slug: "chatgpt", name: "ChatGPT", url: "https://chat.openai.com",
    categories: ["ai-chatbot", "ai-writing", "ai-coding"],
    tags: ["gpt", "llm", "openai", "free-tier", "api", "multimodal", "plugins"],
    competitors: ["claude", "gemini", "perplexity", "deepseek"],
    pricing: "freemium", lastVerified: "2026-02-01", status: "active"
  },
  "claude": {
    slug: "claude", name: "Claude", url: "https://claude.ai",
    categories: ["ai-chatbot", "ai-writing", "ai-coding"],
    tags: ["anthropic", "llm", "safety", "long-context", "api"],
    competitors: ["chatgpt", "gemini", "perplexity"],
    pricing: "freemium", lastVerified: "2026-02-01", status: "active"
  },
  "gemini": {
    slug: "gemini", name: "Gemini", url: "https://gemini.google.com",
    categories: ["ai-chatbot", "ai-writing"],
    tags: ["google", "llm", "multimodal", "free-tier", "api"],
    competitors: ["chatgpt", "claude", "perplexity"],
    pricing: "freemium", lastVerified: "2026-02-01", status: "active"
  },
  "perplexity": {
    slug: "perplexity", name: "Perplexity", url: "https://perplexity.ai",
    categories: ["ai-chatbot", "ai-search"],
    tags: ["search", "research", "citations", "free-tier", "api"],
    competitors: ["chatgpt", "you-com", "phind"],
    pricing: "freemium", lastVerified: "2026-02-01", status: "active"
  },
  "deepseek": {
    slug: "deepseek", name: "DeepSeek", url: "https://deepseek.com",
    categories: ["ai-chatbot", "ai-coding"],
    tags: ["chinese-ai", "llm", "open-source", "coding", "free"],
    competitors: ["chatgpt", "claude", "gemini"],
    pricing: "free", lastVerified: "2026-02-01", status: "active"
  },
  "midjourney": {
    slug: "midjourney", name: "Midjourney", url: "https://midjourney.com",
    categories: ["ai-design"],
    tags: ["image-generation", "art", "creative", "discord"],
    competitors: ["dall-e", "stable-diffusion", "adobe-firefly", "leonardo-ai"],
    pricing: "paid", lastVerified: "2026-02-01", status: "active"
  },
  "dall-e": {
    slug: "dall-e", name: "DALL-E", url: "https://openai.com/dall-e",
    categories: ["ai-design"],
    tags: ["image-generation", "openai", "api", "art"],
    competitors: ["midjourney", "stable-diffusion", "adobe-firefly"],
    pricing: "paid", lastVerified: "2026-02-01", status: "active"
  },
  "stable-diffusion": {
    slug: "stable-diffusion", name: "Stable Diffusion", url: "https://stability.ai",
    categories: ["ai-design"],
    tags: ["image-generation", "open-source", "local", "customizable"],
    competitors: ["midjourney", "dall-e", "adobe-firefly"],
    pricing: "open-source", lastVerified: "2026-02-01", status: "active"
  },
  "github-copilot": {
    slug: "github-copilot", name: "GitHub Copilot", url: "https://github.com/features/copilot",
    categories: ["ai-coding"],
    tags: ["coding", "autocomplete", "github", "vscode", "ide"],
    competitors: ["cursor", "codeium", "tabnine", "amazon-codewhisperer"],
    pricing: "paid", lastVerified: "2026-02-01", status: "active"
  },
  "cursor": {
    slug: "cursor", name: "Cursor", url: "https://cursor.sh",
    categories: ["ai-coding"],
    tags: ["coding", "ide", "editor", "ai-native"],
    competitors: ["github-copilot", "codeium", "windsurf"],
    pricing: "freemium", lastVerified: "2026-02-01", status: "active"
  },
  "jasper": {
    slug: "jasper", name: "Jasper", url: "https://jasper.ai",
    categories: ["ai-writing", "ai-marketing"],
    tags: ["marketing", "copywriting", "content", "enterprise"],
    competitors: ["chatgpt", "copy-ai", "writesonic"],
    pricing: "paid", lastVerified: "2026-02-01", status: "active"
  },
  "grammarly": {
    slug: "grammarly", name: "Grammarly", url: "https://grammarly.com",
    categories: ["ai-writing"],
    tags: ["grammar", "editing", "proofreading", "browser-extension"],
    competitors: ["chatgpt", "hemingway", "prowritingaid", "quillbot"],
    pricing: "freemium", lastVerified: "2026-02-01", status: "active"
  },
  "notion-ai": {
    slug: "notion-ai", name: "Notion AI", url: "https://notion.so",
    categories: ["ai-writing", "ai-productivity"],
    tags: ["workspace", "notes", "collaboration", "ai-assistant"],
    competitors: ["chatgpt", "coda-ai", "clickup-ai"],
    pricing: "freemium", lastVerified: "2026-02-01", status: "active"
  },
  "canva": {
    slug: "canva", name: "Canva", url: "https://canva.com",
    categories: ["ai-design"],
    tags: ["design", "templates", "social-media", "easy"],
    competitors: ["figma-ai", "adobe-express", "visme"],
    pricing: "freemium", lastVerified: "2026-02-01", status: "active"
  },
  "runway": {
    slug: "runway", name: "Runway", url: "https://runwayml.com",
    categories: ["ai-video"],
    tags: ["video-generation", "editing", "gen-2", "creative"],
    competitors: ["pika", "sora", "synthesia", "heygen"],
    pricing: "freemium", lastVerified: "2026-02-01", status: "active"
  },
  "elevenlabs": {
    slug: "elevenlabs", name: "ElevenLabs", url: "https://elevenlabs.io",
    categories: ["ai-voice"],
    tags: ["tts", "voice-cloning", "audio", "api", "realistic"],
    competitors: ["murf", "play-ht", "resemble-ai"],
    pricing: "freemium", lastVerified: "2026-02-01", status: "active"
  },
};

export const comparisons: Record<string, ComparisonEntity> = {
  "chatgpt-vs-claude": { slug: "chatgpt-vs-claude", tools: ["chatgpt", "claude"], category: "ai-chatbot" },
  "chatgpt-vs-gemini": { slug: "chatgpt-vs-gemini", tools: ["chatgpt", "gemini"], category: "ai-chatbot" },
  "claude-vs-gemini": { slug: "claude-vs-gemini", tools: ["claude", "gemini"], category: "ai-chatbot" },
  "midjourney-vs-dall-e": { slug: "midjourney-vs-dall-e", tools: ["midjourney", "dall-e"], category: "ai-design" },
  "chatgpt-vs-perplexity": { slug: "chatgpt-vs-perplexity", tools: ["chatgpt", "perplexity"], category: "ai-chatbot" },
  "github-copilot-vs-chatgpt": { slug: "github-copilot-vs-chatgpt", tools: ["github-copilot", "chatgpt"], category: "ai-coding" },
  "jasper-vs-chatgpt": { slug: "jasper-vs-chatgpt", tools: ["jasper", "chatgpt"], category: "ai-writing" },
  "notion-ai-vs-chatgpt": { slug: "notion-ai-vs-chatgpt", tools: ["notion-ai", "chatgpt"], category: "ai-productivity" },
  "grammarly-vs-chatgpt": { slug: "grammarly-vs-chatgpt", tools: ["grammarly", "chatgpt"], category: "ai-writing" },
  "stable-diffusion-vs-midjourney": { slug: "stable-diffusion-vs-midjourney", tools: ["stable-diffusion", "midjourney"], category: "ai-design" },
};

export const alternatives: Record<string, AlternativeEntity> = {
  "chatgpt-alternatives": { slug: "chatgpt-alternatives", baseTool: "chatgpt", alternatives: ["claude", "gemini", "perplexity", "deepseek"], category: "ai-chatbot" },
  "midjourney-alternatives": { slug: "midjourney-alternatives", baseTool: "midjourney", alternatives: ["dall-e", "stable-diffusion", "adobe-firefly", "leonardo-ai"], category: "ai-design" },
  "grammarly-alternatives": { slug: "grammarly-alternatives", baseTool: "grammarly", alternatives: ["chatgpt", "hemingway", "prowritingaid", "quillbot"], category: "ai-writing" },
  "notion-alternatives": { slug: "notion-alternatives", baseTool: "notion-ai", alternatives: ["coda-ai", "clickup-ai", "obsidian"], category: "ai-productivity" },
  "jasper-alternatives": { slug: "jasper-alternatives", baseTool: "jasper", alternatives: ["chatgpt", "copy-ai", "writesonic"], category: "ai-marketing" },
  "github-copilot-alternatives": { slug: "github-copilot-alternatives", baseTool: "github-copilot", alternatives: ["cursor", "codeium", "tabnine", "amazon-codewhisperer"], category: "ai-coding" },
  "canva-alternatives": { slug: "canva-alternatives", baseTool: "canva", alternatives: ["figma-ai", "adobe-express", "visme"], category: "ai-design" },
  "perplexity-alternatives": { slug: "perplexity-alternatives", baseTool: "perplexity", alternatives: ["chatgpt", "you-com", "phind"], category: "ai-search" },
  "elevenlabs-alternatives": { slug: "elevenlabs-alternatives", baseTool: "elevenlabs", alternatives: ["murf", "play-ht", "resemble-ai"], category: "ai-voice" },
  "runway-alternatives": { slug: "runway-alternatives", baseTool: "runway", alternatives: ["pika", "sora", "synthesia", "heygen"], category: "ai-video" },
};

export const bestLists: Record<string, BestListEntity> = {
  "best-ai-writing-tools": { slug: "best-ai-writing-tools", category: "ai-writing", tools: ["chatgpt", "jasper", "grammarly", "copy-ai", "notion-ai"] },
  "best-ai-coding-tools": { slug: "best-ai-coding-tools", category: "ai-coding", tools: ["github-copilot", "cursor", "codeium", "tabnine"] },
  "best-ai-design-tools": { slug: "best-ai-design-tools", category: "ai-design", tools: ["midjourney", "dall-e", "canva", "stable-diffusion"] },
  "best-ai-video-tools": { slug: "best-ai-video-tools", category: "ai-video", tools: ["runway", "pika", "sora", "synthesia"] },
  "best-ai-tools-for-business": { slug: "best-ai-tools-for-business", category: "ai-business", tools: ["chatgpt", "jasper", "notion-ai"] },
  "best-ai-data-analysis-tools": { slug: "best-ai-data-analysis-tools", category: "ai-data", tools: ["julius-ai", "obviously-ai"] },
  "best-ai-voice-tools": { slug: "best-ai-voice-tools", category: "ai-voice", tools: ["elevenlabs", "murf", "play-ht"] },
  "best-ai-translation-tools": { slug: "best-ai-translation-tools", category: "ai-translation", tools: ["deepl", "google-translate"] },
  "best-ai-tools-for-education": { slug: "best-ai-tools-for-education", category: "ai-education", tools: ["khan-academy-ai", "duolingo-max"] },
  "best-free-ai-tools": { slug: "best-free-ai-tools", category: "ai-chatbot", tools: ["chatgpt", "deepseek", "stable-diffusion", "codeium"] },
};

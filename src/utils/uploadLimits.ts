// src/utils/uploadLimits.ts
// 上传相关的安全/容量限制常量

export const UPLOAD_LIMITS = {
  // 标题
  TITLE_MAX: 100,
  TITLE_EN_MAX: 200,

  // 文本内容
  TRANSCRIPT_MAX: 50_000,   // ~10k 词，足够 20 分钟音频
  TRANSLATION_MAX: 50_000,

  // 文件
  AUDIO_SIZE_MAX: 50 * 1024 * 1024,  // 50MB
  ALLOWED_AUDIO_TYPES: [
    'audio/mpeg',      // .mp3
    'audio/mp3',
    'audio/wav',       // .wav
    'audio/wave',
    'audio/x-wav',
    'audio/m4a',       // .m4a
    'audio/x-m4a',
    'audio/mp4',       // .mp4 audio
  ] as readonly string[],
  ALLOWED_AUDIO_EXT: /\.(mp3|wav|m4a)$/i,

  // 危险扩展名（即使 type 被伪造，扩展名也得合法）
  DANGEROUS_EXT: /\.(exe|bat|sh|js|jsx|ts|tsx|html|htm|svg|php|py|jar|app|dmg|iso|msi|com|scr|vbs|wsf|cgi|pl|asp|aspx|jsp|do|action|zip|rar|7z|tar|gz)$/i,

  // 数量上限
  MATERIALS_LIMIT: 50,             // 单用户最多 50 篇
  TOTAL_TEXT_CHARS: 2_000_000,     // 2MB 总文本（localStorage 安全余量内）

  // Rate limit
  UPLOAD_COOLDOWN_MS: 3000,        // 3 秒冷却
} as const

// 危险 HTML/脚本模式（防御性兜底，React 默认转义但防止后续引入 markdown 渲染时中招）
const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*?>/gi

export function sanitizeText(s: string): string {
  return s
    .replace(SCRIPT_PATTERN, '')           // 移除 <script> 块
    .replace(HTML_TAG_PATTERN, '')         // 移除所有 HTML 标签
    .trim()
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

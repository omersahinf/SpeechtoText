export const DASHSCOPE_MODELS = [
  { value: 'qwen3.6-plus', label: 'Qwen 3.6 Plus (önerilen)' },
  { value: 'qwen3.5-plus', label: 'Qwen 3.5 Plus' },
  { value: 'qwen-plus', label: 'Qwen Plus' },
  { value: 'qwen-turbo', label: 'Qwen Turbo (hızlı)' },
  { value: 'qwen-max', label: 'Qwen Max (güçlü)' }
] as const

export const DEFAULT_DASHSCOPE_MODEL = 'qwen3.6-plus'
export const DEFAULT_DASHSCOPE_BASE_URL = 'https://coding-intl.dashscope.aliyuncs.com/v1'
export const DEFAULT_HOTKEY_KEY_CODE = 3640
export const DEFAULT_LLM_TEMPERATURE = 0.1

export const PIPELINE = {
  MIN_RECORD_DURATION_MS: 300,
  SILENCE_THRESHOLD_RMS: 0.001,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 500,
  SILENCE_DETECTION_PEAK_THRESHOLD: 0.01
} as const

export const LLM_CACHE = {
  MAX_ENTRIES: 100,
  TTL_MS: 24 * 60 * 60 * 1000
} as const

export const HISTORY = {
  MAX_ENTRIES: 200
} as const

export const SNIPPETS = {
  MAX_ENTRIES: 100,
  TRIGGER_PREFIX: '@'
} as const

export const UI_LANGUAGES = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' }
] as const

export type UiLanguage = 'tr' | 'en'

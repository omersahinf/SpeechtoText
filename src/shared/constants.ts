export const OLLAMA_MODELS = [{ value: 'gemma2:2b', label: 'Gemma 2 2B (yerel)' }] as const

export const DEFAULT_OLLAMA_MODEL = 'gemma2:2b'
export const DEFAULT_OLLAMA_FALLBACK_MODELS = OLLAMA_MODELS.map((model) => model.value)
export const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
export const LEGACY_DASHSCOPE_BASE_URL = 'https://coding-intl.dashscope.aliyuncs.com/v1'
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

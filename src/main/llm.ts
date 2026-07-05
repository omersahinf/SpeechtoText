import type { DictationLanguageMode } from '@/shared/types'
import {
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_FALLBACK_MODELS,
  DEFAULT_OLLAMA_MODEL
} from '@/shared/constants'
import { logger } from './logger'
import { withRetry, withTimeout } from './util/retry'
import {
  CLEAN_TRANSCRIPT_PROMPT_VERSION,
  CLEAN_TRANSCRIPT_SYSTEM_PROMPT,
  getPromptForMode
} from './prompts/tr-cleanup'
import { getVocabBlock, type VocabPreset } from './prompts/vocab-presets'
import { getAppContextInstruction } from './prompts/app-context'
import { createLlmCache, buildCacheKey } from './util/llm-cache'
import { applyTurkishPhoneticWriting } from './util/tr-phonetic'

export interface CleanTranscriptOptions {
  mode?: 'conservative' | 'standard'
  languageMode?: DictationLanguageMode
  temperature?: number
  customPrompt?: string
  vocabPreset?: VocabPreset
  appContext?: string | null
  useCache?: boolean
  allowRewrite?: boolean
}

export interface CleanTranscriptResult {
  text: string
  latencyMs: number
  fallback?: boolean
  fromCache?: boolean
  model?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaChatResponse {
  model?: string
  message?: {
    content?: string
  }
  error?: string
}

const REQUEST_TIMEOUT_MS = 15_000
const MAX_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 400
const DEFAULT_TEMPERATURE = 0.1

// Eski API tüketicileri için yeniden ihraç edilen sabit.
export { CLEAN_TRANSCRIPT_SYSTEM_PROMPT }

const llmCache = createLlmCache()

function getPromptCacheVersion(options: CleanTranscriptOptions): string {
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL
  const languageMode = options.languageMode ?? 'tr-en'
  return `${CLEAN_TRANSCRIPT_PROMPT_VERSION}:${getPromptForMode(options.mode ?? 'conservative', languageMode).id}:${languageMode}:${model}`
}

export function estimateMaxTokens(rawText: string): number {
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length
  const estimated = Math.ceil(wordCount * 2.2 + 32)
  return Math.min(4096, Math.max(64, estimated))
}

function buildSystemPrompt(options: CleanTranscriptOptions): string {
  const base = getPromptForMode(
    options.mode ?? 'conservative',
    options.languageMode ?? 'tr-en'
  ).system
  const vocab = getVocabBlock(options.vocabPreset ?? 'none')
  const appCtx = getAppContextInstruction(options.appContext)
  const custom = options.customPrompt?.trim()
    ? `\nEK KULLANICI KURALI: ${options.customPrompt.trim()}`
    : ''
  return `${base}${vocab}${appCtx}${custom}`
}

function applyLanguageModePostProcessing(text: string, options: CleanTranscriptOptions): string {
  return options.languageMode === 'tr' ? applyTurkishPhoneticWriting(text) : text
}

function tokenizeForSimilarity(text: string): string[] {
  return text.toLocaleLowerCase('tr-TR').match(/[\p{L}\p{N}]+/gu) ?? []
}

function isNumericLike(token: string): boolean {
  return /\d/.test(token)
}

export function isCleanTranscriptOutputSafe(rawText: string, cleanedText: string): boolean {
  const rawTokens = tokenizeForSimilarity(rawText)
  const cleanedTokens = tokenizeForSimilarity(cleanedText)

  if (cleanedTokens.length === 0) {
    return false
  }

  if (rawTokens.length === 0) {
    return true
  }

  const maxAddedTokens = rawTokens.length <= 3 ? 1 : Math.max(4, Math.ceil(rawTokens.length * 0.4))
  if (cleanedTokens.length > rawTokens.length + maxAddedTokens) {
    return false
  }

  const rawTokenSet = new Set(rawTokens)
  const introducedTokens = cleanedTokens.filter(
    (token) => !rawTokenSet.has(token) && !isNumericLike(token)
  )
  const maxIntroducedTokens =
    rawTokens.length <= 3 ? 2 : Math.max(4, Math.ceil(rawTokens.length * 0.35))

  return introducedTokens.length <= maxIntroducedTokens
}

export function createCleanTranscriptMessages(
  rawText: string,
  options: CleanTranscriptOptions = {}
): ChatMessage[] {
  return [
    { role: 'system', content: buildSystemPrompt(options) },
    { role: 'user', content: rawText }
  ]
}

function clampTemperature(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_TEMPERATURE
  }
  return Math.min(0.5, Math.max(0, value))
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function getModelFallbackChain(): string[] {
  const configuredFallbacks = process.env.OLLAMA_FALLBACK_MODELS?.split(',') ?? []
  const selectedModel = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL
  return uniqueNonEmpty([selectedModel, ...configuredFallbacks, ...DEFAULT_OLLAMA_FALLBACK_MODELS])
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: unknown
      code?: unknown
      type?: unknown
      error?: unknown
    }
    return [maybeError.message, maybeError.code, maybeError.type, maybeError.error]
      .filter((value) => typeof value === 'string')
      .join(' ')
  }

  return String(error)
}

function isModelFallbackError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return ['model', 'not found', 'not exist', 'not available', 'pull model'].some((needle) =>
    message.includes(needle)
  )
}

async function cleanOnce(
  rawText: string,
  options: CleanTranscriptOptions,
  model: string
): Promise<string> {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL).replace(/\/+$/, '')
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: createCleanTranscriptMessages(rawText, options),
      stream: false,
      options: {
        temperature: clampTemperature(options.temperature),
        num_predict: estimateMaxTokens(rawText)
      }
    })
  })

  const payload = (await response.json().catch(() => ({}))) as OllamaChatResponse
  if (!response.ok) {
    throw new Error(payload.error || `Ollama request failed with HTTP ${response.status}`)
  }

  return payload.message?.content?.trim() || rawText
}

async function cleanWithModelFallback(
  rawText: string,
  options: CleanTranscriptOptions
): Promise<{ text: string; model: string }> {
  const models = getModelFallbackChain()
  let lastError: unknown

  for (const model of models) {
    try {
      const text = await withRetry(
        () => withTimeout(cleanOnce(rawText, options, model), REQUEST_TIMEOUT_MS, 'llm'),
        {
          maxAttempts: MAX_ATTEMPTS,
          baseDelayMs: BASE_RETRY_DELAY_MS,
          label: `llm:${model}`,
          shouldRetry: (error) => !isModelFallbackError(error)
        }
      )
      return { text, model }
    } catch (error) {
      lastError = error

      if (!isModelFallbackError(error)) {
        throw error
      }

      logger.warn(`[llm] ${model} kullanilamadi; siradaki Ollama modeline geciliyor.`, error)
    }
  }

  throw lastError
}

export async function cleanTranscript(
  rawText: string,
  options: CleanTranscriptOptions = {}
): Promise<CleanTranscriptResult> {
  const startedAt = Date.now()

  if (!rawText.trim()) {
    return { text: rawText, latencyMs: 0 }
  }

  // LLM cache kontrolü
  if (options.useCache !== false) {
    const cacheKey = buildCacheKey(rawText, {
      ...options,
      promptVersion: getPromptCacheVersion(options)
    })
    const cached = llmCache.get(cacheKey)
    if (cached) {
      logger.debug('[llm] cache hit')
      return { text: cached, latencyMs: 0, fromCache: true }
    }
  }

  try {
    const result = await cleanWithModelFallback(rawText, options)

    const text = applyLanguageModePostProcessing(result.text, options)

    if (!options.allowRewrite && !isCleanTranscriptOutputSafe(rawText, text)) {
      logger.warn(
        `[llm] temizleme ciktisi ham metinden fazla saptigi icin yok sayildi. raw="${rawText}" cleaned="${text}"`
      )
      return {
        text: rawText,
        latencyMs: Date.now() - startedAt,
        fallback: true,
        model: result.model
      }
    }

    // Cache'e yaz
    if (options.useCache !== false) {
      const cacheKey = buildCacheKey(rawText, {
        ...options,
        promptVersion: getPromptCacheVersion(options)
      })
      llmCache.set(cacheKey, text)
    }

    return { text, latencyMs: Date.now() - startedAt, model: result.model }
  } catch (error) {
    logger.warn('[llm] temizleme basarisiz; ham transkript kullaniliyor.', error)
    return { text: rawText, latencyMs: Date.now() - startedAt, fallback: true }
  }
}

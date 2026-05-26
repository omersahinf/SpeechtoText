import OpenAI from 'openai'
import { logger } from './logger'
import { withRetry, withTimeout } from './util/retry'
import { CLEAN_TRANSCRIPT_SYSTEM_PROMPT, getPromptForMode } from './prompts/tr-cleanup'
import { getVocabBlock, type VocabPreset } from './prompts/vocab-presets'
import { getAppContextInstruction } from './prompts/app-context'
import { createLlmCache, buildCacheKey } from './util/llm-cache'

export interface CleanTranscriptOptions {
  mode?: 'conservative' | 'standard'
  temperature?: number
  customPrompt?: string
  vocabPreset?: VocabPreset
  appContext?: string | null
  useCache?: boolean
}

export interface CleanTranscriptResult {
  text: string
  latencyMs: number
  fallback?: boolean
  fromCache?: boolean
}

type DashScopeChatRequest = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
  enable_thinking?: boolean
}

const DEFAULT_BASE_URL = 'https://coding-intl.dashscope.aliyuncs.com/v1'
const DEFAULT_MODEL = 'qwen3.6-plus'
const REQUEST_TIMEOUT_MS = 15_000
const MAX_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 400
const DEFAULT_TEMPERATURE = 0.1

// Eski API tüketicileri için yeniden ihraç edilen sabit.
export { CLEAN_TRANSCRIPT_SYSTEM_PROMPT }

const llmCache = createLlmCache()

export function estimateMaxTokens(rawText: string): number {
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length
  const estimated = Math.ceil(wordCount * 2.2 + 32)
  return Math.min(4096, Math.max(64, estimated))
}

function buildSystemPrompt(options: CleanTranscriptOptions): string {
  const base = getPromptForMode(options.mode ?? 'conservative').system
  const vocab = getVocabBlock(options.vocabPreset ?? 'none')
  const appCtx = getAppContextInstruction(options.appContext)
  const custom = options.customPrompt?.trim()
    ? `\nEK KULLANICI KURALI: ${options.customPrompt.trim()}`
    : ''
  return `${base}${vocab}${appCtx}${custom}`
}

function getDashScopeClient(): OpenAI {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY is missing')
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.DASHSCOPE_BASE_URL ?? DEFAULT_BASE_URL,
    timeout: REQUEST_TIMEOUT_MS
  })
}

export function createCleanTranscriptMessages(
  rawText: string,
  options: CleanTranscriptOptions = {}
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
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

async function cleanOnce(
  client: OpenAI,
  rawText: string,
  options: CleanTranscriptOptions
): Promise<string> {
  const request: DashScopeChatRequest = {
    model: process.env.DASHSCOPE_MODEL ?? DEFAULT_MODEL,
    messages: createCleanTranscriptMessages(rawText, options),
    temperature: clampTemperature(options.temperature),
    max_tokens: estimateMaxTokens(rawText),
    enable_thinking: false
  }

  const completion = await client.chat.completions.create(request)
  return completion.choices[0]?.message?.content?.trim() || rawText
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
    const cacheKey = buildCacheKey(rawText, options)
    const cached = llmCache.get(cacheKey)
    if (cached) {
      logger.debug('[llm] cache hit')
      return { text: cached, latencyMs: 0, fromCache: true }
    }
  }

  try {
    const client = getDashScopeClient()

    const text = await withRetry(
      () => withTimeout(cleanOnce(client, rawText, options), REQUEST_TIMEOUT_MS, 'llm'),
      {
        maxAttempts: MAX_ATTEMPTS,
        baseDelayMs: BASE_RETRY_DELAY_MS,
        label: 'llm'
      }
    )

    // Cache'e yaz
    if (options.useCache !== false) {
      const cacheKey = buildCacheKey(rawText, options)
      llmCache.set(cacheKey, text)
    }

    return { text, latencyMs: Date.now() - startedAt }
  } catch (error) {
    logger.warn('[llm] temizleme basarisiz; ham transkript kullaniliyor.', error)
    return { text: rawText, latencyMs: Date.now() - startedAt, fallback: true }
  }
}

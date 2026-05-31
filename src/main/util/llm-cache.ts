import { LLM_CACHE } from '@/shared/constants'

interface CacheEntry {
  value: string
  expiresAt: number
}

export interface LlmCache {
  get: (key: string) => string | null
  set: (key: string, value: string) => void
  clear: () => void
  size: () => number
}

export function createLlmCache(): LlmCache {
  const store = new Map<string, CacheEntry>()
  const insertionOrder: string[] = []

  const evictExpired = (): void => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) {
        store.delete(key)
        const idx = insertionOrder.indexOf(key)
        if (idx !== -1) insertionOrder.splice(idx, 1)
      }
    }
  }

  const evictLru = (): void => {
    while (store.size >= LLM_CACHE.MAX_ENTRIES && insertionOrder.length > 0) {
      const oldest = insertionOrder.shift()!
      store.delete(oldest)
    }
  }

  return {
    get(key: string): string | null {
      const entry = store.get(key)
      if (!entry) return null
      if (entry.expiresAt <= Date.now()) {
        store.delete(key)
        const idx = insertionOrder.indexOf(key)
        if (idx !== -1) insertionOrder.splice(idx, 1)
        return null
      }
      return entry.value
    },

    set(key: string, value: string): void {
      evictExpired()
      if (store.has(key)) {
        const idx = insertionOrder.indexOf(key)
        if (idx !== -1) insertionOrder.splice(idx, 1)
      } else {
        evictLru()
      }
      store.set(key, { value, expiresAt: Date.now() + LLM_CACHE.TTL_MS })
      insertionOrder.push(key)
    },

    clear(): void {
      store.clear()
      insertionOrder.length = 0
    },

    size(): number {
      return store.size
    }
  }
}

export function buildCacheKey(
  rawText: string,
  options: {
    mode?: string
    temperature?: number
    customPrompt?: string
    vocabPreset?: string
    appContext?: string | null
    promptVersion?: string
  }
): string {
  return JSON.stringify({
    pv: options.promptVersion ?? '',
    t: rawText,
    m: options.mode ?? '',
    temp: options.temperature ?? 0,
    cp: options.customPrompt ?? '',
    vp: options.vocabPreset ?? '',
    ac: options.appContext ?? ''
  })
}

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLlmCache, buildCacheKey } from '../src/main/util/llm-cache'

// LLM_CACHE sabitleri test için mock'la (TTL çok kısa)
vi.mock('../src/shared/constants', async () => {
  const actual =
    await vi.importActual<typeof import('../src/shared/constants')>('../src/shared/constants')
  return {
    ...actual,
    LLM_CACHE: {
      MAX_ENTRIES: 3,
      TTL_MS: 100 // 100ms TTL for testing
    }
  }
})

describe('createLlmCache', () => {
  let cache: ReturnType<typeof createLlmCache>

  beforeEach(() => {
    cache = createLlmCache()
  })

  it('returns null for non-existent key', () => {
    expect(cache.get('nonexistent')).toBeNull()
  })

  it('stores and retrieves values', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('reports correct size', () => {
    expect(cache.size()).toBe(0)
    cache.set('a', 'va')
    cache.set('b', 'vb')
    expect(cache.size()).toBe(2)
  })

  it('clears all entries', () => {
    cache.set('k1', 'v1')
    cache.set('k2', 'v2')
    cache.clear()
    expect(cache.size()).toBe(0)
    expect(cache.get('k1')).toBeNull()
  })

  it('evicts oldest entry when max entries exceeded', () => {
    // MAX_ENTRIES = 3 in mock
    cache.set('a', 'va')
    cache.set('b', 'vb')
    cache.set('c', 'vc')
    cache.set('d', 'vd') // triggers LRU eviction of 'a'
    expect(cache.get('a')).toBeNull()
    expect(cache.get('b')).toBe('vb')
    expect(cache.get('c')).toBe('vc')
    expect(cache.get('d')).toBe('vd')
  })

  it('returns null for expired entries', async () => {
    cache.set('temp', 'val')
    expect(cache.get('temp')).toBe('val')
    // Wait for TTL to expire (100ms)
    await new Promise((r) => setTimeout(r, 150))
    expect(cache.get('temp')).toBeNull()
  })

  it('overwrites existing key without growing size', () => {
    cache.set('key', 'v1')
    cache.set('key', 'v2')
    expect(cache.get('key')).toBe('v2')
    expect(cache.size()).toBe(1)
  })
})

describe('buildCacheKey', () => {
  it('produces the same key for same inputs', () => {
    const opts = {
      mode: 'conservative',
      temperature: 0.1,
      customPrompt: '',
      vocabPreset: 'none',
      appContext: null
    }
    const k1 = buildCacheKey('hello', opts)
    const k2 = buildCacheKey('hello', opts)
    expect(k1).toBe(k2)
  })

  it('produces different keys for different text', () => {
    const opts = { mode: 'conservative' }
    expect(buildCacheKey('a', opts)).not.toBe(buildCacheKey('b', opts))
  })

  it('produces different keys for different options', () => {
    const text = 'same text'
    expect(buildCacheKey(text, { mode: 'conservative' })).not.toBe(
      buildCacheKey(text, { mode: 'standard' })
    )
  })

  it('handles missing optional fields gracefully', () => {
    expect(() => buildCacheKey('text', {})).not.toThrow()
  })
})

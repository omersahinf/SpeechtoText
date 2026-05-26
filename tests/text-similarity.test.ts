import { describe, expect, it } from 'vitest'
import {
  levenshtein,
  similarity,
  normalizedSimilarity,
  normalizeTurkish
} from '../src/main/util/text-similarity'

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('merhaba', 'merhaba')).toBe(0)
  })

  it('returns string length when other is empty', () => {
    expect(levenshtein('', 'merhaba')).toBe(7)
    expect(levenshtein('merhaba', '')).toBe(7)
  })

  it('computes simple substitution distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
  })
})

describe('similarity', () => {
  it('is 1 for identical strings', () => {
    expect(similarity('merhaba', 'merhaba')).toBe(1)
  })

  it('is 0 for fully disjoint same-length strings', () => {
    expect(similarity('abc', 'xyz')).toBe(0)
  })

  it('is between 0 and 1 for partial overlap', () => {
    const s = similarity('Merhaba dünya', 'Merhaba dünyam')
    expect(s).toBeGreaterThan(0.8)
    expect(s).toBeLessThan(1)
  })
})

describe('normalizeTurkish', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeTurkish('  MERHABA   güzel  ')).toBe('merhaba güzel')
  })
})

describe('normalizedSimilarity', () => {
  it('treats case+whitespace differences as identical', () => {
    expect(normalizedSimilarity('Merhaba Dünya', 'merhaba   dünya')).toBe(1)
  })
})

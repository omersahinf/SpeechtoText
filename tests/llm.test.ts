import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CLEAN_TRANSCRIPT_SYSTEM_PROMPT,
  cleanTranscript,
  createCleanTranscriptMessages,
  estimateMaxTokens,
  isCleanTranscriptOutputSafe
} from '../src/main/llm'

describe('llm transcript cleaning prompt', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the Turkish conservative constraints explicit', () => {
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('Anlamı DEĞİŞTİRME')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('Kod-switching')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('Sadece temizlenmiş metin')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('CEVAP VERME')
  })

  it('builds messages with the raw transcript as user content', () => {
    const messages = createCleanTranscriptMessages('şey ee bugün toplantıya gittim yaa')

    expect(messages).toHaveLength(2)
    expect(messages[0]?.role).toBe('system')
    expect(messages[1]).toEqual({
      role: 'user',
      content: 'şey ee bugün toplantıya gittim yaa'
    })
  })

  it('uses phonetic Turkish spelling in Turkish-only mode', () => {
    const messages = createCleanTranscriptMessages('writing deadline meeting', {
      languageMode: 'tr'
    })
    const systemContent = messages[0]?.content as string

    expect(systemContent).toContain('İngilizce spelling')
    expect(systemContent).toContain('"writing" -> "rayting"')
    expect(systemContent).toContain('"deadline" -> "dedlayn"')
    expect(systemContent).not.toContain("Kod-switching'i koru")
  })

  it('preserves English spelling in Turkish-English mode', () => {
    const messages = createCleanTranscriptMessages('writing deadline meeting', {
      languageMode: 'tr-en'
    })
    const systemContent = messages[0]?.content as string

    expect(systemContent).toContain("Kod-switching'i koru")
    expect(systemContent).toContain('İngilizce teknik/iş kelimelerini')
  })

  it('bounds max tokens for short and long inputs', () => {
    expect(estimateMaxTokens('kısa')).toBe(64)
    // 2000 kelimelik girdi 4096 üst sınırına vurmalı
    const longText = Array.from({ length: 2000 }, () => 'kelime').join(' ')
    expect(estimateMaxTokens(longText)).toBe(4096)
  })

  it('accepts cleanup output that stays anchored to the transcript', () => {
    expect(
      isCleanTranscriptOutputSafe(
        'şey ee bugün toplantıya gittim yaa',
        'Şey bugün toplantıya gittim.'
      )
    ).toBe(true)
  })

  it('rejects answer-like output that expands beyond the transcript', () => {
    expect(
      isCleanTranscriptOutputSafe(
        'fetch nasıl kullanılır',
        'Fetch, JavaScript içinde HTTP isteği yapmak için kullanılır.'
      )
    ).toBe(false)
  })

  it('falls back to raw transcript when cleanup output is unsafe', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: {
            content: 'Fetch, JavaScript içinde HTTP isteği yapmak için kullanılır.'
          }
        })
      })
    )

    const result = await cleanTranscript('fetch nasıl kullanılır', {
      useCache: false
    })

    expect(result.text).toBe('fetch nasıl kullanılır')
    expect(result.fallback).toBe(true)
  })
})

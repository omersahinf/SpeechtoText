import { describe, expect, it } from 'vitest'
import {
  CLEAN_TRANSCRIPT_SYSTEM_PROMPT,
  createCleanTranscriptMessages,
  estimateMaxTokens
} from '../src/main/llm'

describe('llm transcript cleaning prompt', () => {
  it('keeps the Turkish conservative constraints explicit', () => {
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('Anlamı DEĞİŞTİRME')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('Kod-switching')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('Sadece temizlenmiş metin')
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

  it('bounds max tokens for short and long inputs', () => {
    expect(estimateMaxTokens('kısa')).toBe(64)
    // 2000 kelimelik girdi 4096 üst sınırına vurmalı
    const longText = Array.from({ length: 2000 }, () => 'kelime').join(' ')
    expect(estimateMaxTokens(longText)).toBe(4096)
  })
})

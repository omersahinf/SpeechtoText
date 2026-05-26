import { describe, it, expect } from 'vitest'
import { detectVoiceCommand, applyVoicePunctuation } from '../src/main/voice-commands'

describe('detectVoiceCommand', () => {
  it('detects Turkish cancel commands', () => {
    expect(detectVoiceCommand('dur').type).toBe('cancel')
    expect(detectVoiceCommand('iptal').type).toBe('cancel')
    expect(detectVoiceCommand('hayır').type).toBe('cancel')
    expect(detectVoiceCommand('İptal').type).toBe('cancel')
  })

  it('detects English cancel commands', () => {
    expect(detectVoiceCommand('cancel').type).toBe('cancel')
    expect(detectVoiceCommand('stop').type).toBe('cancel')
  })

  it('detects Turkish undo commands', () => {
    expect(detectVoiceCommand('geri al').type).toBe('undo')
    expect(detectVoiceCommand('sil bunu').type).toBe('undo')
  })

  it('detects repeat commands', () => {
    expect(detectVoiceCommand('tekrar').type).toBe('repeat')
    expect(detectVoiceCommand('repeat').type).toBe('repeat')
  })

  it('returns none for normal text', () => {
    expect(detectVoiceCommand('merhaba dünya').type).toBe('none')
    expect(detectVoiceCommand('bugün toplantı var').type).toBe('none')
    expect(detectVoiceCommand('').type).toBe('none')
  })

  it('returns none for partial matches embedded in words', () => {
    // "dur" should not match inside a longer word
    // regex uses word boundaries so "duraklama" should be none
    expect(detectVoiceCommand('duraklama').type).toBe('none')
  })
})

describe('applyVoicePunctuation', () => {
  it('replaces virgül with comma', () => {
    expect(applyVoicePunctuation('merhaba virgül nasılsın')).toBe('merhaba , nasılsın')
  })

  it('replaces nokta with period', () => {
    expect(applyVoicePunctuation('tamam nokta')).toBe('tamam .')
  })

  it('replaces soru işareti with question mark', () => {
    expect(applyVoicePunctuation('nasıl soru işareti')).toBe('nasıl ?')
  })

  it('replaces yeni satır with newline', () => {
    expect(applyVoicePunctuation('birinci yeni satır ikinci')).toBe('birinci \n ikinci')
  })

  it('replaces parantez commands', () => {
    expect(applyVoicePunctuation('parantez aç merhaba parantez kapat')).toBe('( merhaba )')
  })

  it('handles büyük harf command', () => {
    const result = applyVoicePunctuation('büyük harf merhaba')
    expect(result).toMatch(/^M/)
  })

  it('leaves normal text unchanged', () => {
    expect(applyVoicePunctuation('merhaba dünya')).toBe('merhaba dünya')
  })
})

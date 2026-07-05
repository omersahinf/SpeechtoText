import { describe, expect, it } from 'vitest'
import { applyTurkishPhoneticWriting } from '../src/main/util/tr-phonetic'

describe('applyTurkishPhoneticWriting', () => {
  it('rewrites common English spellings to Turkish phonetic writing', () => {
    expect(applyTurkishPhoneticWriting("Writing I think deadline'a yetişmeli.")).toBe(
      'rayting ay tink dedlayna yetişmeli.'
    )
  })

  it('handles ASR variants and apostrophe suffixes', () => {
    expect(applyTurkishPhoneticWriting("Wright'ink deadline'ı meeting'e kaldı.")).toBe(
      'rayting dedlaynı mitinge kaldı.'
    )
  })
})

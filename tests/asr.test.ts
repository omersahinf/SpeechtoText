import { describe, expect, it } from 'vitest'

describe('asr client', () => {
  it('keeps integration tests opt-in', () => {
    expect(process.env.RUN_ASR_INTEGRATION).not.toBe('1')
  })
})

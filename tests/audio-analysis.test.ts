import { describe, expect, it } from 'vitest'
import {
  analyzePcm16Wav,
  isLikelySilenceHallucination,
  shouldSkipTranscriptionForAudio
} from '../src/main/audio-analysis'

function makeWav(samples: Int16Array, sampleRate = 16000): Buffer {
  const bytesPerSample = 2
  const blockAlign = bytesPerSample
  const buffer = Buffer.alloc(44 + samples.length * bytesPerSample)

  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(36 + samples.length * bytesPerSample, 4)
  buffer.write('WAVE', 8, 'ascii')
  buffer.write('fmt ', 12, 'ascii')
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * blockAlign, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36, 'ascii')
  buffer.writeUInt32LE(samples.length * bytesPerSample, 40)

  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(samples[i] ?? 0, 44 + i * bytesPerSample)
  }

  return buffer
}

describe('audio analysis', () => {
  it('skips header-only recordings', () => {
    const stats = analyzePcm16Wav(makeWav(new Int16Array()))

    expect(stats?.sampleCount).toBe(0)
    expect(shouldSkipTranscriptionForAudio(stats)).toBe(true)
  })

  it('skips long silent recordings', () => {
    const stats = analyzePcm16Wav(makeWav(new Int16Array(16000)))

    expect(stats?.durationMs).toBe(1000)
    expect(stats?.rms).toBe(0)
    expect(shouldSkipTranscriptionForAudio(stats)).toBe(true)
  })

  it('allows recordings with speech-like energy', () => {
    const samples = new Int16Array(16000)

    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = i % 2 === 0 ? 2000 : -2000
    }

    const stats = analyzePcm16Wav(makeWav(samples))

    expect(stats?.durationMs).toBe(1000)
    expect(stats?.rms).toBeGreaterThan(0.003)
    expect(shouldSkipTranscriptionForAudio(stats)).toBe(false)
  })

  it('detects the common silence hallucination', () => {
    expect(isLikelySilenceHallucination('Altyazı M.K.')).toBe(true)
    expect(isLikelySilenceHallucination('Altyazılar')).toBe(true)
    expect(isLikelySilenceHallucination('Abone olmayı unutmayın.')).toBe(true)
    expect(isLikelySilenceHallucination('Yorumlarınızı bekliyorum')).toBe(true)
    expect(isLikelySilenceHallucination('Merhaba M.K.')).toBe(false)
  })
})

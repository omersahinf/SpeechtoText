import { describe, expect, it } from 'vitest'
import {
  TARGET_SAMPLE_RATE,
  calculateRms,
  downsampleBuffer,
  encodeWav,
  mergeChunks
} from '../src/renderer/audio/wav'

describe('mergeChunks', () => {
  it('returns an empty buffer when called with no chunks', () => {
    const merged = mergeChunks([])
    expect(merged.length).toBe(0)
  })

  it('concatenates chunks in order', () => {
    const merged = mergeChunks([Float32Array.from([1, 2]), Float32Array.from([3, 4, 5])])
    expect(Array.from(merged)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('downsampleBuffer', () => {
  it('returns the same buffer when sample rate matches target', () => {
    const buf = Float32Array.from([0.1, 0.2, 0.3])
    expect(downsampleBuffer(buf, TARGET_SAMPLE_RATE)).toBe(buf)
  })

  it('throws if source sample rate is lower than target', () => {
    expect(() => downsampleBuffer(Float32Array.from([0]), TARGET_SAMPLE_RATE / 2)).toThrow()
  })

  it('halves length when source is 2x the target rate', () => {
    const buf = new Float32Array(1000).fill(0.5)
    const out = downsampleBuffer(buf, TARGET_SAMPLE_RATE * 2)
    expect(out.length).toBe(500)
    expect(out[0]).toBeCloseTo(0.5)
  })
})

describe('encodeWav', () => {
  it('produces a valid 44-byte WAV header', () => {
    const buf = encodeWav(new Float32Array())
    const view = new DataView(buf)
    expect(buf.byteLength).toBe(44)
    expect(
      String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
    ).toBe('RIFF')
    expect(
      String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
    ).toBe('WAVE')
  })

  it('clamps out-of-range samples', () => {
    const buf = encodeWav(Float32Array.from([1.5, -1.5]))
    const view = new DataView(buf)
    expect(view.getInt16(44, true)).toBe(0x7fff)
    expect(view.getInt16(46, true)).toBe(-0x8000)
  })
})

describe('calculateRms', () => {
  it('returns 0 for silent buffer', () => {
    expect(calculateRms(new Float32Array(100))).toBe(0)
  })

  it('returns 1 for full-scale alternating buffer', () => {
    const buf = Float32Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? 1 : -1))
    expect(calculateRms(buf)).toBeCloseTo(1, 5)
  })

  it('does not divide by zero for an empty buffer', () => {
    expect(calculateRms(new Float32Array())).toBe(0)
  })
})

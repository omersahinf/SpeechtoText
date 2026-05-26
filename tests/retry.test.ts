import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Logger'ı sessizleştir
vi.mock('../src/main/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { withRetry, withTimeout, defaultShouldRetry, getErrorStatus } from '../src/main/util/retry'

describe('getErrorStatus', () => {
  it('returns the numeric status field on an error object', () => {
    expect(getErrorStatus({ status: 429 })).toBe(429)
  })

  it('returns undefined for plain errors', () => {
    expect(getErrorStatus(new Error('x'))).toBeUndefined()
    expect(getErrorStatus(null)).toBeUndefined()
    expect(getErrorStatus({ status: 'oops' })).toBeUndefined()
  })
})

describe('defaultShouldRetry', () => {
  it('retries network/unknown errors', () => {
    expect(defaultShouldRetry(new Error('boom'))).toBe(true)
  })

  it('retries 5xx', () => {
    expect(defaultShouldRetry({ status: 500 })).toBe(true)
    expect(defaultShouldRetry({ status: 503 })).toBe(true)
  })

  it('retries 429', () => {
    expect(defaultShouldRetry({ status: 429 })).toBe(true)
  })

  it('does not retry 4xx (except 429)', () => {
    expect(defaultShouldRetry({ status: 400 })).toBe(false)
    expect(defaultShouldRetry({ status: 401 })).toBe(false)
    expect(defaultShouldRetry({ status: 403 })).toBe(false)
    expect(defaultShouldRetry({ status: 422 })).toBe(false)
  })
})

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10, jitter: false })

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries transient failures and eventually succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('5xx'), { status: 502 }))
      .mockRejectedValueOnce(Object.assign(new Error('5xx'), { status: 503 }))
      .mockResolvedValue('ok')

    const promise = withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      jitter: false,
      maxDelayMs: 100
    })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry on 4xx', async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('bad'), { status: 401 }))

    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 1, jitter: false })
    ).rejects.toMatchObject({ status: 401 })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('respects maxAttempts and rethrows last error', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'))

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 1, jitter: false }).catch(
      (error) => error
    )
    await vi.runAllTimersAsync()
    const error = await promise

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('boom')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('honors custom shouldRetry', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('nope'))
    const shouldRetry = vi.fn().mockReturnValue(false)

    await expect(
      withRetry(fn, { maxAttempts: 5, shouldRetry, baseDelayMs: 1, jitter: false })
    ).rejects.toThrow('nope')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(shouldRetry).toHaveBeenCalledTimes(1)
  })
})

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves when the inner promise resolves in time', async () => {
    const promise = withTimeout(Promise.resolve('ok'), 100, 'test')
    await expect(promise).resolves.toBe('ok')
  })

  it('rejects after the timeout', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 1_000))
    const promise = withTimeout(slow, 50, 'slow-op')

    vi.advanceTimersByTime(60)
    await expect(promise).rejects.toThrow(/timed out after 50ms/)
  })
})

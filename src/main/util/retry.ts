import { logger } from '../logger'

export interface RetryOptions {
  /** Maksimum deneme sayısı (ilk deneme dahil). Varsayılan: 3 */
  maxAttempts?: number
  /** İlk retry'dan önce beklenen base gecikme (ms). Varsayılan: 500 */
  baseDelayMs?: number
  /** Üst sınır gecikme (ms). Varsayılan: 5000 */
  maxDelayMs?: number
  /** Hatadan jitter eklenip eklenmeyeceği. Varsayılan: true */
  jitter?: boolean
  /** Etiket; loglarda görünür. */
  label?: string
  /** Hata retry edilmeli mi? false döndürürsen retry edilmez. Varsayılan: 4xx skip, diğerleri retry */
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return undefined
  }

  const status = (error as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

/** Varsayılan retry kararı: 4xx skip (auth/format hataları), diğerleri retry. 429 retry edilir. */
export function defaultShouldRetry(error: unknown): boolean {
  const status = getErrorStatus(error)
  if (status === undefined) {
    return true
  }

  if (status === 429) {
    return true
  }

  return !(status >= 400 && status < 500)
}

function computeDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: boolean
): number {
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1))
  if (!jitter) {
    return exponential
  }

  const jitterAmount = exponential * 0.25
  return Math.round(exponential - jitterAmount + Math.random() * jitterAmount * 2)
}

/**
 * Bir async fonksiyonu exponential backoff + jitter ile retry eder.
 * 4xx hataları (auth/format) varsayılan olarak retry edilmez.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3
  const baseDelayMs = options.baseDelayMs ?? 500
  const maxDelayMs = options.maxDelayMs ?? 5000
  const jitter = options.jitter ?? true
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry
  const label = options.label ?? 'retry'

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
        throw error
      }

      const delay = computeDelay(attempt, baseDelayMs, maxDelayMs, jitter)
      const status = getErrorStatus(error)
      logger.warn(
        `[${label}] attempt ${attempt}/${maxAttempts} failed (status=${status ?? 'n/a'}); retrying in ${delay}ms`
      )
      await sleep(delay)
    }
  }

  throw lastError
}

/** Bir promise'i belirli bir süre sonra timeout ile reddeder. */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label = 'operation'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[${label}] timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

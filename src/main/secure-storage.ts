import { safeStorage } from 'electron'
import { logger } from './logger'

const PREFIX = 'safe:'

export class SecureStorageUnavailableError extends Error {
  constructor() {
    super('Electron safeStorage encryption is not available on this system')
    this.name = 'SecureStorageUnavailableError'
  }
}

export class SecureStorageDecryptError extends Error {
  constructor(cause?: unknown) {
    super('Encrypted value could not be decrypted — keychain may have changed')
    this.name = 'SecureStorageDecryptError'
    if (cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = cause
    }
  }
}

export function isEncryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable()
  } catch (error) {
    logger.error('[secure-storage] isEncryptionAvailable threw', error)
    return false
  }
}

export function encryptString(value: string): string {
  if (!value) {
    return ''
  }

  if (!isEncryptionAvailable()) {
    throw new SecureStorageUnavailableError()
  }

  return `${PREFIX}${safeStorage.encryptString(value).toString('base64')}`
}

/**
 * Şifrelenmiş değeri çözer.
 *  - Boş ise '' döner
 *  - Prefix yoksa eski/plain değer kabul edilir (migration kolaylığı için)
 *  - safeStorage yoksa loglar ve '' döner
 *  - Decrypt çöker ise loglar ve SecureStorageDecryptError fırlatır
 */
export function decryptString(value: string | undefined): string {
  if (!value) {
    return ''
  }

  if (!value.startsWith(PREFIX)) {
    // Plain (legacy) değer — kullan ve devam et.
    return value
  }

  if (!isEncryptionAvailable()) {
    logger.warn('[secure-storage] decrypt skipped — encryption unavailable')
    return ''
  }

  try {
    return safeStorage.decryptString(Buffer.from(value.slice(PREFIX.length), 'base64'))
  } catch (error) {
    logger.error('[secure-storage] decrypt failed', error)
    throw new SecureStorageDecryptError(error)
  }
}

/** Decrypt fail durumunda fallback değeri döner (UI gösterimi için kullanışlı). */
export function tryDecryptString(value: string | undefined, fallback = ''): string {
  try {
    return decryptString(value)
  } catch {
    return fallback
  }
}

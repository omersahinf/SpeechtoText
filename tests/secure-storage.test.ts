import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockSafeStorage = {
  isEncryptionAvailable: vi.fn(),
  encryptString: vi.fn(),
  decryptString: vi.fn()
}

vi.mock('electron', () => ({
  safeStorage: mockSafeStorage
}))

vi.mock('../src/main/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('secure-storage', () => {
  it('returns empty for empty inputs', async () => {
    const { encryptString, decryptString } = await import('../src/main/secure-storage')
    expect(encryptString('')).toBe('')
    expect(decryptString('')).toBe('')
    expect(decryptString(undefined)).toBe('')
  })

  it('encrypts and prefixes with safe:', async () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true)
    mockSafeStorage.encryptString.mockReturnValue(Buffer.from('cipher'))

    const { encryptString } = await import('../src/main/secure-storage')
    const out = encryptString('hello')

    expect(out.startsWith('safe:')).toBe(true)
    expect(mockSafeStorage.encryptString).toHaveBeenCalledWith('hello')
  })

  it('throws SecureStorageUnavailableError when encryption is unavailable', async () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(false)
    const { encryptString, SecureStorageUnavailableError } =
      await import('../src/main/secure-storage')

    expect(() => encryptString('x')).toThrow(SecureStorageUnavailableError)
  })

  it('returns plain value when no safe: prefix (legacy migration)', async () => {
    const { decryptString } = await import('../src/main/secure-storage')
    expect(decryptString('plain-value')).toBe('plain-value')
  })

  it('throws SecureStorageDecryptError when safeStorage.decryptString throws', async () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true)
    mockSafeStorage.decryptString.mockImplementation(() => {
      throw new Error('keychain changed')
    })

    const { decryptString, SecureStorageDecryptError } = await import('../src/main/secure-storage')
    expect(() => decryptString('safe:ZmFrZQ==')).toThrow(SecureStorageDecryptError)
  })

  it('tryDecryptString returns fallback on decrypt failure', async () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true)
    mockSafeStorage.decryptString.mockImplementation(() => {
      throw new Error('bad key')
    })

    const { tryDecryptString } = await import('../src/main/secure-storage')
    expect(tryDecryptString('safe:ZmFrZQ==', 'fallback')).toBe('fallback')
  })

  it('decrypts a stored value', async () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true)
    mockSafeStorage.decryptString.mockReturnValue('plaintext')

    const { decryptString } = await import('../src/main/secure-storage')
    expect(decryptString('safe:ZmFrZQ==')).toBe('plaintext')
  })
})

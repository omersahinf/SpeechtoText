import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockSafeStorage = {
  isEncryptionAvailable: vi.fn().mockReturnValue(true),
  encryptString: vi.fn((value: string) => Buffer.from(`enc(${value})`)),
  decryptString: vi.fn((buffer: Buffer) => buffer.toString('utf8').replace(/^enc\((.*)\)$/, '$1'))
}

vi.mock('electron', () => ({
  safeStorage: mockSafeStorage
}))

vi.mock('../src/main/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

// electron-store yerine memory-backed sahte
class FakeStore<T extends Record<string, unknown>> {
  store: T
  constructor(options: { defaults: T }) {
    this.store = { ...options.defaults }
  }
}

vi.mock('electron-store', () => ({
  default: FakeStore
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSafeStorage.isEncryptionAvailable.mockReturnValue(true)
  delete process.env.GROQ_API_KEY
  delete process.env.DASHSCOPE_API_KEY
})

describe('settings store', () => {
  it('returns defaults on first read', async () => {
    const { createSettingsStore } = await import('../src/main/store')
    const store = createSettingsStore()
    const s = store.getSettings()

    expect(s.hotkeyMode).toBe('push-to-talk')
    expect(s.llmEnabled).toBe(true)
    expect(s.transformMode).toBe('polish')
    expect(s.groqApiKey).toBe('')
  })

  it('persists encrypted API keys', async () => {
    const { createSettingsStore } = await import('../src/main/store')
    const store = createSettingsStore()

    store.updateSettings({ groqApiKey: 'mykey' })
    const after = store.getSettings()

    expect(mockSafeStorage.encryptString).toHaveBeenCalledWith('mykey')
    expect(after.groqApiKey).toBe('mykey')
  })

  it('falls back to env vars when no stored key', async () => {
    process.env.GROQ_API_KEY = 'env-key'

    const { createSettingsStore } = await import('../src/main/store')
    const store = createSettingsStore()
    const s = store.getSettings()

    expect(s.groqApiKey).toBe('env-key')
  })

  it('rejects invalid temperature via schema', async () => {
    const { createSettingsStore } = await import('../src/main/store')
    const store = createSettingsStore()

    expect(() => store.updateSettings({ llmTemperature: 1.5 })).toThrow()
  })

  it('clears API key when set to empty string', async () => {
    const { createSettingsStore } = await import('../src/main/store')
    const store = createSettingsStore()

    store.updateSettings({ groqApiKey: 'first' })
    store.updateSettings({ groqApiKey: '' })

    const s = store.getSettings()
    expect(s.groqApiKey).toBe('')
  })

  it('applyToProcessEnv writes keys to env', async () => {
    const { createSettingsStore } = await import('../src/main/store')
    const store = createSettingsStore()

    store.updateSettings({ groqApiKey: 'gk', dashscopeApiKey: 'dk' })
    store.applyToProcessEnv()

    expect(process.env.GROQ_API_KEY).toBe('gk')
    expect(process.env.DASHSCOPE_API_KEY).toBe('dk')
  })
})

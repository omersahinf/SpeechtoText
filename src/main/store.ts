import ElectronStoreImport from 'electron-store'
import type ElectronStoreDefault from 'electron-store'
import { z } from 'zod'
import type { AppSettings, AppSettingsUpdate } from '@/shared/types'
import { encryptString, isEncryptionAvailable, tryDecryptString } from './secure-storage'
import { logger } from './logger'

const DEFAULT_DASHSCOPE_BASE_URL =
  process.env.DASHSCOPE_BASE_URL ?? 'https://coding-intl.dashscope.aliyuncs.com/v1'
const DEFAULT_DASHSCOPE_MODEL = process.env.DASHSCOPE_MODEL ?? 'qwen3.6-plus'
const DEFAULT_HOTKEY_KEY_CODE = 3640
const DEFAULT_LLM_TEMPERATURE = 0.1

const CURRENT_SCHEMA_VERSION = 4

const storedSettingsSchema = z.object({
  schemaVersion: z.number().int().min(1).default(CURRENT_SCHEMA_VERSION),
  groqApiKeyEncrypted: z.string().default(''),
  dashscopeApiKeyEncrypted: z.string().default(''),
  dashscopeBaseUrl: z.string().url().default(DEFAULT_DASHSCOPE_BASE_URL),
  dashscopeModel: z.string().min(1).default(DEFAULT_DASHSCOPE_MODEL),
  hotkeyKeyCode: z.number().int().positive().default(DEFAULT_HOTKEY_KEY_CODE),
  hotkeyMode: z.enum(['push-to-talk', 'toggle']).default('push-to-talk'),
  llmEnabled: z.boolean().default(true),
  llmMode: z.enum(['conservative', 'standard']).default('conservative'),
  llmTemperature: z.number().min(0).max(0.5).default(DEFAULT_LLM_TEMPERATURE),
  microphoneDeviceId: z.string().default(''),
  useClipboardInjection: z.boolean().default(true),
  onboardingCompleted: z.boolean().default(false),
  autoApply: z.boolean().default(true),
  transformMode: z.enum(['polish', 'raw']).default('polish'),
  overlayEnabled: z.boolean().default(true),
  customPrompt: z.string().default(''),
  vocabPreset: z.enum(['none', 'software', 'medical', 'legal']).default('none'),
  appContextEnabled: z.boolean().default(false),
  uiLanguage: z.enum(['tr', 'en']).default('tr'),
  llmCacheEnabled: z.boolean().default(true),
  activeProfileId: z.string().nullable().default(null),
  appearanceAccent: z.enum(['green', 'amber', 'indigo', 'red']).default('indigo'),
  appearanceMode: z.enum(['dark', 'light']).default('dark'),
  appearanceMetaphor: z.enum(['wave', 'orb', 'dot', 'blob']).default('wave'),
  appearanceFont: z.enum(['system', 'geist', 'serif']).default('system'),
  radiusScale: z.number().min(0.4).max(1.8).default(1)
})

type StoredSettings = z.infer<typeof storedSettingsSchema>

export interface SettingsStore {
  getSettings: () => AppSettings
  updateSettings: (settings: AppSettingsUpdate) => AppSettings
  applyToProcessEnv: () => void
}

type MigrationFn = (raw: Record<string, unknown>) => Record<string, unknown>

const MIGRATIONS: Record<number, MigrationFn> = {
  2: (raw) => raw,
  3: (raw) => ({
    ...raw,
    appearanceAccent:
      raw.appearanceAccent === undefined || raw.appearanceAccent === 'green'
        ? 'amber'
        : raw.appearanceAccent
  }),
  4: (raw) => ({
    ...raw,
    appearanceAccent:
      raw.appearanceAccent === undefined ||
      raw.appearanceAccent === 'green' ||
      raw.appearanceAccent === 'amber'
        ? 'indigo'
        : raw.appearanceAccent
  })
}

function migrateStored(raw: Record<string, unknown>): Record<string, unknown> {
  let current = { ...raw }
  let version = typeof current.schemaVersion === 'number' ? current.schemaVersion : 0

  while (version < CURRENT_SCHEMA_VERSION) {
    const next = version + 1
    const fn = MIGRATIONS[next]
    current = fn ? fn(current) : current
    version = next
    current.schemaVersion = version
    logger.info(`[store] migrated settings to v${version}`)
  }

  return current
}

function normalizeStoredSettings(value: unknown): StoredSettings {
  const migrated = migrateStored((value ?? {}) as Record<string, unknown>)
  return storedSettingsSchema.parse(migrated)
}

function toPublicSettings(stored: StoredSettings): AppSettings {
  return {
    groqApiKey: tryDecryptString(stored.groqApiKeyEncrypted) || process.env.GROQ_API_KEY || '',
    dashscopeApiKey:
      tryDecryptString(stored.dashscopeApiKeyEncrypted) || process.env.DASHSCOPE_API_KEY || '',
    dashscopeBaseUrl: stored.dashscopeBaseUrl,
    dashscopeModel: stored.dashscopeModel,
    hotkeyKeyCode: stored.hotkeyKeyCode,
    hotkeyMode: stored.hotkeyMode,
    llmEnabled: stored.llmEnabled,
    llmMode: stored.llmMode,
    llmTemperature: stored.llmTemperature,
    microphoneDeviceId: stored.microphoneDeviceId,
    useClipboardInjection: stored.useClipboardInjection,
    onboardingCompleted: stored.onboardingCompleted,
    autoApply: stored.autoApply,
    transformMode: stored.transformMode,
    overlayEnabled: stored.overlayEnabled,
    customPrompt: stored.customPrompt,
    vocabPreset: stored.vocabPreset,
    appContextEnabled: stored.appContextEnabled,
    uiLanguage: stored.uiLanguage,
    llmCacheEnabled: stored.llmCacheEnabled,
    activeProfileId: stored.activeProfileId,
    appearanceAccent: stored.appearanceAccent,
    appearanceMode: stored.appearanceMode,
    appearanceMetaphor: stored.appearanceMetaphor,
    appearanceFont: stored.appearanceFont,
    radiusScale: stored.radiusScale
  }
}

function toStoredUpdate(settings: AppSettingsUpdate): Partial<StoredSettings> {
  const update: Partial<StoredSettings> = {}

  if (settings.groqApiKey !== undefined) {
    update.groqApiKeyEncrypted = settings.groqApiKey ? encryptString(settings.groqApiKey) : ''
  }

  if (settings.dashscopeApiKey !== undefined) {
    update.dashscopeApiKeyEncrypted = settings.dashscopeApiKey
      ? encryptString(settings.dashscopeApiKey)
      : ''
  }

  if (settings.dashscopeBaseUrl !== undefined) {
    update.dashscopeBaseUrl = settings.dashscopeBaseUrl
  }

  if (settings.dashscopeModel !== undefined) {
    update.dashscopeModel = settings.dashscopeModel
  }

  if (settings.hotkeyKeyCode !== undefined) {
    update.hotkeyKeyCode = settings.hotkeyKeyCode
  }

  if (settings.hotkeyMode !== undefined) {
    update.hotkeyMode = settings.hotkeyMode
  }

  if (settings.llmEnabled !== undefined) {
    update.llmEnabled = settings.llmEnabled
  }

  if (settings.llmMode !== undefined) {
    update.llmMode = settings.llmMode
  }

  if (settings.llmTemperature !== undefined) {
    update.llmTemperature = settings.llmTemperature
  }

  if (settings.microphoneDeviceId !== undefined) {
    update.microphoneDeviceId = settings.microphoneDeviceId
  }

  if (settings.useClipboardInjection !== undefined) {
    update.useClipboardInjection = settings.useClipboardInjection
  }

  if (settings.onboardingCompleted !== undefined) {
    update.onboardingCompleted = settings.onboardingCompleted
  }

  if (settings.autoApply !== undefined) {
    update.autoApply = settings.autoApply
  }

  if (settings.transformMode !== undefined) {
    update.transformMode = settings.transformMode
  }

  if (settings.overlayEnabled !== undefined) {
    update.overlayEnabled = settings.overlayEnabled
  }

  if (settings.customPrompt !== undefined) {
    update.customPrompt = settings.customPrompt
  }

  if (settings.vocabPreset !== undefined) {
    update.vocabPreset = settings.vocabPreset
  }

  if (settings.appContextEnabled !== undefined) {
    update.appContextEnabled = settings.appContextEnabled
  }

  if (settings.uiLanguage !== undefined) {
    update.uiLanguage = settings.uiLanguage
  }

  if (settings.llmCacheEnabled !== undefined) {
    update.llmCacheEnabled = settings.llmCacheEnabled
  }

  if (settings.activeProfileId !== undefined) {
    update.activeProfileId = settings.activeProfileId
  }

  if (settings.appearanceAccent !== undefined) {
    update.appearanceAccent = settings.appearanceAccent
  }

  if (settings.appearanceMode !== undefined) {
    update.appearanceMode = settings.appearanceMode
  }

  if (settings.appearanceMetaphor !== undefined) {
    update.appearanceMetaphor = settings.appearanceMetaphor
  }

  if (settings.appearanceFont !== undefined) {
    update.appearanceFont = settings.appearanceFont
  }

  if (settings.radiusScale !== undefined) {
    update.radiusScale = settings.radiusScale
  }

  return update
}

export function createSettingsStore(): SettingsStore {
  const StoreConstructor =
    (ElectronStoreImport as unknown as { default?: typeof ElectronStoreDefault }).default ??
    (ElectronStoreImport as unknown as typeof ElectronStoreDefault)
  const store = new StoreConstructor<StoredSettings>({
    name: 'settings',
    defaults: normalizeStoredSettings({})
  })

  const readStored = (): StoredSettings => {
    const stored = normalizeStoredSettings(store.store)
    store.store = stored
    return stored
  }

  const getSettings = (): AppSettings => toPublicSettings(readStored())

  const applyToProcessEnv = (): void => {
    const stored = readStored()

    // Sadece store'da gerçek bir değer varsa env'i ezelim; aksi halde
    // kullanıcı UI'dan key sildiğinde eski env değeri geri kazanılmasın.
    const groqDecrypted = tryDecryptString(stored.groqApiKeyEncrypted)
    if (groqDecrypted) {
      process.env.GROQ_API_KEY = groqDecrypted
    } else if (stored.groqApiKeyEncrypted === '') {
      delete process.env.GROQ_API_KEY
    }

    const dashscopeDecrypted = tryDecryptString(stored.dashscopeApiKeyEncrypted)
    if (dashscopeDecrypted) {
      process.env.DASHSCOPE_API_KEY = dashscopeDecrypted
    } else if (stored.dashscopeApiKeyEncrypted === '') {
      delete process.env.DASHSCOPE_API_KEY
    }

    process.env.DASHSCOPE_BASE_URL = stored.dashscopeBaseUrl
    process.env.DASHSCOPE_MODEL = stored.dashscopeModel
  }

  if (!isEncryptionAvailable()) {
    logger.warn(
      '[store] safeStorage encryption is NOT available — API keys will not be persisted securely'
    )
  }

  logger.info('[store] settings store initialized')

  return {
    getSettings,
    updateSettings(settings: AppSettingsUpdate): AppSettings {
      const nextStored = normalizeStoredSettings({
        ...readStored(),
        ...toStoredUpdate(settings)
      })
      store.store = nextStored
      applyToProcessEnv()
      logger.info('[store] settings updated')
      return toPublicSettings(nextStored)
    },
    applyToProcessEnv
  }
}

import ElectronStoreImport from 'electron-store'
import type ElectronStoreDefault from 'electron-store'
import { z } from 'zod'
import type { AppSettings, AppSettingsUpdate } from '@/shared/types'
import {
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
  LEGACY_DASHSCOPE_BASE_URL
} from '@/shared/constants'
import { encryptString, isEncryptionAvailable, tryDecryptString } from './secure-storage'
import { logger } from './logger'

const DEFAULT_STORED_OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL
const DEFAULT_STORED_OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL
const DEFAULT_DICTATION_LANGUAGE_MODE = 'tr-en'
const DEFAULT_HOTKEY_KEY_CODE = 3640
const DEFAULT_LLM_TEMPERATURE = 0.1
const DEFAULT_TRANSFORM_MODE = 'raw'

const CURRENT_SCHEMA_VERSION = 9

const storedSettingsSchema = z.object({
  schemaVersion: z.number().int().min(1).default(CURRENT_SCHEMA_VERSION),
  groqApiKeyEncrypted: z.string().default(''),
  ollamaBaseUrl: z.string().url().default(DEFAULT_STORED_OLLAMA_BASE_URL),
  ollamaModel: z.string().min(1).default(DEFAULT_STORED_OLLAMA_MODEL),
  dictationLanguageMode: z.enum(['tr', 'tr-en']).default(DEFAULT_DICTATION_LANGUAGE_MODE),
  hotkeyKeyCode: z.number().int().positive().default(DEFAULT_HOTKEY_KEY_CODE),
  hotkeyMode: z.enum(['push-to-talk', 'toggle']).default('push-to-talk'),
  llmEnabled: z.boolean().default(true),
  llmMode: z.enum(['conservative', 'standard']).default('conservative'),
  llmTemperature: z.number().min(0).max(0.5).default(DEFAULT_LLM_TEMPERATURE),
  microphoneDeviceId: z.string().default(''),
  useClipboardInjection: z.boolean().default(true),
  onboardingCompleted: z.boolean().default(false),
  autoApply: z.boolean().default(true),
  transformMode: z.enum(['polish', 'raw']).default(DEFAULT_TRANSFORM_MODE),
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
  }),
  5: (raw) => ({
    ...raw,
    dashscopeModel: raw.dashscopeModel ?? DEFAULT_OLLAMA_MODEL
  }),
  6: (raw) => ({
    ...raw,
    dictationLanguageMode: raw.dictationLanguageMode ?? DEFAULT_DICTATION_LANGUAGE_MODE
  }),
  7: (raw) => ({
    ...raw,
    dashscopeBaseUrl:
      raw.dashscopeBaseUrl === undefined || raw.dashscopeBaseUrl === LEGACY_DASHSCOPE_BASE_URL
        ? DEFAULT_OLLAMA_BASE_URL
        : raw.dashscopeBaseUrl
  }),
  8: (raw) => ({
    ...raw,
    ollamaBaseUrl:
      typeof raw.ollamaBaseUrl === 'string' ? raw.ollamaBaseUrl : DEFAULT_STORED_OLLAMA_BASE_URL,
    ollamaModel:
      typeof raw.ollamaModel === 'string' && raw.ollamaModel.startsWith('gemma')
        ? raw.ollamaModel
        : DEFAULT_STORED_OLLAMA_MODEL
  }),
  9: (raw) => ({
    ...raw,
    transformMode: DEFAULT_TRANSFORM_MODE
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
    ollamaBaseUrl: stored.ollamaBaseUrl,
    ollamaModel: stored.ollamaModel,
    dictationLanguageMode: stored.dictationLanguageMode,
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

  if (settings.ollamaBaseUrl !== undefined) {
    update.ollamaBaseUrl = settings.ollamaBaseUrl
  }

  if (settings.ollamaModel !== undefined) {
    update.ollamaModel = settings.ollamaModel
  }

  if (settings.dictationLanguageMode !== undefined) {
    update.dictationLanguageMode = settings.dictationLanguageMode
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

    process.env.OLLAMA_BASE_URL = stored.ollamaBaseUrl
    process.env.OLLAMA_MODEL = stored.ollamaModel
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

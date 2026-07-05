export type LlmMode = 'conservative' | 'standard'

export type DictationLanguageMode = 'tr' | 'tr-en'

export type HotkeyMode = 'push-to-talk' | 'toggle'

export type TransformMode = 'polish' | 'raw'

export type OverlayState = 'idle' | 'recording' | 'processing' | 'edit' | 'error'

export type AppearanceAccent = 'green' | 'amber' | 'indigo' | 'red'

export type AppearanceMode = 'dark' | 'light'

export type AppearanceMetaphor = 'wave' | 'orb' | 'dot' | 'blob'

export type AppearanceFont = 'system' | 'geist' | 'serif'

export type OverlayMouseRegion =
  | 'interactive'
  | 'passthrough'
  | { x: number; y: number; width: number; height: number }[]

export interface OverlayStateDetail {
  message?: string
}

export interface OverlayMicInfo {
  label: string
  auto: boolean
}

export interface MicrophoneDevice {
  deviceId: string
  label: string
}

export type VocabPreset = 'none' | 'software' | 'medical' | 'legal'

export interface SnippetEntry {
  id: string
  trigger: string
  expansion: string
  createdAt: number
}

export interface CustomVocabEntry {
  id: string
  term: string
  replacement: string
  createdAt: number
}

export interface DictationProfile {
  id: string
  name: string
  hotkeyKeyCode?: number
  hotkeyMode?: 'push-to-talk' | 'toggle'
  llmMode?: LlmMode
  llmEnabled?: boolean
  vocabPreset?: VocabPreset
  customPrompt?: string
  createdAt: number
  updatedAt: number
}

export type UiLanguage = 'tr' | 'en'

export interface AppSettings {
  groqApiKey: string
  ollamaBaseUrl: string
  ollamaModel: string
  dictationLanguageMode: DictationLanguageMode
  hotkeyKeyCode: number
  hotkeyMode: HotkeyMode
  llmEnabled: boolean
  llmMode: LlmMode
  llmTemperature: number
  microphoneDeviceId: string
  useClipboardInjection: boolean
  onboardingCompleted: boolean
  autoApply: boolean
  transformMode: TransformMode
  overlayEnabled: boolean
  customPrompt: string
  vocabPreset: VocabPreset
  appContextEnabled: boolean
  uiLanguage: UiLanguage
  llmCacheEnabled: boolean
  activeProfileId: string | null
  appearanceAccent: AppearanceAccent
  appearanceMode: AppearanceMode
  appearanceMetaphor: AppearanceMetaphor
  appearanceFont: AppearanceFont
  radiusScale: number
}

export type AppSettingsUpdate = Partial<AppSettings>

export interface DictationEntry {
  id: string
  timestamp: number
  rawText: string
  cleanText: string
  latencyMs: number
  app?: string
  fallback?: boolean
  tags?: string[]
}

export interface DictationHistory {
  entries: DictationEntry[]
}

export interface PermissionSnapshot {
  platform: NodeJS.Platform
  microphone: 'granted' | 'denied' | 'not-determined' | 'restricted' | 'unknown'
  accessibility: 'granted' | 'denied' | 'unsupported'
}

export interface RendererApi {
  log: (level: string, message: string) => void
  audio: {
    onStartRecording: (callback: (deviceId: string) => void) => () => void
    onStopRecording: (callback: () => void) => () => void
    onCancelRecording: (callback: () => void) => () => void
    sendRecordingComplete: (buffer: ArrayBuffer) => void
    sendRecordingError: (message: string) => void
    sendRecordingLevel: (level: number) => void
    sendMicInfo: (info: OverlayMicInfo) => void
  }
  settings: {
    get: () => Promise<AppSettings>
    set: (settings: AppSettingsUpdate) => Promise<AppSettings>
    onChanged: (callback: (settings: AppSettings) => void) => () => void
    getAvailableMics: () => Promise<MicrophoneDevice[]>
  }
  permissions: {
    check: () => Promise<PermissionSnapshot>
    requestMicrophone: () => Promise<PermissionSnapshot>
    openMicrophoneSettings: () => Promise<void>
    openAccessibilitySettings: () => Promise<void>
    onAccessibilityGranted: (callback: () => void) => () => void
  }
  app: {
    relaunch: () => Promise<void>
    openLogDir: () => Promise<void>
    getVersion: () => Promise<string>
  }
  llm: {
    test: (payload?: { text?: string; mode?: LlmMode }) => Promise<LlmTestResult>
  }
  history: {
    getEntries: () => Promise<DictationEntry[]>
    deleteEntry: (id: string) => Promise<void>
    clearAll: () => Promise<void>
    exportEntries: (format: 'json' | 'markdown' | 'csv') => Promise<string>
    reinjectEntry: (id: string) => Promise<{ ok: boolean; error?: string }>
    tagEntry: (id: string, tag: string) => Promise<void>
  }
  snippets: {
    getAll: () => Promise<SnippetEntry[]>
    add: (trigger: string, expansion: string) => Promise<SnippetEntry>
    update: (id: string, trigger: string, expansion: string) => Promise<SnippetEntry | null>
    delete: (id: string) => Promise<void>
  }
  customVocab: {
    getAll: () => Promise<CustomVocabEntry[]>
    add: (term: string, replacement: string) => Promise<CustomVocabEntry>
    delete: (id: string) => Promise<void>
  }
  profiles: {
    getAll: () => Promise<DictationProfile[]>
    add: (name: string, data?: Partial<DictationProfile>) => Promise<DictationProfile>
    update: (id: string, data: Partial<DictationProfile>) => Promise<DictationProfile | null>
    delete: (id: string) => Promise<void>
    setActive: (id: string | null) => Promise<void>
    getActiveId: () => Promise<string | null>
  }
}

export interface LlmTestResult {
  ok: boolean
  input: string
  output: string
  latencyMs: number
  model?: string
  fallback?: boolean
  error?: string
}

export interface OverlayApi {
  onState: (callback: (state: OverlayState, detail?: OverlayStateDetail) => void) => () => void
  onLevel: (callback: (level: number) => void) => () => void
  onMicInfo: (callback: (info: OverlayMicInfo) => void) => () => void
  onSettings: (
    callback: (
      settings: Pick<
        AppSettings,
        | 'autoApply'
        | 'transformMode'
        | 'hotkeyKeyCode'
        | 'appearanceAccent'
        | 'appearanceMetaphor'
        | 'appearanceFont'
        | 'radiusScale'
      >
    ) => void
  ) => () => void
  cancelRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  openSettings: () => Promise<void>
  setAutoApply: (enabled: boolean) => Promise<void>
  setTransformMode: (mode: TransformMode) => Promise<void>
  setMouseRegion: (region: OverlayMouseRegion) => void
  quickEdit: (instruction: string) => Promise<{ ok: boolean; text?: string; error?: string }>
}

declare global {
  interface Window {
    api: RendererApi
    overlayApi: OverlayApi
  }
}

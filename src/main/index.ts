import 'dotenv/config'
import { join } from 'node:path'
import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { transcribe } from './asr'
import { createHotkeyManager, type HotkeyManager } from './hotkey'
import { injectText } from './injector'
import { cleanTranscript } from './llm'
import type { LlmMode } from '@/shared/types'
import { logger, openLogDir } from './logger'
import { createOverlayWindow, type OverlayWindowController } from './overlay-window'
import {
  checkPermissions,
  openAccessibilitySettings,
  openMicrophoneSettings,
  requestMicrophonePermission,
  watchAccessibilityPermission
} from './permissions'
import { createPipeline, type Pipeline } from './pipeline'
import { createRecorderBridge, type RecorderBridge } from './recorder-bridge'
import { createSettingsStore, type SettingsStore } from './store'
import { type AppTray, createTray } from './tray'
import { createHistoryStore, type HistoryStore } from './history-store'
import { createSnippetsStore, type SnippetsStore } from './snippets-store'
import { createCustomVocabStore, type CustomVocabStore } from './custom-vocab-store'
import { createProfilesStore, type ProfilesStore } from './profiles-store'
import type { AppSettings, AppSettingsUpdate } from '@/shared/types'

let historyStore: HistoryStore | null = null
let snippetsStore: SnippetsStore | null = null
let customVocabStore: CustomVocabStore | null = null
let profilesStore: ProfilesStore | null = null
let settingsWindow: BrowserWindow | null = null
let tray: AppTray | null = null
let hotkeyManager: HotkeyManager | null = null
let recorderBridge: RecorderBridge | null = null
let pipeline: Pipeline | null = null
let settingsStore: SettingsStore | null = null
let overlayWindow: OverlayWindowController | null = null
let isQuitting = false
let stopAccessibilityWatch: (() => void) | null = null

// Pipeline'a stable bir overlay handle vermek için her çağrıda mevcut window'u proxy üzerinden iletiyoruz.
// (overlayWindow uçucu olabilir; pipeline'a doğrudan referans veremiyoruz.)
const overlayBridge: OverlayWindowController = {
  sendState: (state, detail) => overlayWindow?.sendState(state, detail),
  sendLevel: (level) => overlayWindow?.sendLevel(level),
  sendMicInfo: (info) => overlayWindow?.sendMicInfo(info),
  sendSettings: () => overlayWindow?.sendSettings(),
  showMessage: (message) => overlayWindow?.showMessage(message),
  destroy: () => overlayWindow?.destroy(),
  isDestroyed: () => !overlayWindow || overlayWindow.isDestroyed()
}

function showSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 720,
    minHeight: 480,
    show: false,
    title: 'Sesli Dikte',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  settingsWindow.on('ready-to-show', () => {
    settingsWindow?.show()
  })

  settingsWindow.on('close', (event) => {
    if (isQuitting) {
      return
    }

    event.preventDefault()
    settingsWindow?.hide()
  })

  settingsWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    settingsWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    // settingsWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function quitApp(): void {
  isQuitting = true
  tray?.destroy()
  overlayWindow?.destroy()
  app.quit()
}

function destroyOverlayWindow(): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    overlayWindow = null
    return
  }

  overlayWindow.destroy()
  overlayWindow = null
}

function broadcastSettingsChanged(settings: AppSettings): void {
  settingsWindow?.webContents.send('settings:changed', settings)
  overlayWindow?.sendSettings()
}

function updateAppSettings(settingsUpdate: AppSettingsUpdate): AppSettings {
  if (!settingsStore) {
    throw new Error('Settings store is not initialized')
  }

  const savedSettings = settingsStore.updateSettings(settingsUpdate)
  hotkeyManager?.setKey(savedSettings.hotkeyKeyCode)
  ensureOverlayWindow()
  broadcastSettingsChanged(savedSettings)
  return savedSettings
}

function ensureOverlayWindow(): void {
  if (!settingsStore) {
    return
  }

  const settings = settingsStore.getSettings()

  if (!settings.onboardingCompleted || !settings.overlayEnabled) {
    destroyOverlayWindow()
    return
  }

  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.sendSettings()
    return
  }

  overlayWindow = createOverlayWindow({
    getSettings: () => {
      if (!settingsStore) {
        throw new Error('Settings store is not initialized')
      }

      return settingsStore.getSettings()
    },
    updateSettings: (settingsUpdate) => updateAppSettings(settingsUpdate),
    showSettingsWindow,
    cancelRecording: () => pipeline?.cancelRecording(),
    stopRecording: () => pipeline?.stopRecording()
  })
}

function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', () => {
    return settingsStore?.getSettings()
  })

  ipcMain.handle('settings:set', (_, settings: AppSettingsUpdate) => {
    return updateAppSettings(settings)
  })

  ipcMain.handle('permissions:check', () => checkPermissions())
  ipcMain.handle('permissions:request-microphone', () => requestMicrophonePermission())
  ipcMain.handle('permissions:open-accessibility-settings', () => openAccessibilitySettings())
  ipcMain.handle('permissions:open-microphone-settings', () => openMicrophoneSettings())

  // P1: relaunch handler
  ipcMain.handle('app:relaunch', () => {
    logger.info('[app] relaunch requested')
    app.relaunch()
    app.exit(0)
  })

  // P5: log helpers
  ipcMain.handle('app:open-log-dir', () => openLogDir())

  ipcMain.handle('app:get-version', () => app.getVersion())

  ipcMain.handle(
    'overlay:quick-edit',
    async (_event, payload: { text: string; instruction: string }) => {
      try {
        const settings = settingsStore?.getSettings()
        const result = await cleanTranscript(payload.text, {
          mode: 'standard',
          languageMode: settings?.dictationLanguageMode,
          temperature: 0.3,
          customPrompt: `Kullanıcı talimatı: "${payload.instruction}". Bu talimatı uygula.`,
          vocabPreset: settings?.vocabPreset,
          allowRewrite: true
        })
        return { ok: !result.fallback, text: result.text }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )

  ipcMain.handle('history:get-entries', () => historyStore?.getEntries() ?? [])
  ipcMain.handle('history:delete-entry', (_event, id: string) => historyStore?.deleteEntry(id))
  ipcMain.handle('history:clear-all', () => historyStore?.clearAll())
  ipcMain.handle(
    'history:export',
    (_event, format: 'json' | 'markdown' | 'csv') => historyStore?.exportEntries(format) ?? ''
  )
  ipcMain.handle('history:tag-entry', (_event, id: string, tag: string) =>
    historyStore?.tagEntry(id, tag)
  )
  ipcMain.handle('history:reinject', async (_event, id: string) => {
    const entry = historyStore?.getEntries().find((e) => e.id === id)
    if (!entry) return { ok: false, error: 'Kayıt bulunamadı' }
    try {
      const { injectText } = await import('./injector')
      await injectText(entry.cleanText)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Snippets IPC
  ipcMain.handle('snippets:get-all', () => snippetsStore?.getAll() ?? [])
  ipcMain.handle('snippets:add', (_event, trigger: string, expansion: string) =>
    snippetsStore?.add(trigger, expansion)
  )
  ipcMain.handle('snippets:update', (_event, id: string, trigger: string, expansion: string) =>
    snippetsStore?.update(id, trigger, expansion)
  )
  ipcMain.handle('snippets:delete', (_event, id: string) => snippetsStore?.delete(id))

  // Custom Vocab IPC
  ipcMain.handle('custom-vocab:get-all', () => customVocabStore?.getAll() ?? [])
  ipcMain.handle('custom-vocab:add', (_event, term: string, replacement: string) =>
    customVocabStore?.add(term, replacement)
  )
  ipcMain.handle('custom-vocab:delete', (_event, id: string) => customVocabStore?.delete(id))

  // Profiles IPC
  ipcMain.handle('profiles:get-all', () => profilesStore?.getAll() ?? [])
  ipcMain.handle('profiles:add', (_event, name: string, data: Record<string, unknown>) =>
    profilesStore?.add(name, data as Parameters<ProfilesStore['add']>[1])
  )
  ipcMain.handle('profiles:update', (_event, id: string, data: Record<string, unknown>) =>
    profilesStore?.update(id, data as Parameters<ProfilesStore['update']>[1])
  )
  ipcMain.handle('profiles:delete', (_event, id: string) => profilesStore?.delete(id))
  ipcMain.handle('profiles:set-active', (_event, id: string | null) => profilesStore?.setActive(id))
  ipcMain.handle('profiles:get-active-id', () => profilesStore?.getActiveId() ?? null)

  // Renderer log bridge
  ipcMain.on('log', (_event, level: string, message: string) => {
    switch (level) {
      case 'debug':
        logger.debug(`[renderer] ${message}`)
        break
      case 'warn':
        logger.warn(`[renderer] ${message}`)
        break
      case 'error':
        logger.error(`[renderer] ${message}`)
        break
      default:
        logger.info(`[renderer] ${message}`)
    }
  })

  ipcMain.handle('history:get-active-app', async () => {
    if (process.platform !== 'darwin') return null
    try {
      const { execFile } = await import('node:child_process')
      const { promisify } = await import('node:util')
      const execFileAsync = promisify(execFile)
      const { stdout } = await execFileAsync('osascript', [
        '-e',
        'tell application "System Events" to get name of first application process whose frontmost is true'
      ])
      return stdout.trim() || null
    } catch {
      return null
    }
  })

  ipcMain.handle('llm:test', async (_event, payload: { text?: string; mode?: LlmMode } = {}) => {
    const sample = payload.text || 'şey ee bugün hani toplantıya gittim yaa'
    const mode = payload.mode ?? 'standard'

    try {
      const result = await cleanTranscript(sample, {
        mode,
        languageMode: settingsStore?.getSettings().dictationLanguageMode,
        temperature: settingsStore?.getSettings().llmTemperature
      })
      return {
        ok: !result.fallback,
        input: sample,
        output: result.text,
        latencyMs: result.latencyMs,
        model: result.model,
        fallback: Boolean(result.fallback)
      }
    } catch (error) {
      return {
        ok: false,
        input: sample,
        output: '',
        latencyMs: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })
}

app.whenReady().then(() => {
  logger.info(`[app] starting v${app.getVersion()} (pid=${process.pid})`)
  electronApp.setAppUserModelId('com.omersahin.seslidikte')
  app.dock?.hide()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  historyStore = createHistoryStore()
  snippetsStore = createSnippetsStore()
  customVocabStore = createCustomVocabStore()
  profilesStore = createProfilesStore()

  tray = createTray({
    showSettingsWindow,
    quit: quitApp,
    getRecentDictations: () => historyStore?.getEntries().slice(0, 5) ?? []
  })

  settingsStore = createSettingsStore()
  settingsStore.applyToProcessEnv()
  registerSettingsIpc()
  ensureOverlayWindow()

  hotkeyManager = createHotkeyManager({
    keyCode: settingsStore.getSettings().hotkeyKeyCode
  })
  recorderBridge = createRecorderBridge({
    onAudio: (audioBuffer) => pipeline?.handleAudioBuffer(audioBuffer),
    onError: (message) => pipeline?.handleRecorderError(message),
    onLevel: (level) => overlayWindow?.sendLevel(level),
    onMicInfo: (info) => overlayWindow?.sendMicInfo(info)
  })

  pipeline = createPipeline({
    hotkey: hotkeyManager,
    recorder: recorderBridge,
    asr: { transcribe },
    llm: { cleanTranscript },
    injector: { injectText },
    tray,
    overlay: overlayBridge,
    settings: {
      get: () => {
        if (!settingsStore) {
          throw new Error('Settings store is not initialized')
        }

        return settingsStore.getSettings()
      }
    },
    history: historyStore
      ? {
          addEntry: (entry) => {
            historyStore!.addEntry(entry)
            tray?.updateRecentDictations(historyStore!.getEntries().slice(0, 5))
          }
        }
      : undefined,
    snippets: snippetsStore ?? undefined,
    customVocab: customVocabStore ?? undefined,
    getActiveApp: async () => {
      if (process.platform !== 'darwin') return null
      try {
        const { execFile } = await import('node:child_process')
        const { promisify } = await import('node:util')
        const execFileAsync = promisify(execFile)
        const { stdout } = await execFileAsync('osascript', [
          '-e',
          'tell application "System Events" to get name of first application process whose frontmost is true'
        ])
        return stdout.trim() || null
      } catch {
        return null
      }
    }
  })

  // P1: Watch accessibility permission and notify renderer when granted
  stopAccessibilityWatch = watchAccessibilityPermission(() => {
    logger.info('[app] accessibility permission granted, notifying renderer')
    settingsWindow?.webContents.send('permissions:accessibility-granted')
  })

  hotkeyManager.start()

  showSettingsWindow()

  app.on('activate', () => {
    showSettingsWindow()
  })

  logger.info('[app] ready')
})

app.on('before-quit', () => {
  isQuitting = true
  stopAccessibilityWatch?.()
  pipeline?.dispose()
  hotkeyManager?.stop()
  recorderBridge?.destroy()
  overlayWindow?.destroy()
  logger.info('[app] quitting')
})

app.on('window-all-closed', () => {})

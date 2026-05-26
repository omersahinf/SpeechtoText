import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, RendererApi } from '@/shared/types'

const DEFAULT_INVOKE_TIMEOUT_MS = 10_000

function invokeWithTimeout<T>(channel: string, ...args: unknown[]): Promise<T> {
  // LLM/ASR çağrıları gibi network ağırlıklı IPC'ler için daha uzun süre tut.
  const timeoutMs =
    channel.startsWith('llm:') || channel.startsWith('asr:') ? 25_000 : DEFAULT_INVOKE_TIMEOUT_MS

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`IPC '${channel}' timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    ipcRenderer
      .invoke(channel, ...args)
      .then((result: T) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error: unknown) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

const api: RendererApi = {
  audio: {
    onStartRecording(callback) {
      const listener = (_event: Electron.IpcRendererEvent, deviceId: string): void =>
        callback(deviceId)
      ipcRenderer.on('audio:start-recording', listener)
      return () => ipcRenderer.removeListener('audio:start-recording', listener)
    },
    onStopRecording(callback) {
      const listener = (): void => callback()
      ipcRenderer.on('audio:stop-recording', listener)
      return () => ipcRenderer.removeListener('audio:stop-recording', listener)
    },
    onCancelRecording(callback) {
      const listener = (): void => callback()
      ipcRenderer.on('audio:cancel-recording', listener)
      return () => ipcRenderer.removeListener('audio:cancel-recording', listener)
    },
    sendRecordingComplete(buffer) {
      ipcRenderer.send('audio:recording-complete', buffer)
    },
    sendRecordingError(message) {
      ipcRenderer.send('audio:recording-error', message)
    },
    sendRecordingLevel(level) {
      ipcRenderer.send('audio:recording-level', level)
    },
    sendMicInfo(info) {
      ipcRenderer.send('audio:mic-info', info)
    }
  },
  settings: {
    get() {
      return invokeWithTimeout('settings:get')
    },
    set(settings) {
      return invokeWithTimeout('settings:set', settings)
    },
    onChanged(callback) {
      const listener = (_event: Electron.IpcRendererEvent, settings: AppSettings): void =>
        callback(settings)
      ipcRenderer.on('settings:changed', listener)
      return () => ipcRenderer.removeListener('settings:changed', listener)
    },
    async getAvailableMics() {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return []
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Mikrofon ${index + 1}`
        }))
    }
  },
  permissions: {
    check() {
      return invokeWithTimeout('permissions:check')
    },
    requestMicrophone() {
      return invokeWithTimeout('permissions:request-microphone')
    },
    openMicrophoneSettings() {
      return invokeWithTimeout('permissions:open-microphone-settings')
    },
    openAccessibilitySettings() {
      return invokeWithTimeout('permissions:open-accessibility-settings')
    },
    onAccessibilityGranted(callback) {
      const listener = (): void => callback()
      ipcRenderer.on('permissions:accessibility-granted', listener)
      return () => ipcRenderer.removeListener('permissions:accessibility-granted', listener)
    }
  },
  app: {
    relaunch() {
      return invokeWithTimeout('app:relaunch')
    },
    openLogDir() {
      return invokeWithTimeout('app:open-log-dir')
    },
    getVersion() {
      return invokeWithTimeout('app:get-version')
    }
  },
  llm: {
    test(payload) {
      return invokeWithTimeout('llm:test', payload ?? {})
    }
  },
  history: {
    getEntries() {
      return invokeWithTimeout('history:get-entries')
    },
    deleteEntry(id: string) {
      return invokeWithTimeout('history:delete-entry', id)
    },
    clearAll() {
      return invokeWithTimeout('history:clear-all')
    },
    exportEntries(format: 'json' | 'markdown' | 'csv') {
      return invokeWithTimeout('history:export', format)
    },
    reinjectEntry(id: string) {
      return invokeWithTimeout('history:reinject', id)
    },
    tagEntry(id: string, tag: string) {
      return invokeWithTimeout('history:tag-entry', id, tag)
    }
  },
  snippets: {
    getAll() {
      return invokeWithTimeout('snippets:get-all')
    },
    add(trigger: string, expansion: string) {
      return invokeWithTimeout('snippets:add', trigger, expansion)
    },
    update(id: string, trigger: string, expansion: string) {
      return invokeWithTimeout('snippets:update', id, trigger, expansion)
    },
    delete(id: string) {
      return invokeWithTimeout('snippets:delete', id)
    }
  },
  customVocab: {
    getAll() {
      return invokeWithTimeout('custom-vocab:get-all')
    },
    add(term: string, replacement: string) {
      return invokeWithTimeout('custom-vocab:add', term, replacement)
    },
    delete(id: string) {
      return invokeWithTimeout('custom-vocab:delete', id)
    }
  },
  profiles: {
    getAll() {
      return invokeWithTimeout('profiles:get-all')
    },
    add(name: string, data?: Record<string, unknown>) {
      return invokeWithTimeout('profiles:add', name, data ?? {})
    },
    update(id: string, data: Record<string, unknown>) {
      return invokeWithTimeout('profiles:update', id, data)
    },
    delete(id: string) {
      return invokeWithTimeout('profiles:delete', id)
    },
    setActive(id: string | null) {
      return invokeWithTimeout('profiles:set-active', id)
    },
    getActiveId() {
      return invokeWithTimeout('profiles:get-active-id')
    }
  },
  log(level: string, message: string) {
    ipcRenderer.send('log', level, message)
  }
}

contextBridge.exposeInMainWorld('api', api)

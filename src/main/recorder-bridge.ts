import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { logger } from './logger'
import type { OverlayMicInfo } from '@/shared/types'

export interface RecorderBridge {
  start: (deviceId?: string) => void
  stop: () => void
  cancel: () => void
  destroy: () => void
}

interface CreateRecorderBridgeOptions {
  onAudio?: (audioBuffer: Buffer) => void | Promise<void>
  onError?: (message: string) => void
  onLevel?: (level: number) => void
  onMicInfo?: (info: OverlayMicInfo) => void
}

function createRecorderWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 320,
    height: 240,
    show: false,
    skipTaskbar: true,
    title: 'Sesli Dikte Recorder',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(`${process.env.ELECTRON_RENDERER_URL}?mode=recorder`)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { mode: 'recorder' }
    })
  }

  return window
}

async function writeDevRecording(audioBuffer: Buffer): Promise<void> {
  if (!is.dev) {
    return
  }

  try {
    const recordingsDir = join(app.getAppPath(), 'dist/test-recordings')
    await mkdir(recordingsDir, { recursive: true })
    const filePath = join(recordingsDir, `recording-${Date.now()}.wav`)
    await writeFile(filePath, audioBuffer)
    logger.info(`[recorder] wrote ${filePath} (${audioBuffer.length} bytes)`)
  } catch (error) {
    logger.warn('[recorder] dev recording write failed', error)
  }
}

export function createRecorderBridge(options: CreateRecorderBridgeOptions = {}): RecorderBridge {
  const recorderWindow = createRecorderWindow()
  let lastMicLabel = ''

  const handleAudio = (event: Electron.IpcMainEvent, audioArrayBuffer: ArrayBuffer): void => {
    if (event.sender !== recorderWindow.webContents) {
      return
    }

    const audioBuffer = Buffer.from(audioArrayBuffer)
    void writeDevRecording(audioBuffer)
    void options.onAudio?.(audioBuffer)
  }

  const handleError = (event: Electron.IpcMainEvent, message: string): void => {
    if (event.sender !== recorderWindow.webContents) {
      return
    }
    logger.warn(`[recorder] ${message}`)
    options.onError?.(message)
  }

  const handleLevel = (event: Electron.IpcMainEvent, level: number): void => {
    if (event.sender !== recorderWindow.webContents) {
      return
    }
    options.onLevel?.(Math.max(0, Math.min(1, level)))
  }

  const handleMicInfo = (event: Electron.IpcMainEvent, info: OverlayMicInfo): void => {
    if (event.sender !== recorderWindow.webContents || !info.label) {
      return
    }

    if (info.label === lastMicLabel) {
      return
    }

    lastMicLabel = info.label
    options.onMicInfo?.(info)
  }

  ipcMain.on('audio:recording-complete', handleAudio)
  ipcMain.on('audio:recording-error', handleError)
  ipcMain.on('audio:recording-level', handleLevel)
  ipcMain.on('audio:mic-info', handleMicInfo)

  const start = (deviceId = ''): void => {
    if (!recorderWindow.isDestroyed()) {
      recorderWindow.webContents.send('audio:start-recording', deviceId)
    }
  }

  const stop = (): void => {
    if (!recorderWindow.isDestroyed()) {
      recorderWindow.webContents.send('audio:stop-recording')
    }
  }

  const cancel = (): void => {
    if (!recorderWindow.isDestroyed()) {
      recorderWindow.webContents.send('audio:cancel-recording')
    }
  }

  return {
    start,
    stop,
    cancel,
    destroy(): void {
      ipcMain.removeListener('audio:recording-complete', handleAudio)
      ipcMain.removeListener('audio:recording-error', handleError)
      ipcMain.removeListener('audio:recording-level', handleLevel)
      ipcMain.removeListener('audio:mic-info', handleMicInfo)

      if (!recorderWindow.isDestroyed()) {
        recorderWindow.destroy()
      }
    }
  }
}

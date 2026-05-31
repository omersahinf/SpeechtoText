import { join } from 'node:path'
import { BrowserWindow, ipcMain, screen, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import type {
  AppSettings,
  AppSettingsUpdate,
  OverlayMicInfo,
  OverlayMouseRegion,
  OverlayState,
  OverlayStateDetail,
  TransformMode
} from '@/shared/types'

const OVERLAY_WIDTH = 340
const OVERLAY_HEIGHT = 230
const BOTTOM_MARGIN = 8

export interface OverlayWindowController {
  sendState: (state: OverlayState, detail?: OverlayStateDetail) => void
  sendLevel: (level: number) => void
  sendMicInfo: (info: OverlayMicInfo) => void
  sendSettings: () => void
  showMessage: (message: string) => void
  destroy: () => void
  isDestroyed: () => boolean
}

interface CreateOverlayWindowOptions {
  getSettings: () => AppSettings
  updateSettings: (settings: AppSettingsUpdate) => AppSettings
  showSettingsWindow: () => void
  cancelRecording: () => void
  stopRecording: () => void
}

function positionOverlayWindow(window: BrowserWindow): void {
  // Cursor'un olduğu ekrana yerleş; yoksa primary display'e düş.
  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint) ?? screen.getPrimaryDisplay()
  const { bounds } = display
  const x = Math.round(bounds.x + (bounds.width - OVERLAY_WIDTH) / 2)
  const y = Math.round(bounds.y + bounds.height - OVERLAY_HEIGHT - BOTTOM_MARGIN)
  window.setBounds({ x, y, width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT })
}

function isInteractiveRegion(region: OverlayMouseRegion): boolean {
  return region === 'interactive' || (Array.isArray(region) && region.length > 0)
}

export function createOverlayWindow(options: CreateOverlayWindowOptions): OverlayWindowController {
  const overlayWindow = new BrowserWindow({
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    show: false,
    title: 'Sesli Dikte Overlay',
    autoHideMenuBar: true,
    acceptFirstMouse: true,
    webPreferences: {
      preload: join(__dirname, '../preload/overlay.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  })

  overlayWindow.setAlwaysOnTop(true, 'floating')
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  positionOverlayWindow(overlayWindow)

  if (process.platform === 'darwin') {
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    overlayWindow.setWindowButtonVisibility(false)
  }

  const displayListener = (): void => positionOverlayWindow(overlayWindow)
  screen.on('display-metrics-changed', displayListener)

  overlayWindow.on('ready-to-show', () => {
    overlayWindow.showInactive()
    controller.sendSettings()
    controller.sendState('idle')
  })

  overlayWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    overlayWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/overlay`)
  } else {
    overlayWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/overlay'
    })
  }

  const ensureOverlaySender = (
    event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent
  ): boolean => event.sender === overlayWindow.webContents

  const overlayHandlers: Array<{
    channel: string
    handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => unknown
  }> = [
    {
      channel: 'overlay:cancel-recording',
      handler: (event) => {
        if (!ensureOverlaySender(event)) return
        options.cancelRecording()
      }
    },
    {
      channel: 'overlay:stop-recording',
      handler: (event) => {
        if (!ensureOverlaySender(event)) return
        options.stopRecording()
      }
    },
    {
      channel: 'overlay:open-settings',
      handler: (event) => {
        if (!ensureOverlaySender(event)) return
        options.showSettingsWindow()
      }
    },
    {
      channel: 'overlay:set-auto-apply',
      handler: (event, ...args) => {
        if (!ensureOverlaySender(event)) return
        const enabled = args[0] as boolean
        const settings = options.updateSettings({ autoApply: enabled })
        controller.sendSettings()
        return settings
      }
    },
    {
      channel: 'overlay:set-transform-mode',
      handler: (event, ...args) => {
        if (!ensureOverlaySender(event)) return
        const mode = args[0] as TransformMode
        const settings = options.updateSettings({ transformMode: mode })
        controller.sendSettings()
        return settings
      }
    }
  ]

  // Handler'ları atomik kaydet: önce eski olanı sil, hemen ardından yenisini ekle.
  for (const { channel, handler } of overlayHandlers) {
    ipcMain.removeHandler(channel)
    ipcMain.handle(channel, handler)
  }

  const mouseRegionListener = (event: Electron.IpcMainEvent, region: OverlayMouseRegion): void => {
    if (!ensureOverlaySender(event) || overlayWindow.isDestroyed()) {
      return
    }

    if (isInteractiveRegion(region)) {
      overlayWindow.setIgnoreMouseEvents(false)
      return
    }

    overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  }

  ipcMain.on('overlay:set-mouse-region', mouseRegionListener)

  const controller: OverlayWindowController = {
    sendState(state, detail) {
      if (!overlayWindow.isDestroyed()) {
        if (state === 'recording') {
          // Kayıt başlarken cursor'un olduğu ekrana atla
          positionOverlayWindow(overlayWindow)
        }
        overlayWindow.webContents.send('overlay:state', state, detail)
      }
    },
    sendLevel(level) {
      if (!overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('overlay:level', Math.max(0, Math.min(1, level)))
      }
    },
    sendMicInfo(info) {
      if (!overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('overlay:mic-info', info)
      }
    },
    sendSettings() {
      if (!overlayWindow.isDestroyed()) {
        const {
          autoApply,
          hotkeyKeyCode,
          transformMode,
          appearanceAccent,
          appearanceMetaphor,
          appearanceFont,
          radiusScale
        } = options.getSettings()
        overlayWindow.webContents.send('overlay:settings', {
          autoApply,
          hotkeyKeyCode,
          transformMode,
          appearanceAccent,
          appearanceMetaphor,
          appearanceFont,
          radiusScale
        })
      }
    },
    showMessage(message) {
      controller.sendState('idle', { message })
    },
    destroy() {
      if (!overlayWindow.isDestroyed()) {
        overlayWindow.setIgnoreMouseEvents(true, { forward: true })
        overlayWindow.destroy()
      }
      screen.off('display-metrics-changed', displayListener)
      ipcMain.removeListener('overlay:set-mouse-region', mouseRegionListener)
      for (const { channel } of overlayHandlers) {
        ipcMain.removeHandler(channel)
      }
    },
    isDestroyed() {
      return overlayWindow.isDestroyed()
    }
  }

  overlayWindow.on('closed', () => {
    screen.off('display-metrics-changed', displayListener)
    ipcMain.removeListener('overlay:set-mouse-region', mouseRegionListener)
    for (const { channel } of overlayHandlers) {
      ipcMain.removeHandler(channel)
    }
  })

  return controller
}

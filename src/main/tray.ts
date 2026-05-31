import { join } from 'node:path'
import { BrowserWindow, Menu, Tray, app, clipboard, nativeImage, screen } from 'electron'
import { is } from '@electron-toolkit/utils'
import { logger } from './logger'
import type { DictationEntry } from '@/shared/types'

export interface AppTray {
  setRecordingState: (isRecording: boolean) => void
  setProcessingState: (isProcessing: boolean) => void
  flashError: () => void
  updateRecentDictations: (entries: DictationEntry[]) => void
  destroy: () => void
}

interface CreateTrayOptions {
  showSettingsWindow: () => void
  quit: () => void
  getRecentDictations?: () => DictationEntry[]
}

const ERROR_FLASH_DURATION_MS = 3000
const MAX_RECENT_IN_MENU = 5

function iconPath(filename: string): string {
  return join(__dirname, '../../resources/icons', filename)
}

function loadIcon(filename: string, isTemplate: boolean): Electron.NativeImage {
  const image = nativeImage.createFromPath(iconPath(filename))
  image.setTemplateImage(isTemplate)
  return image
}

function truncate(text: string, maxLen = 40): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

export function createTray({
  showSettingsWindow,
  quit,
  getRecentDictations
}: CreateTrayOptions): AppTray {
  let isRecording = false
  let isProcessing = false
  let isError = false
  let isDestroyed = false
  let errorTimer: ReturnType<typeof setTimeout> | null = null
  let recentDictations: DictationEntry[] = getRecentDictations?.() ?? []
  let popoverWindow: BrowserWindow | null = null

  const tray = new Tray(loadIcon('tray-idle.png', process.platform === 'darwin'))
  tray.setToolTip('Sesli Dikte')

  const applyIcon = (): void => {
    if (isDestroyed) return

    if (isError) {
      tray.setImage(loadIcon('tray-recording.png', false))
      tray.setToolTip('Sesli Dikte - Hata')
      return
    }

    if (isRecording) {
      tray.setImage(loadIcon('tray-recording.png', false))
      tray.setToolTip('Sesli Dikte - Kaydediyor')
      return
    }

    if (isProcessing) {
      tray.setImage(loadIcon('tray-recording.png', false))
      tray.setToolTip('Sesli Dikte - İşleniyor')
      return
    }

    tray.setImage(loadIcon('tray-idle.png', process.platform === 'darwin'))
    tray.setToolTip('Sesli Dikte')
  }

  const buildMenu = (): void => {
    if (isDestroyed) return

    const recentItems: Electron.MenuItemConstructorOptions[] =
      recentDictations.length === 0
        ? [{ label: 'Henüz kayıt yok', enabled: false }]
        : recentDictations.slice(0, MAX_RECENT_IN_MENU).map((entry) => ({
            label: truncate(entry.cleanText),
            click: () => {
              // Clipboard'a kopyala
              clipboard.writeText(entry.cleanText)
            }
          }))

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Ayarları aç',
        click: showSettingsWindow
      },
      {
        label: 'Son dikte kayıtları',
        submenu: recentItems
      },
      { type: 'separator' },
      {
        label: 'Log klasörünü aç',
        click: async () => {
          const { openLogDir } = await import('./logger')
          await openLogDir()
        }
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: quit
      }
    ])

    tray.setContextMenu(contextMenu)
  }

  const showTrayPopover = (): void => {
    if (isDestroyed) return

    if (popoverWindow && !popoverWindow.isDestroyed()) {
      if (popoverWindow.isVisible()) {
        popoverWindow.hide()
        return
      }
      popoverWindow.showInactive()
      return
    }

    popoverWindow = new BrowserWindow({
      width: 320,
      height: 360,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
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

    const trayBounds = tray.getBounds()
    const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
    const { bounds } = display
    const x = Math.round(
      Math.min(
        Math.max(trayBounds.x + trayBounds.width / 2 - 160, bounds.x + 8),
        bounds.x + bounds.width - 328
      )
    )
    const y =
      process.platform === 'darwin'
        ? Math.round(trayBounds.y + trayBounds.height + 8)
        : Math.round(trayBounds.y - 368)
    popoverWindow.setBounds({ x, y, width: 320, height: 360 })

    popoverWindow.on('blur', () => popoverWindow?.hide())
    popoverWindow.on('closed', () => {
      popoverWindow = null
    })

    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      popoverWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/#/tray`)
    } else {
      popoverWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/tray' })
    }

    popoverWindow.once('ready-to-show', () => popoverWindow?.showInactive())
  }

  buildMenu()
  tray.on('click', showTrayPopover)
  tray.on('double-click', showSettingsWindow)

  const destroy = (): void => {
    if (isDestroyed) return
    isDestroyed = true
    if (errorTimer) {
      clearTimeout(errorTimer)
      errorTimer = null
    }
    if (popoverWindow && !popoverWindow.isDestroyed()) {
      popoverWindow.destroy()
    }
    tray.destroy()
  }

  app.on('before-quit', destroy)

  return {
    setRecordingState(nextIsRecording: boolean): void {
      isRecording = nextIsRecording
      applyIcon()
    },
    setProcessingState(nextIsProcessing: boolean): void {
      isProcessing = nextIsProcessing
      applyIcon()
    },
    flashError(): void {
      if (errorTimer) clearTimeout(errorTimer)
      isError = true
      applyIcon()
      logger.debug('[tray] error flash started')

      errorTimer = setTimeout(() => {
        isError = false
        errorTimer = null
        applyIcon()
        logger.debug('[tray] error flash ended')
      }, ERROR_FLASH_DURATION_MS)
    },
    updateRecentDictations(entries: DictationEntry[]): void {
      recentDictations = entries
      buildMenu()
    },
    destroy
  }
}

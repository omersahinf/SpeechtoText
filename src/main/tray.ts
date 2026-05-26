import { join } from 'node:path'
import { Menu, Tray, app, clipboard, nativeImage } from 'electron'
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

  buildMenu()
  tray.on('click', showSettingsWindow)

  const destroy = (): void => {
    if (isDestroyed) return
    isDestroyed = true
    if (errorTimer) {
      clearTimeout(errorTimer)
      errorTimer = null
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

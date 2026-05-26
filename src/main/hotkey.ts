import { EventEmitter } from 'node:events'
import { systemPreferences } from 'electron'
import { type UiohookKeyboardEvent, UiohookKey, uIOhook } from 'uiohook-napi'
import { logger } from './logger'
import { MAC_RIGHT_OPTION_COMPAT_KEYCODE } from '@/shared/hotkeys'

export interface HotkeyManager extends EventEmitter {
  start: () => void
  stop: () => void
  setKey: (keyCode: number) => void
  getKey: () => number
}

interface HotkeyManagerConfig {
  keyCode: number
}

const DEBOUNCE_MS = 50

function isAccessibilityTrusted(): boolean {
  if (process.platform !== 'darwin') {
    return true
  }

  return systemPreferences.isTrustedAccessibilityClient(false)
}

function getDefaultHotkeyKeyCode(): number {
  return UiohookKey.AltRight
}

function shouldAcceptMacCompatibilityCode(
  configuredKeyCode: number,
  eventKeyCode: number
): boolean {
  if (process.platform !== 'darwin') {
    return false
  }

  if (
    configuredKeyCode !== UiohookKey.AltRight &&
    configuredKeyCode !== MAC_RIGHT_OPTION_COMPAT_KEYCODE
  ) {
    return false
  }

  return eventKeyCode === UiohookKey.AltRight || eventKeyCode === MAC_RIGHT_OPTION_COMPAT_KEYCODE
}

export function createHotkeyManager(config?: Partial<HotkeyManagerConfig>): HotkeyManager {
  const emitter = new EventEmitter() as HotkeyManager

  let keyCode = config?.keyCode ?? getDefaultHotkeyKeyCode()
  let isStarted = false
  let isPressed = false
  let lastPressAt = 0

  const matchesConfiguredKey = (eventKeyCode: number): boolean => {
    return eventKeyCode === keyCode || shouldAcceptMacCompatibilityCode(keyCode, eventKeyCode)
  }

  const handleKeyDown = (event: UiohookKeyboardEvent): void => {
    if (!matchesConfiguredKey(event.keycode)) {
      return
    }

    const now = Date.now()
    if (isPressed || now - lastPressAt < DEBOUNCE_MS) {
      return
    }

    isPressed = true
    lastPressAt = now
    emitter.emit('press', event)
  }

  const handleKeyUp = (event: UiohookKeyboardEvent): void => {
    if (!matchesConfiguredKey(event.keycode) || !isPressed) {
      return
    }

    isPressed = false
    emitter.emit('release', event)
  }

  emitter.start = (): void => {
    if (isStarted) {
      return
    }

    if (!isAccessibilityTrusted()) {
      logger.warn(
        '[hotkey] macOS Accessibility izni yok. System Settings > Privacy & Security > Accessibility altindan izin verilmeli.'
      )
      return
    }

    uIOhook.on('keydown', handleKeyDown)
    uIOhook.on('keyup', handleKeyUp)
    try {
      const startResult = uIOhook.start() as unknown
      const maybePromise = startResult as Promise<void>
      if (typeof maybePromise?.then === 'function') {
        void maybePromise
          .then(() => {
            isStarted = true
            logger.info(`[hotkey] listening keyCode=${keyCode}`)
          })
          .catch((error: unknown) => {
            uIOhook.off('keydown', handleKeyDown)
            uIOhook.off('keyup', handleKeyUp)
            logger.warn('[hotkey] uiohook baslatilamadi.', error)
          })
        return
      }
    } catch (error) {
      uIOhook.off('keydown', handleKeyDown)
      uIOhook.off('keyup', handleKeyUp)
      logger.warn('[hotkey] uiohook baslatilamadi.', error)
      return
    }

    isStarted = true
    logger.info(`[hotkey] listening keyCode=${keyCode}`)
  }

  emitter.stop = (): void => {
    if (!isStarted) {
      return
    }

    uIOhook.off('keydown', handleKeyDown)
    uIOhook.off('keyup', handleKeyUp)
    uIOhook.stop()
    isStarted = false
    isPressed = false
  }

  emitter.setKey = (nextKeyCode: number): void => {
    keyCode = nextKeyCode
    isPressed = false
    logger.info(`[hotkey] key changed keyCode=${keyCode}`)
  }

  emitter.getKey = (): number => keyCode

  return emitter
}

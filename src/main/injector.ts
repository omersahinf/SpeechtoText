import { clipboard, systemPreferences } from 'electron'
import { Key, keyboard } from '@nut-tree-fork/nut-js'
import { logger } from './logger'

const CLIPBOARD_RESTORE_DELAY_MS = 250
const PASTE_VERIFY_DELAY_MS = 30
const KEY_AUTO_DELAY_MS = 20

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getPasteModifier(): Key {
  return process.platform === 'darwin' ? Key.LeftSuper : Key.LeftControl
}

export class AccessibilityNotGrantedError extends Error {
  constructor() {
    super('macOS Accessibility permission is required for text injection')
    this.name = 'AccessibilityNotGrantedError'
  }
}

function ensureAccessibility(): void {
  if (process.platform !== 'darwin') {
    return
  }

  if (!systemPreferences.isTrustedAccessibilityClient(false)) {
    logger.warn('[injector] Accessibility izni yok — inject iptal ediliyor')
    throw new AccessibilityNotGrantedError()
  }
}

async function pasteUsingClipboard(): Promise<void> {
  const pasteModifier = getPasteModifier()
  keyboard.config.autoDelayMs = KEY_AUTO_DELAY_MS
  await keyboard.pressKey(pasteModifier, Key.V)
  await keyboard.releaseKey(pasteModifier, Key.V)
}

export async function injectText(text: string): Promise<void> {
  if (!text) {
    return
  }

  ensureAccessibility()

  const previousClipboardText = clipboard.readText()
  clipboard.writeText(text)

  // Clipboard yazımının gerçekten oturduğunu doğrula.
  await sleep(PASTE_VERIFY_DELAY_MS)
  if (clipboard.readText() !== text) {
    clipboard.writeText(previousClipboardText)
    throw new Error('Clipboard write verification failed')
  }

  try {
    await pasteUsingClipboard()
    await sleep(CLIPBOARD_RESTORE_DELAY_MS)
  } finally {
    clipboard.writeText(previousClipboardText)
  }
}

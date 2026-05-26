export interface HotkeyOption {
  label: string
  shortLabel: string
  keyCode: number
  aliases?: number[]
  /** Bu seçenek hangi platformda görünmeli? Yoksa hepsinde. */
  platforms?: Array<NodeJS.Platform>
}

/** macOS için tipik Right Option key. Bazı macOS sürümleri 3677 ile rapor eder. */
export const MAC_RIGHT_OPTION_COMPAT_KEYCODE = 3677

/**
 * Tüm desteklenen kısayollar. Platform filtresi için `getHotkeyOptions(platform)` kullan.
 *
 * Not: macOS'ta F-tuşları "fn" gerektirir; Windows'ta ise doğrudan basılabilirler.
 */
const ALL_OPTIONS: HotkeyOption[] = [
  // macOS
  {
    label: 'Right Option / Alt',
    shortLabel: '⌥ Option',
    keyCode: 3640,
    aliases: [MAC_RIGHT_OPTION_COMPAT_KEYCODE],
    platforms: ['darwin']
  },
  {
    label: 'Right Control',
    shortLabel: '⌃ Control',
    keyCode: 3613,
    platforms: ['darwin', 'win32', 'linux']
  },
  {
    label: 'Right Command',
    shortLabel: '⌘ Command',
    keyCode: 3676,
    platforms: ['darwin']
  },

  // Windows / Linux
  {
    label: 'Right Alt (AltGr)',
    shortLabel: 'Right Alt',
    keyCode: 3640,
    platforms: ['win32', 'linux']
  },
  {
    label: 'Right Win',
    shortLabel: '⊞ Win',
    keyCode: 3676,
    platforms: ['win32']
  },
  {
    label: 'Pause / Break',
    shortLabel: 'Pause',
    keyCode: 3653,
    platforms: ['win32', 'linux']
  },

  // F-tuşları her platformda
  { label: 'F8', shortLabel: 'F8', keyCode: 66 },
  { label: 'F9', shortLabel: 'F9', keyCode: 67 },
  { label: 'F10', shortLabel: 'F10', keyCode: 68 },
  { label: 'F12', shortLabel: 'F12', keyCode: 88 }
]

/**
 * Çalışma ortamının platformunu güvenli şekilde tespit eder.
 * Electron main'de `process.platform` var; renderer'da (contextIsolation+sandbox) `process`
 * tanımsızdır, bu yüzden navigator.userAgent'a düşüyoruz.
 */
function detectPlatform(): NodeJS.Platform {
  if (typeof process !== 'undefined' && typeof process.platform === 'string') {
    return process.platform
  }

  if (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string') {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('mac')) return 'darwin'
    if (ua.includes('win')) return 'win32'
    if (ua.includes('linux')) return 'linux'
  }

  return 'darwin'
}

export function getHotkeyOptions(platform: NodeJS.Platform = detectPlatform()): HotkeyOption[] {
  return ALL_OPTIONS.filter((option) => !option.platforms || option.platforms.includes(platform))
}

/** Geri uyumluluk: eski import yolu. Sadece çalışılan platformun seçeneklerini döndürür. */
export const HOTKEY_OPTIONS: HotkeyOption[] = getHotkeyOptions()

function findHotkeyOption(keyCode: number): HotkeyOption | undefined {
  return ALL_OPTIONS.find(
    (option) => option.keyCode === keyCode || option.aliases?.includes(keyCode)
  )
}

export function getHotkeyLabel(keyCode: number): string {
  return findHotkeyOption(keyCode)?.label ?? `Tuş #${keyCode}`
}

export function getHotkeyShortLabel(keyCode: number): string {
  return findHotkeyOption(keyCode)?.shortLabel ?? `#${keyCode}`
}

/** Platform için varsayılan kısayol (mac → Right Option, diğer → Right Alt). */
export function getDefaultHotkeyKeyCode(platform: NodeJS.Platform = detectPlatform()): number {
  return platform === 'darwin' ? 3640 : 3640
}

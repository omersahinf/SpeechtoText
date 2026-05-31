import type {
  AppSettings,
  AppearanceAccent,
  AppearanceFont,
  AppearanceMetaphor,
  AppearanceMode
} from '@/shared/types'

export const PALETTES = {
  green: { hero: '#34d399', soft: '#6ee7b7', deep: '#059669', glowRgb: '52,211,153' },
  amber: { hero: '#f59e0b', soft: '#fcd34d', deep: '#b45309', glowRgb: '245,158,11' },
  indigo: { hero: '#6366f1', soft: '#a5b4fc', deep: '#4338ca', glowRgb: '99,102,241' },
  red: { hero: '#e11d48', soft: '#fb7185', deep: '#9f1239', glowRgb: '225,29,72' }
} as const

export const MODES = {
  dark: {
    bg: '#0a0a0c',
    bgDeep: '#050507',
    surface: 'rgba(28,28,30,0.86)',
    surfaceSolid: '#1c1c1e',
    surface2: 'rgba(255,255,255,0.045)',
    surface3: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.18)',
    text: 'rgba(255,255,255,0.94)',
    textDim: 'rgba(255,255,255,0.66)',
    textFaint: 'rgba(255,255,255,0.42)',
    shadowSoft: '0 8px 32px rgba(0,0,0,0.34), 0 2px 8px rgba(0,0,0,0.20)',
    shadowHard: '0 20px 60px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.32)'
  },
  light: {
    bg: '#f4f1ec',
    bgDeep: '#ebe7df',
    surface: 'rgba(255,255,255,0.92)',
    surfaceSolid: '#ffffff',
    surface2: 'rgba(20,18,15,0.04)',
    surface3: 'rgba(20,18,15,0.08)',
    border: 'rgba(20,18,15,0.10)',
    borderStrong: 'rgba(20,18,15,0.20)',
    text: 'rgba(24,22,18,0.94)',
    textDim: 'rgba(24,22,18,0.64)',
    textFaint: 'rgba(24,22,18,0.42)',
    shadowSoft: '0 8px 32px rgba(20,18,15,0.10), 0 2px 8px rgba(20,18,15,0.06)',
    shadowHard: '0 20px 60px rgba(20,18,15,0.16), 0 4px 16px rgba(20,18,15,0.08)'
  }
} as const

export const FONTS = {
  system:
    'ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
  geist: '"Geist", "Inter Tight", ui-sans-serif, system-ui, sans-serif',
  serif: '"Newsreader", "Source Serif 4", Georgia, "Times New Roman", serif'
} as const

export interface AppearanceSettings {
  appearanceAccent: AppearanceAccent
  appearanceMode: AppearanceMode
  appearanceMetaphor: AppearanceMetaphor
  appearanceFont: AppearanceFont
  radiusScale: number
}

export interface AppearanceTheme {
  accent: (typeof PALETTES)[AppearanceAccent]
  mode: (typeof MODES)[AppearanceMode]
  font: string
  radius: Record<'sm' | 'md' | 'lg' | 'xl' | 'pill', number>
  isDark: boolean
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  appearanceAccent: 'indigo',
  appearanceMode: 'dark',
  appearanceMetaphor: 'wave',
  appearanceFont: 'system',
  radiusScale: 1
}

export function getAppearance(
  settings: Partial<AppSettings> | null | undefined
): AppearanceSettings {
  return {
    appearanceAccent: settings?.appearanceAccent ?? DEFAULT_APPEARANCE.appearanceAccent,
    appearanceMode: settings?.appearanceMode ?? DEFAULT_APPEARANCE.appearanceMode,
    appearanceMetaphor: settings?.appearanceMetaphor ?? DEFAULT_APPEARANCE.appearanceMetaphor,
    appearanceFont: settings?.appearanceFont ?? DEFAULT_APPEARANCE.appearanceFont,
    radiusScale: settings?.radiusScale ?? DEFAULT_APPEARANCE.radiusScale
  }
}

export function getRadius(scale: number): Record<'sm' | 'md' | 'lg' | 'xl' | 'pill', number> {
  const r = Math.min(1.8, Math.max(0.4, scale))
  return {
    sm: Math.round(4 * r),
    md: Math.round(8 * r),
    lg: Math.round(14 * r),
    xl: Math.round(20 * r),
    pill: 999
  }
}

export function buildAppearanceTheme(
  settings: Partial<AppSettings> | AppearanceSettings
): AppearanceTheme {
  const appearance = getAppearance(settings as Partial<AppSettings>)

  return {
    accent: PALETTES[appearance.appearanceAccent],
    mode: MODES[appearance.appearanceMode],
    font: FONTS[appearance.appearanceFont],
    radius: getRadius(appearance.radiusScale),
    isDark: appearance.appearanceMode === 'dark'
  }
}

export function applyAppearance(settings: Partial<AppSettings> | AppearanceSettings): void {
  if (typeof document === 'undefined') {
    return
  }

  const appearance = getAppearance(settings as Partial<AppSettings>)
  const mode = MODES[appearance.appearanceMode]
  const accent = PALETTES[appearance.appearanceAccent]
  const font = FONTS[appearance.appearanceFont]
  const radius = getRadius(appearance.radiusScale)
  const root = document.documentElement

  root.dataset.mode = appearance.appearanceMode
  root.dataset.accent = appearance.appearanceAccent
  root.dataset.font = appearance.appearanceFont
  root.style.setProperty('--sd-bg', mode.bg)
  root.style.setProperty('--sd-bg-deep', mode.bgDeep)
  root.style.setProperty('--sd-surface', mode.surface)
  root.style.setProperty('--sd-surface-solid', mode.surfaceSolid)
  root.style.setProperty('--sd-surface-2', mode.surface2)
  root.style.setProperty('--sd-surface-3', mode.surface3)
  root.style.setProperty('--sd-border', mode.border)
  root.style.setProperty('--sd-border-strong', mode.borderStrong)
  root.style.setProperty('--sd-text', mode.text)
  root.style.setProperty('--sd-text-dim', mode.textDim)
  root.style.setProperty('--sd-text-faint', mode.textFaint)
  root.style.setProperty('--sd-shadow-soft', mode.shadowSoft)
  root.style.setProperty('--sd-shadow-hard', mode.shadowHard)
  root.style.setProperty('--sd-accent-hero', accent.hero)
  root.style.setProperty('--sd-accent-soft', accent.soft)
  root.style.setProperty('--sd-accent-deep', accent.deep)
  root.style.setProperty('--sd-accent-glow-rgb', accent.glowRgb)
  root.style.setProperty('--sd-font', font)
  root.style.setProperty('--sd-radius-sm', `${radius.sm}px`)
  root.style.setProperty('--sd-radius-md', `${radius.md}px`)
  root.style.setProperty('--sd-radius-lg', `${radius.lg}px`)
  root.style.setProperty('--sd-radius-xl', `${radius.xl}px`)
  root.style.setProperty('--sd-radius-pill', `${radius.pill}px`)
  root.style.colorScheme = appearance.appearanceMode
}

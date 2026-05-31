import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode
} from 'react'
import type { AppSettings, AppSettingsUpdate } from '@/shared/types'
import {
  applyAppearance,
  DEFAULT_APPEARANCE,
  getAppearance,
  type AppearanceSettings
} from '@/renderer/styles/tokens'

interface AppearanceContextValue {
  appearance: AppearanceSettings
  setAppearance: (patch: Partial<AppearanceSettings>) => Promise<void>
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

interface AppearanceProviderProps {
  initialSettings?: AppSettings | null
  children: ReactNode
}

export function AppearanceProvider({
  initialSettings,
  children
}: AppearanceProviderProps): ReactElement {
  const [appearance, setAppearanceState] = useState<AppearanceSettings>(
    initialSettings ? getAppearance(initialSettings) : DEFAULT_APPEARANCE
  )

  useEffect(() => {
    applyAppearance(appearance)
  }, [appearance])

  useEffect(() => {
    if (initialSettings) {
      setAppearanceState(getAppearance(initialSettings))
    }
  }, [initialSettings])

  useEffect(() => {
    const unsubscribe = window.api.settings.onChanged((settings) => {
      setAppearanceState(getAppearance(settings))
    })
    return unsubscribe
  }, [])

  const value = useMemo<AppearanceContextValue>(
    () => ({
      appearance,
      async setAppearance(patch) {
        const next = { ...appearance, ...patch }
        setAppearanceState(next)
        await window.api.settings.set(next as AppSettingsUpdate)
      }
    }),
    [appearance]
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error('useAppearance must be used inside AppearanceProvider')
  }
  return context
}

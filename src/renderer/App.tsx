import { useEffect, useState, type ReactElement } from 'react'
import type { AppSettings } from '@/shared/types'
import Onboarding from '@/renderer/pages/Onboarding'
import Settings from '@/renderer/pages/Settings'

export default function App(): ReactElement {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    void window.api.settings.get().then(setSettings)
  }, [])

  if (!settings) {
    return <main className="min-h-screen bg-neutral-950" />
  }

  if (!settings.onboardingCompleted) {
    return (
      <Onboarding
        initialSettings={settings}
        onComplete={() =>
          setSettings((current) => current && { ...current, onboardingCompleted: true })
        }
      />
    )
  }

  return <Settings />
}

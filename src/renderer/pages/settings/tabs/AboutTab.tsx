import { useState, useEffect, type ReactElement } from 'react'

export function AboutTab(): ReactElement {
  const [version, setVersion] = useState('')

  useEffect(() => {
    void window.api.app.getVersion().then(setVersion)
  }, [])

  async function restartOnboarding(): Promise<void> {
    await window.api.settings.set({ onboardingCompleted: false })
    await window.api.app.relaunch()
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Hakkında</h2>
        <p className="mt-1 text-sm text-neutral-500">Uygulama bilgileri</p>
      </div>

      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-4">
        <dl className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <dt className="text-neutral-400">Versiyon</dt>
            <dd className="font-mono text-neutral-300">{version || '0.1.0'}</dd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <dt className="text-neutral-400">Platform</dt>
            <dd className="text-neutral-300">{navigator.platform || 'Unknown'}</dd>
          </div>
        </dl>

        <div className="border-t border-neutral-800/40 pt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-10 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100"
            onClick={() => void window.api.app.openLogDir()}
          >
            📂 Logları Aç
          </button>
          <button
            type="button"
            className="h-10 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100"
            onClick={() => void restartOnboarding()}
          >
            Tanıtımı Tekrar Göster
          </button>
          <a
            href="https://github.com/omersahin/sesli-dikte"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center rounded-lg border border-neutral-700 px-4 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}

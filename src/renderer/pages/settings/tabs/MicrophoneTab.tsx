import { useState, useEffect, type ReactElement } from 'react'
import type { AppSettings, MicrophoneDevice } from '@/shared/types'
import { rendererLogger } from '@/renderer/lib/logger'

interface MicrophoneTabProps {
  settings: AppSettings
  onChange: (patch: Partial<AppSettings>) => void
}

export function MicrophoneTab({ settings, onChange }: MicrophoneTabProps): ReactElement {
  const [microphones, setMicrophones] = useState<MicrophoneDevice[]>([])
  const [micListStatus, setMicListStatus] = useState('')

  const refreshMics = async (showStatus = false): Promise<void> => {
    if (showStatus) setMicListStatus('Mikrofon listesi güncelleniyor...')
    try {
      const mics = await window.api.settings.getAvailableMics()
      setMicrophones(mics)
      if (
        settings.microphoneDeviceId &&
        !mics.some((m) => m.deviceId === settings.microphoneDeviceId)
      ) {
        onChange({ microphoneDeviceId: '' })
      }
      if (showStatus) {
        setMicListStatus('Mikrofon listesi güncellendi.')
        setTimeout(() => setMicListStatus(''), 2500)
      }
    } catch (e: unknown) {
      rendererLogger.error('[MicrophoneTab] mic list refresh failed', e)
      setMicListStatus('Mikrofon listesi güncellenemedi.')
    }
  }

  useEffect(() => {
    void refreshMics()

    if (!navigator.mediaDevices?.addEventListener) return

    let timer: number | null = null
    const handleChange = (): void => {
      if (timer !== null) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = null
        void refreshMics(true)
      }, 350)
    }

    navigator.mediaDevices.addEventListener('devicechange', handleChange)
    const interval = window.setInterval(() => void refreshMics(), 3000)

    return () => {
      if (timer !== null) window.clearTimeout(timer)
      navigator.mediaDevices.removeEventListener('devicechange', handleChange)
      window.clearInterval(interval)
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Mikrofon</h2>
        <p className="mt-1 text-sm text-neutral-500">Kayıt cihazı seçimi</p>
      </div>

      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6">
        <label className="grid gap-2 text-sm">
          <span className="text-neutral-300 font-medium">Kayıt cihazı</span>
          <select
            value={settings.microphoneDeviceId}
            aria-label="Kayıt cihazı"
            className="h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-neutral-100 outline-none transition focus:border-sd-accent"
            onChange={(e) => onChange({ microphoneDeviceId: e.target.value })}
          >
            <option value="">Sistem varsayılanı</option>
            {microphones.map((m) => (
              <option key={m.deviceId} value={m.deviceId}>
                {m.label}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-neutral-500">
              {micListStatus || 'Cihaz takıp çıkarınca liste otomatik yenilenir.'}
            </span>
            <button
              type="button"
              className="h-8 rounded-md border border-neutral-700 px-3 text-xs text-neutral-300 transition hover:border-neutral-500"
              onClick={() => void refreshMics(true)}
            >
              Yenile
            </button>
          </div>
        </label>
      </div>
    </div>
  )
}

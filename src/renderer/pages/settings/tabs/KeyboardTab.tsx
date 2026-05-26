import type { ReactElement } from 'react'
import type { AppSettings, HotkeyMode } from '@/shared/types'
import { HotkeyRecorder } from '@/renderer/components/HotkeyRecorder'

interface KeyboardTabProps {
  settings: AppSettings
  onChange: (patch: Partial<AppSettings>) => void
}

export function KeyboardTab({ settings, onChange }: KeyboardTabProps): ReactElement {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Klavye Ayarları</h2>
        <p className="mt-1 text-sm text-neutral-500">Kısayol tuşu ve dikte modu</p>
      </div>

      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-6">
        <label className="grid gap-3 text-sm">
          <span className="text-neutral-300 font-medium">Hotkey</span>
          <HotkeyRecorder
            value={settings.hotkeyKeyCode}
            onChange={(hotkeyKeyCode) => onChange({ hotkeyKeyCode })}
          />
        </label>

        <div className="grid gap-3" role="radiogroup" aria-label="Dikte modu">
          <span className="text-sm text-neutral-300 font-medium">Dikte modu</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              role="radio"
              aria-checked={settings.hotkeyMode === 'push-to-talk'}
              className={`rounded-lg border p-4 text-left text-sm transition ${
                settings.hotkeyMode === 'push-to-talk'
                  ? 'border-emerald-400/40 bg-emerald-400/5 text-emerald-300'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
              }`}
              onClick={() => onChange({ hotkeyMode: 'push-to-talk' as HotkeyMode })}
            >
              <p className="font-medium">Push-to-talk</p>
              <p className="mt-1 text-xs opacity-70">Basılı tut → konuş → bırak</p>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={settings.hotkeyMode === 'toggle'}
              className={`rounded-lg border p-4 text-left text-sm transition ${
                settings.hotkeyMode === 'toggle'
                  ? 'border-emerald-400/40 bg-emerald-400/5 text-emerald-300'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
              }`}
              onClick={() => onChange({ hotkeyMode: 'toggle' as HotkeyMode })}
            >
              <p className="font-medium">Toggle</p>
              <p className="mt-1 text-xs opacity-70">Bas → konuş → tekrar bas</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

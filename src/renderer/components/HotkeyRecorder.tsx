import { useEffect, useRef, useState, type ReactElement } from 'react'
import { getHotkeyLabel, HOTKEY_OPTIONS } from '@/shared/hotkeys'

interface HotkeyRecorderProps {
  value: number
  onChange: (keyCode: number) => void
}

const DOM_TO_UIOHOOK: Record<string, number> = {
  AltRight: 3640,
  ControlRight: 3613,
  MetaRight: 3676,
  Pause: 3653,
  F8: 66,
  F9: 67,
  F10: 68,
  F12: 88
}

function mapDomEventToUiohookKeyCode(event: React.KeyboardEvent<HTMLButtonElement>): number | null {
  return DOM_TO_UIOHOOK[event.code] ?? null
}

export function HotkeyRecorder({ value, onChange }: HotkeyRecorderProps): ReactElement {
  const [testState, setTestState] = useState<'idle' | 'listening' | 'detected'>('idle')
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => () => stopRef.current?.(), [])

  function startTest(): void {
    stopRef.current?.()
    setTestState('listening')

    const onKey = (event: KeyboardEvent): void => {
      const keyCode = DOM_TO_UIOHOOK[event.code]
      if (keyCode === value) {
        event.preventDefault()
        setTestState('detected')
        window.setTimeout(() => setTestState('idle'), 1500)
        stopRef.current?.()
      }
    }

    window.addEventListener('keydown', onKey)
    const timeout = window.setTimeout(() => {
      if (stopRef.current) stopRef.current()
      setTestState('idle')
    }, 5000)

    stopRef.current = () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timeout)
      stopRef.current = null
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="flex h-11 w-full items-center justify-between rounded-md border border-neutral-700 bg-neutral-900 px-3 text-left text-sm text-neutral-100 outline-none transition hover:border-sd-accent focus:border-sd-accent"
        onKeyDown={(event) => {
          const keyCode = mapDomEventToUiohookKeyCode(event)
          if (keyCode) {
            event.preventDefault()
            onChange(keyCode)
          }
        }}
      >
        <span>{getHotkeyLabel(value)}</span>
        <span className="text-xs text-neutral-500">Odakla ve tuşa bas</span>
      </button>

      <div className="flex flex-wrap gap-2">
        {HOTKEY_OPTIONS.map((option) => (
          <button
            key={option.keyCode}
            type="button"
            className={`rounded-md border px-3 py-2 text-xs transition ${
              value === option.keyCode
                ? 'border-sd-accent bg-sd-accent text-neutral-950'
                : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500'
            }`}
            onClick={() => onChange(option.keyCode)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={startTest}
          disabled={testState === 'listening'}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 transition hover:border-sd-accent disabled:opacity-60"
        >
          {testState === 'listening' ? 'Kısayola bas…' : 'Şimdi dene'}
        </button>
        {testState === 'detected' && (
          <span className="text-xs text-sd-accent" role="status">
            ✓ Algılandı
          </span>
        )}
        {testState === 'idle' && (
          <span className="text-xs text-neutral-500">Tuşa basıp algılandığını doğrula</span>
        )}
      </div>
    </div>
  )
}

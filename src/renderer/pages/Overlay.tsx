import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import type { OverlayMicInfo, OverlayState, TransformMode } from '@/shared/types'
import type { AppearanceMetaphor } from '@/shared/types'
import { getHotkeyShortLabel } from '@/shared/hotkeys'
import { IdlePill } from '@/renderer/components/overlay/IdlePill'
import { MenuPanel } from '@/renderer/components/overlay/MenuPanel'
import { MicIndicator } from '@/renderer/components/overlay/MicIndicator'
import { Blob } from '@/renderer/components/overlay/Blob'
import { Dot } from '@/renderer/components/overlay/Dot'
import { Orb } from '@/renderer/components/overlay/Orb'
import { QuickEdit } from '@/renderer/components/overlay/QuickEdit'
import { Wave } from '@/renderer/components/overlay/Wave'
import { applyAppearance } from '@/renderer/styles/tokens'
import '@/renderer/components/overlay/styles.css'

function SparkleIcon(): ReactElement {
  return (
    <svg className="overlay-sparkle-icon" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M6 1l1 3.5 3.5 1L7 6.5 6 10 5 6.5 1.5 5.5l3.5-1L6 1z" />
    </svg>
  )
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default function Overlay(): ReactElement {
  const [remoteState, setRemoteState] = useState<OverlayState>('idle')
  const [isHovering, setIsHovering] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [micInfo, setMicInfo] = useState<OverlayMicInfo | null>(null)
  const [pillMessage, setPillMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('Hata')
  const [autoApply, setAutoApply] = useState(true)
  const [transformMode, setTransformMode] = useState<TransformMode>('raw')
  const [metaphor, setMetaphor] = useState<AppearanceMetaphor>('wave')
  const [hotkeyKeyCode, setHotkeyKeyCode] = useState(3640)
  const hotkeyLabel = getHotkeyShortLabel(hotkeyKeyCode)
  const [quickEditOpen, setQuickEditOpen] = useState(false)
  const [quickEditInstruction, setQuickEditInstruction] = useState('')
  const [quickEditLoading, setQuickEditLoading] = useState(false)
  const [quickEditTranscript, setQuickEditTranscript] = useState('')
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const quickEditInputRef = useRef<HTMLInputElement>(null)

  const visualState = useMemo(() => {
    if (menuOpen) {
      return 'menuOpen'
    }

    if (remoteState === 'idle' && isHovering) {
      return 'hover'
    }

    return remoteState
  }, [isHovering, menuOpen, remoteState])

  useEffect(() => {
    window.overlayApi.setMouseRegion('passthrough')

    const unsubscribeState = window.overlayApi.onState((state, detail) => {
      setRemoteState(state)

      if (state !== 'idle') {
        setMenuOpen(false)
        setPillMessage('')
      }

      if (state === 'idle' && detail?.message) {
        setPillMessage(detail.message === '\u2713' ? 'Tamam' : detail.message)
      }

      if (state === 'error') {
        setErrorMessage(detail?.message || 'Hata')
      }
    })

    const unsubscribeLevel = window.overlayApi.onLevel(setMicLevel)
    const unsubscribeMicInfo = window.overlayApi.onMicInfo((info) => {
      setMicInfo(info)
    })
    const unsubscribeSettings = window.overlayApi.onSettings((settings) => {
      setAutoApply(settings.autoApply)
      setHotkeyKeyCode(settings.hotkeyKeyCode)
      setTransformMode(settings.transformMode)
      setMetaphor(settings.appearanceMetaphor ?? 'wave')
      applyAppearance({
        appearanceAccent: settings.appearanceAccent,
        appearanceMetaphor: settings.appearanceMetaphor,
        appearanceFont: settings.appearanceFont,
        radiusScale: settings.radiusScale,
        appearanceMode: 'dark'
      })
    })

    return () => {
      unsubscribeState()
      unsubscribeLevel()
      unsubscribeMicInfo()
      unsubscribeSettings()
      window.overlayApi.setMouseRegion('passthrough')
    }
  }, [])

  useEffect(() => {
    if (remoteState === 'recording' && recordingStartedAt === null) {
      setRecordingStartedAt(Date.now())
    }

    if (remoteState !== 'recording') {
      setRecordingStartedAt(null)
    }
  }, [recordingStartedAt, remoteState])

  useEffect(() => {
    if (remoteState !== 'recording') {
      return
    }

    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [remoteState])

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return
    }

    let active = true

    const showCurrentMic = async (): Promise<void> => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const input = devices.find((device) => device.kind === 'audioinput')

      if (active && input) {
        setMicInfo({
          label: input.label || 'Varsayılan mikrofon',
          auto: true
        })
      }
    }

    void showCurrentMic()
    navigator.mediaDevices.addEventListener('devicechange', showCurrentMic)

    return () => {
      active = false
      navigator.mediaDevices.removeEventListener('devicechange', showCurrentMic)
    }
  }, [])

  useEffect(() => {
    if (!micInfo) {
      return
    }

    const timer = window.setTimeout(() => setMicInfo(null), 3000)
    return () => window.clearTimeout(timer)
  }, [micInfo])

  useEffect(() => {
    if (remoteState !== 'error') {
      return
    }

    const timer = window.setTimeout(() => setRemoteState('idle'), 5000)
    return () => window.clearTimeout(timer)
  }, [remoteState])

  useEffect(() => {
    if (!pillMessage) {
      return
    }

    const timer = window.setTimeout(() => setPillMessage(''), pillMessage === 'Tamam' ? 1200 : 5000)
    return () => window.clearTimeout(timer)
  }, [pillMessage])

  useEffect(() => {
    if (visualState !== 'hover') {
      return
    }

    const timer = window.setTimeout(() => {
      setIsHovering(false)
      if (!menuOpen) {
        window.overlayApi.setMouseRegion('passthrough')
      }
    }, 1400)

    return () => window.clearTimeout(timer)
  }, [menuOpen, visualState])

  useEffect(() => {
    const clearHover = (): void => {
      setIsHovering(false)
      if (!menuOpen) {
        window.overlayApi.setMouseRegion('passthrough')
      }
    }

    window.addEventListener('blur', clearHover)
    document.addEventListener('mouseleave', clearHover)

    return () => {
      window.removeEventListener('blur', clearHover)
      document.removeEventListener('mouseleave', clearHover)
    }
  }, [menuOpen])

  function setInteractive(): void {
    setIsHovering(true)
    window.overlayApi.setMouseRegion('interactive')
  }

  function setPassthrough(closeMenu = false): void {
    setIsHovering(false)
    if (closeMenu) {
      setMenuOpen(false)
      window.overlayApi.setMouseRegion('passthrough')
      return
    }

    if (!menuOpen) {
      window.overlayApi.setMouseRegion('passthrough')
    }
  }

  async function updateAutoApply(enabled: boolean): Promise<void> {
    setAutoApply(enabled)
    await window.overlayApi.setAutoApply(enabled)
  }

  async function updateTransformMode(mode: TransformMode): Promise<void> {
    setTransformMode(mode)
    await window.overlayApi.setTransformMode(mode)
  }

  async function openSettings(): Promise<void> {
    setMenuOpen(false)
    await window.overlayApi.openSettings()
  }

  async function openQuickEdit(): Promise<void> {
    setQuickEditOpen(true)
    window.overlayApi.setMouseRegion('interactive')
    try {
      const text = await navigator.clipboard.readText()
      setQuickEditTranscript(text)
    } catch {
      setQuickEditTranscript('')
    }
    window.setTimeout(() => quickEditInputRef.current?.focus(), 50)
  }

  function renderRecordingViz(): ReactElement {
    if (metaphor === 'orb') {
      return <Orb />
    }
    if (metaphor === 'dot') {
      return <Dot />
    }
    if (metaphor === 'blob') {
      return <Blob />
    }
    return <Wave level={micLevel} />
  }

  async function submitQuickEdit(): Promise<void> {
    if (!quickEditInstruction.trim()) return

    setQuickEditLoading(true)
    try {
      const result = await window.overlayApi.quickEdit(quickEditInstruction)
      if (result.ok && result.text) {
        await navigator.clipboard.writeText(result.text)
        setPillMessage('Düzenlendi')
      } else if (result.error) {
        setErrorMessage(result.error)
        setRemoteState('error')
      }
    } finally {
      setQuickEditLoading(false)
      setQuickEditOpen(false)
      setQuickEditInstruction('')
    }
  }

  return (
    <main className="overlay-root">
      <div className="overlay-stack">
        <MicIndicator info={micInfo} />

        {visualState === 'hover' && (
          <div className="overlay-tooltip" role="tooltip">
            <kbd className="overlay-tooltip__key">{hotkeyLabel}</kbd>
            <span className="overlay-tooltip__label">Bas ve konuş</span>
          </div>
        )}

        {menuOpen && (
          <MenuPanel
            autoApply={autoApply}
            transformMode={transformMode}
            onAutoApplyChange={(enabled) => void updateAutoApply(enabled)}
            onTransformModeChange={(mode) => void updateTransformMode(mode)}
            onOpenSettings={() => void openSettings()}
            onMouseEnter={setInteractive}
            onMouseLeave={setInteractive}
          />
        )}

        {remoteState === 'recording' && (
          <div
            className="overlay-pill overlay-pill--recording"
            role="group"
            aria-label="Kayıt"
            onMouseEnter={setInteractive}
            onMouseLeave={() => setPassthrough()}
          >
            <span className="overlay-rec-dot" aria-hidden="true" />
            {renderRecordingViz()}
            <span className="overlay-timer">
              {formatDuration(now - (recordingStartedAt ?? now))}
            </span>
            <button
              type="button"
              className="overlay-control-button overlay-stop-button"
              aria-label="Kaydı bitir"
              onClick={() => void window.overlayApi.stopRecording()}
            >
              <span className="overlay-stop-square" aria-hidden="true" />
            </button>
          </div>
        )}

        {remoteState === 'processing' && (
          <div
            className="overlay-pill overlay-pill--processing"
            role="status"
            onMouseEnter={setInteractive}
            onMouseLeave={() => setPassthrough()}
          >
            <span className="overlay-spinner" aria-hidden="true" />
            <span className="overlay-pill__label">Türkçe temizleniyor...</span>
            <SparkleIcon />
          </div>
        )}

        {remoteState === 'error' && (
          <div
            className="overlay-pill overlay-pill--error"
            role="status"
            onMouseEnter={setInteractive}
            onMouseLeave={() => setPassthrough()}
          >
            <span className="overlay-pill__label">{errorMessage}</span>
          </div>
        )}

        {(remoteState === 'idle' || remoteState === 'edit') && (
          <>
            {quickEditOpen || remoteState === 'edit' ? (
              <QuickEdit
                transcript={quickEditTranscript}
                instruction={quickEditInstruction}
                loading={quickEditLoading}
                inputRef={quickEditInputRef}
                onInstructionChange={setQuickEditInstruction}
                onMouseEnter={setInteractive}
                onCancel={() => {
                  setQuickEditOpen(false)
                  setPassthrough()
                }}
                onSubmit={() => void submitQuickEdit()}
              />
            ) : (
              <>
                <IdlePill
                  message={pillMessage}
                  onClick={() => {
                    setIsHovering(false)
                    setMenuOpen((current) => !current)
                    window.overlayApi.setMouseRegion('interactive')
                  }}
                  onMouseEnter={setInteractive}
                  onMouseLeave={() => setPassthrough()}
                />
                {pillMessage === 'Tamam' && (
                  <button
                    type="button"
                    className="overlay-quick-edit-trigger"
                    aria-label="Metni düzenle"
                    title="Son metni dönüştür"
                    onMouseEnter={setInteractive}
                    onClick={() => void openQuickEdit()}
                  >
                    Edit
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}

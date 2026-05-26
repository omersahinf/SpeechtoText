import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import type { OverlayMicInfo, OverlayState, TransformMode } from '@/shared/types'
import { getHotkeyShortLabel } from '@/shared/hotkeys'
import { IdlePill } from '@/renderer/components/overlay/IdlePill'
import { MenuPanel } from '@/renderer/components/overlay/MenuPanel'
import { MicIndicator } from '@/renderer/components/overlay/MicIndicator'
import { VoiceLine } from '@/renderer/components/overlay/VoiceLine'
import '@/renderer/components/overlay/styles.css'

function MicIcon(): ReactElement {
  return (
    <svg className="overlay-svg-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="2.5" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.75 7.5a4.25 4.25 0 0 0 8.5 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M8 12v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon(): ReactElement {
  return (
    <svg className="overlay-control-icon" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 3l6 6M9 3 3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
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
  const [transformMode, setTransformMode] = useState<TransformMode>('polish')
  const [hotkeyKeyCode, setHotkeyKeyCode] = useState(3640)
  const hotkeyLabel = getHotkeyShortLabel(hotkeyKeyCode)
  const [quickEditOpen, setQuickEditOpen] = useState(false)
  const [quickEditInstruction, setQuickEditInstruction] = useState('')
  const [quickEditLoading, setQuickEditLoading] = useState(false)
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
            <button
              type="button"
              className="overlay-control-button"
              aria-label="Kaydı iptal et"
              onClick={() => void window.overlayApi.cancelRecording()}
            >
              <CloseIcon />
            </button>
            <VoiceLine level={micLevel} />
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
            <span className="overlay-icon" aria-hidden="true">
              <MicIcon />
            </span>
            <span className="overlay-pill__label">İşleniyor</span>
            <span className="overlay-spinner" aria-hidden="true" />
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

        {remoteState === 'idle' && (
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
            {pillMessage === 'Tamam' || pillMessage === '' ? null : null}
            {/* Quick Edit Trigger — sadece başarılı inject sonrası görünür */}
            {pillMessage === 'Tamam' && !quickEditOpen && (
              <button
                type="button"
                className="overlay-quick-edit-btn"
                aria-label="Metni düzenle"
                title="Son metni dönüştür"
                onMouseEnter={setInteractive}
                onClick={() => {
                  setQuickEditOpen(true)
                  window.overlayApi.setMouseRegion('interactive')
                  window.setTimeout(() => quickEditInputRef.current?.focus(), 50)
                }}
              >
                ✎
              </button>
            )}
            {quickEditOpen && (
              <form
                className="overlay-quick-edit-panel"
                onMouseEnter={setInteractive}
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!quickEditInstruction.trim()) return
                  setQuickEditLoading(true)
                  void window.overlayApi
                    .quickEdit(quickEditInstruction)
                    .then(async (result) => {
                      if (result.ok && result.text) {
                        await navigator.clipboard.writeText(result.text)
                        setPillMessage('Düzenlendi ✓')
                      }
                    })
                    .finally(() => {
                      setQuickEditLoading(false)
                      setQuickEditOpen(false)
                      setQuickEditInstruction('')
                    })
                }}
              >
                <input
                  ref={quickEditInputRef}
                  type="text"
                  value={quickEditInstruction}
                  placeholder='Talimat: "daha resmi yap"'
                  className="overlay-quick-edit-input"
                  disabled={quickEditLoading}
                  onChange={(e) => setQuickEditInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setQuickEditOpen(false)
                      setPassthrough()
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={quickEditLoading || !quickEditInstruction.trim()}
                  className="overlay-quick-edit-submit"
                >
                  {quickEditLoading ? '…' : '→'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  )
}

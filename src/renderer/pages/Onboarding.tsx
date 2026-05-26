import { useEffect, useRef, useState, type ReactElement } from 'react'
import type { AppSettings, PermissionSnapshot } from '@/shared/types'
import { HotkeyRecorder } from '@/renderer/components/HotkeyRecorder'
import { StepIndicator } from '@/renderer/components/StepIndicator'
import { MicLevelMeter } from '@/renderer/components/MicLevelMeter'
import { getPermissionLabel } from '@/renderer/lib/permission-labels'

interface OnboardingProps {
  initialSettings: AppSettings
  onComplete: () => void
}

const STEPS = ['Hoşgeldin', 'Mikrofon', 'Erişim', 'API', 'Hotkey', 'İlk Dikte']

// Simple inline SVG illustrations
function WelcomeIllustration(): ReactElement {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 text-emerald-400" fill="none">
      <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="2" opacity="0.15" />
      <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path
        d="M60 30v60M45 50l15-20 15 20M45 70l15 20 15-20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MicrophoneIllustration(): ReactElement {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 text-emerald-400" fill="none">
      <rect x="44" y="20" width="32" height="52" rx="16" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M32 62a28 28 0 0056 0"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="90"
        x2="60"
        y2="105"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="46"
        y1="105"
        x2="74"
        y2="105"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Sound waves */}
      <path
        d="M84 45a12 12 0 010 22"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
        strokeLinecap="round"
      />
      <path
        d="M90 38a22 22 0 010 36"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AccessibilityIllustration(): ReactElement {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 text-emerald-400" fill="none">
      <circle cx="60" cy="32" r="10" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M38 52h44M60 52v30M44 100l16-18 16 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 60a40 40 0 0180 0"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function KeyIllustration(): ReactElement {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 text-emerald-400" fill="none">
      <rect x="20" y="40" width="80" height="45" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <rect
        x="42"
        y="52"
        width="36"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.6"
      />
      <rect
        x="30"
        y="52"
        width="8"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <rect
        x="82"
        y="52"
        width="8"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <rect
        x="35"
        y="68"
        width="50"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
    </svg>
  )
}

function ApiIllustration(): ReactElement {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 text-emerald-400" fill="none">
      <rect x="25" y="30" width="70" height="60" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="55" r="3" fill="currentColor" opacity="0.6" />
      <path
        d="M45 70h30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M40 50l-8-12M80 50l8-12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <circle cx="32" cy="35" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="88" cy="35" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    </svg>
  )
}

function TestIllustration(): ReactElement {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 text-emerald-400" fill="none">
      <circle cx="60" cy="60" r="36" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M48 60l8 8 16-16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sparkles */}
      <path d="M90 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor" opacity="0.3" />
      <path
        d="M24 80l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z"
        fill="currentColor"
        opacity="0.2"
      />
    </svg>
  )
}

const ILLUSTRATIONS = [
  WelcomeIllustration,
  MicrophoneIllustration,
  AccessibilityIllustration,
  ApiIllustration,
  KeyIllustration,
  TestIllustration
]

interface OnboardingHotkeyStepProps {
  hotkeyKeyCode: number
  onChange: (code: number) => void
}

const DOM_KEY_MAP: Record<string, number> = {
  AltRight: 3640,
  ControlRight: 3613,
  MetaRight: 3676,
  F8: 66,
  F9: 67,
  F10: 68,
  F12: 88
}

function OnboardingHotkeyStep({
  hotkeyKeyCode,
  onChange
}: OnboardingHotkeyStepProps): ReactElement {
  const [testState, setTestState] = useState<'idle' | 'listening' | 'ok'>('idle')
  const stopRef = useRef<(() => void) | null>(null)

  function startTest(): void {
    stopRef.current?.()
    setTestState('listening')

    const onKey = (e: KeyboardEvent): void => {
      const code = DOM_KEY_MAP[e.code]
      if (code === hotkeyKeyCode) {
        e.preventDefault()
        setTestState('ok')
        window.setTimeout(() => setTestState('idle'), 2000)
        stopRef.current?.()
      }
    }
    window.addEventListener('keydown', onKey)
    const timer = window.setTimeout(() => {
      stopRef.current?.()
      setTestState('idle')
    }, 5000)
    stopRef.current = () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timer)
      stopRef.current = null
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold tracking-tight">Hotkey seçimi</h2>
      <p className="mt-4 text-sm leading-7 text-neutral-400">
        Dikte başlatmak için bir kısayol tuşu seç. Varsayılan: <strong>Right Option / Alt</strong>.
        Basılı tutarak konuşursun, bırakınca metin yazılır.
      </p>
      <div className="mt-6 max-w-xl">
        <HotkeyRecorder value={hotkeyKeyCode} onChange={onChange} />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={startTest}
          disabled={testState === 'listening'}
          className="h-10 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-300 transition hover:border-emerald-400 disabled:opacity-60"
        >
          {testState === 'listening' ? 'Kısayola bas…' : '→ Şimdi test et'}
        </button>
        {testState === 'ok' && (
          <span className="text-sm font-medium text-emerald-400" role="status">
            ✓ Algılandı!
          </span>
        )}
        {testState === 'idle' && (
          <span className="text-xs text-neutral-600">Tuşa basarak çalıştığını doğrula</span>
        )}
      </div>
    </div>
  )
}

export default function Onboarding({ initialSettings, onComplete }: OnboardingProps): ReactElement {
  const [step, setStep] = useState(0)
  const [settings, setSettings] = useState<AppSettings>(initialSettings)
  const [permissions, setPermissions] = useState<PermissionSnapshot | null>(null)
  const [status, setStatus] = useState('')
  const [accessibilityJustGranted, setAccessibilityJustGranted] = useState(false)

  useEffect(() => {
    void window.api.permissions.check().then(setPermissions)
  }, [])

  // P1: Listen for accessibility permission granted event
  useEffect(() => {
    const unsubscribe = window.api.permissions.onAccessibilityGranted(() => {
      setAccessibilityJustGranted(true)
      void window.api.permissions.check().then(setPermissions)
    })

    return unsubscribe
  }, [])

  async function requestMicrophone(): Promise<void> {
    const nextPermissions = await window.api.permissions.requestMicrophone()
    setPermissions(nextPermissions)
  }

  async function refreshPermissions(): Promise<void> {
    const nextPermissions = await window.api.permissions.check()
    setPermissions(nextPermissions)
  }

  async function handleRelaunch(): Promise<void> {
    await window.api.app.relaunch()
  }

  async function finish(): Promise<void> {
    setStatus('')

    try {
      await window.api.settings.set({
        ...settings,
        onboardingCompleted: true
      })
      onComplete()
    } catch (error) {
      console.error(error)
      setStatus('Onboarding tamamlanamadı.')
    }
  }

  const canContinueApi = Boolean(settings.groqApiKey.trim() && settings.dashscopeApiKey.trim())
  const Illustration = ILLUSTRATIONS[step] ?? WelcomeIllustration
  const micPermission = getPermissionLabel(permissions?.microphone ?? 'unknown')
  const accPermission = getPermissionLabel(permissions?.accessibility ?? 'denied')

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-emerald-400">
              Sesli Dikte
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Kurulum</h1>
          </div>
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-xs text-neutral-500 transition hover:text-neutral-300"
            onClick={() => {
              if (
                window.confirm(
                  'API anahtarları girilmeden uygulama çalışmaz. Kurulumu atlamak istediğinden emin misin?'
                )
              ) {
                void finish()
              }
            }}
          >
            Sonra ›
          </button>
        </div>

        {/* Step Indicator */}
        <div className="mt-6">
          <StepIndicator steps={STEPS} currentStep={step} onStepClick={setStep} />
        </div>

        {/* Content */}
        <div className="mt-8 flex flex-1 flex-col rounded-xl border border-neutral-800/60 bg-neutral-900/50 backdrop-blur-sm">
          <div className="flex flex-1 items-start gap-10 p-8 max-md:flex-col">
            {/* Left: Illustration */}
            <div className="flex w-36 shrink-0 items-start justify-center pt-4 max-md:w-full max-md:pb-4">
              <div className="animate-fade-in">
                <Illustration />
              </div>
            </div>

            {/* Right: Content */}
            <div className="flex-1">
              {/* Step 0: Hoşgeldin */}
              {step === 0 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Türkçe dikte akışını hazırlayalım
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400">
                    Birkaç adımda uygulamayı kuracağız. Hotkey ile kayıt al, Groq Whisper ile metne
                    çevir, Qwen ile Türkçe noktalama ve dolgu temizliği yap — hepsi otomatik. ✨
                  </p>
                  <div className="mt-6 flex flex-col gap-3 rounded-lg border border-neutral-800/40 bg-neutral-950/50 p-4 text-sm text-neutral-500">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-xs text-emerald-400">
                        1
                      </span>
                      <span>Mikrofon ve Accessibility izinleri</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-xs text-emerald-400">
                        2
                      </span>
                      <span>API anahtarlarını gir</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-xs text-emerald-400">
                        3
                      </span>
                      <span>Hotkey seç ve ilk dikteni yap</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Mikrofon */}
              {step === 1 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-semibold tracking-tight">Mikrofon erişimi</h2>
                  <p className="mt-4 text-sm leading-7 text-neutral-400">
                    Sesini duyabilmem için mikrofon erişimi gerekli. Aşağıdaki butona tıklayarak
                    izin verebilirsin.
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <button
                      type="button"
                      className="h-11 rounded-lg bg-emerald-400 px-5 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300 active:scale-[0.98]"
                      onClick={() => void requestMicrophone()}
                    >
                      Mikrofon İzni İste
                    </button>
                    <span className={`text-sm font-medium ${micPermission.color}`}>
                      {micPermission.text}
                    </span>
                  </div>
                  {permissions?.microphone === 'granted' && (
                    <div className="mt-6">
                      <MicLevelMeter isActive deviceId={settings.microphoneDeviceId || undefined} />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Accessibility */}
              {step === 2 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-semibold tracking-tight">Accessibility izni</h2>
                  <p className="mt-4 text-sm leading-7 text-neutral-400">
                    Konuşmanı yazıya çevirip aktif uygulamana yazabilmem için bu izin şart. macOS,
                    bu iznin elle verilmesini gerektirir.
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <span className={`text-sm font-medium ${accPermission.color}`}>
                      {accPermission.text}
                    </span>
                  </div>

                  {permissions?.accessibility !== 'granted' && (
                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        className="h-11 rounded-lg bg-emerald-400 px-5 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300 active:scale-[0.98]"
                        onClick={() => void window.api.permissions.openAccessibilitySettings()}
                      >
                        Ayarları Aç
                      </button>
                      <button
                        type="button"
                        className="h-11 rounded-lg border border-neutral-700 px-4 text-sm text-neutral-300 transition hover:border-neutral-500"
                        onClick={() => void refreshPermissions()}
                      >
                        Tekrar Kontrol Et
                      </button>
                    </div>
                  )}

                  {/* P1: Restart button when permission just granted */}
                  {accessibilityJustGranted && permissions?.accessibility === 'granted' && (
                    <div className="mt-6 rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-4">
                      <p className="text-sm text-emerald-300">
                        ✓ Accessibility izni verildi! Değişikliğin etkili olması için uygulamayı
                        yeniden başlatman gerekiyor.
                      </p>
                      <button
                        type="button"
                        className="mt-3 h-10 rounded-lg bg-emerald-400 px-5 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300 active:scale-[0.98]"
                        onClick={() => void handleRelaunch()}
                      >
                        Yeniden Başlat
                      </button>
                    </div>
                  )}

                  {permissions?.accessibility === 'unsupported' && (
                    <p className="mt-4 text-sm text-neutral-500">
                      Bu platform için Accessibility izni gerekli değil.
                    </p>
                  )}
                </div>
              )}

              {/* Step 3: API Keys */}
              {step === 3 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-semibold tracking-tight">API anahtarları</h2>
                  <p className="mt-4 text-sm leading-7 text-neutral-400">
                    Senin adına Groq ve Qwen kullanarak çalışıyorum. Anahtarlar sadece senin
                    bilgisayarında, şifreli saklanır.
                  </p>
                  <div className="mt-6 grid gap-4">
                    <label className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">Groq API Key</span>
                        <a
                          href="https://console.groq.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400/60 transition hover:text-emerald-400"
                        >
                          Anahtarını al →
                        </a>
                      </div>
                      <input
                        type="password"
                        value={settings.groqApiKey}
                        placeholder="gsk_..."
                        className="h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-sm text-neutral-100 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                        onChange={(event) =>
                          setSettings((current) => ({ ...current, groqApiKey: event.target.value }))
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-300">DashScope API Key</span>
                        <a
                          href="https://dashscope.console.aliyun.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400/60 transition hover:text-emerald-400"
                        >
                          Anahtarını al →
                        </a>
                      </div>
                      <input
                        type="password"
                        value={settings.dashscopeApiKey}
                        placeholder="sk-..."
                        className="h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-sm text-neutral-100 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            dashscopeApiKey: event.target.value
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Hotkey */}
              {step === 4 && (
                <OnboardingHotkeyStep
                  hotkeyKeyCode={settings.hotkeyKeyCode}
                  onChange={(hotkeyKeyCode) =>
                    setSettings((current) => ({ ...current, hotkeyKeyCode }))
                  }
                />
              )}

              {/* Step 5: Test */}
              {step === 5 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-semibold tracking-tight">İlk dikteni yap</h2>
                  <p className="mt-4 text-sm leading-7 text-neutral-400">
                    Her şey hazır! Kurulumu tamamladıktan sonra bir metin alanına odaklanıp seçtiğin
                    hotkey'i basılı tutarak kısa bir test yap.
                  </p>
                  <div className="mt-6 rounded-lg border border-neutral-800/40 bg-neutral-950/50 p-5">
                    <p className="text-sm font-medium text-neutral-300">Önerilen test:</p>
                    <p className="mt-2 text-sm italic text-neutral-500">
                      "Merhaba dünya, bugün hava çok güzel."
                    </p>
                  </div>
                  <div className="mt-6">
                    <MicLevelMeter isActive deviceId={settings.microphoneDeviceId || undefined} />
                  </div>
                  {status && <p className="mt-4 text-sm text-red-400">{status}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Footer navigation */}
          <div className="flex items-center justify-between border-t border-neutral-800/40 px-8 py-5">
            <button
              type="button"
              disabled={step === 0}
              className="h-10 rounded-lg border border-neutral-700 px-5 text-sm text-neutral-300 transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-30"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              ← Geri
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={step === 3 && !canContinueApi}
                className="h-10 rounded-lg bg-emerald-400 px-6 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}
              >
                Devam →
              </button>
            ) : (
              <button
                type="button"
                className="h-10 rounded-lg bg-emerald-400 px-6 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300 active:scale-[0.98]"
                onClick={() => void finish()}
              >
                ✓ Tamamla
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

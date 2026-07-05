import { useEffect, useState, type ReactElement, type ReactNode } from 'react'
import type { AppSettings, PermissionSnapshot } from '@/shared/types'
import { HotkeyRecorder } from '@/renderer/components/HotkeyRecorder'
import { MicLevelMeter } from '@/renderer/components/MicLevelMeter'
import { getPermissionLabel } from '@/renderer/lib/permission-labels'
import { getHotkeyShortLabel } from '@/shared/hotkeys'

interface OnboardingProps {
  initialSettings: AppSettings
  onComplete: () => void
}

interface StepShellProps {
  step: number
  title: string
  subtitle: string
  hint?: string
  cta?: string
  back?: boolean
  children: ReactNode
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}

const TOTAL_STEPS = 6

function StepShell({
  step,
  title,
  subtitle,
  hint,
  cta = 'Devam et',
  back = true,
  children,
  onBack,
  onNext,
  onSkip
}: StepShellProps): ReactElement {
  return (
    <main className="sd-app-bg min-h-screen p-4">
      <section className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[780px] flex-col overflow-hidden rounded-sdXl border border-sd-border bg-sd-solid shadow-sdHard">
        <div className="flex items-center gap-1 px-8 pt-5">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span
              key={index}
              className={`h-[3px] flex-1 rounded-sdPill ${
                index <= step ? 'bg-sd-accent' : 'bg-sd-hover'
              }`}
            />
          ))}
          <span className="ml-2 font-mono text-[11px] text-sd-faint">
            {step + 1} / {TOTAL_STEPS}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-6 px-14 py-8">
          <header>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.10em] text-sd-accent">
              Adım {step + 1}
            </p>
            <h1 className="max-w-xl text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-sd-text">
              {title}
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-[1.45] text-sd-dim">{subtitle}</p>
          </header>

          <div className="min-h-0 flex-1">{children}</div>

          {hint && (
            <p className="flex items-center gap-1.5 text-xs text-sd-faint">
              <span aria-hidden="true">ⓘ</span>
              {hint}
            </p>
          )}
        </div>

        <footer className="flex items-center gap-3 border-t border-sd-border px-8 pb-5 pt-4">
          {back && (
            <button
              type="button"
              className="rounded-sdMd px-3.5 py-2 text-[13px] font-medium text-sd-dim transition hover:text-sd-text"
              onClick={onBack}
            >
              ← Geri
            </button>
          )}
          <span className="flex-1" />
          <button
            type="button"
            className="rounded-sdMd border border-sd-border px-5 py-2.5 text-[13px] font-medium text-sd-dim transition hover:bg-sd-hover hover:text-sd-text"
            onClick={onSkip}
          >
            Sonra
          </button>
          <button
            type="button"
            className="sd-cta px-5 py-2.5 text-[13px] font-semibold"
            onClick={onNext}
          >
            {cta}
          </button>
        </footer>
      </section>
    </main>
  )
}

function BrandHero(): ReactElement {
  return (
    <div className="relative h-[220px] w-[360px]">
      <div className="absolute left-1/2 top-1/2 grid h-[140px] w-[140px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[32px] bg-[linear-gradient(135deg,var(--sd-accent-hero),var(--sd-accent-deep))] shadow-sdGlow">
        <svg width="72" height="72" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path
            d="M14 32Q32 14 50 32"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M22 36Q32 24 42 36"
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <rect x="29" y="34" width="6" height="14" rx="3" fill="#fff" />
          <path d="M24 44Q32 52 40 44" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
      {[
        ['Türkçe odaklı', 'left-0 top-5'],
        ['Kod-switching', 'right-5 top-4'],
        ['Quick Edit', 'bottom-9 right-0'],
        ['Sistem geneli', 'bottom-8 left-1']
      ].map(([label, position]) => (
        <span
          key={label}
          className={`absolute ${position} rounded-sdPill border border-sd-border bg-sd-surface px-2.5 py-1.5 text-[11.5px] font-medium text-sd-text shadow-sdSoft`}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

function ToggleMock({ on }: { on: boolean }): ReactElement {
  return (
    <span className={`relative h-[18px] w-8 rounded-sdPill ${on ? 'bg-sd-accent' : 'bg-sd-hover'}`}>
      <span
        className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm ${
          on ? 'left-4' : 'left-0.5'
        }`}
      />
    </span>
  )
}

export default function Onboarding({ initialSettings, onComplete }: OnboardingProps): ReactElement {
  const [step, setStep] = useState(0)
  const [settings, setSettings] = useState<AppSettings>(initialSettings)
  const [permissions, setPermissions] = useState<PermissionSnapshot | null>(null)
  const [status, setStatus] = useState('')
  const micPermission = getPermissionLabel(permissions?.microphone ?? 'unknown')
  const accPermission = getPermissionLabel(permissions?.accessibility ?? 'denied')

  useEffect(() => {
    void window.api.permissions.check().then(setPermissions)
  }, [])

  async function requestMicrophone(): Promise<void> {
    setPermissions(await window.api.permissions.requestMicrophone())
  }

  async function refreshPermissions(): Promise<void> {
    setPermissions(await window.api.permissions.check())
  }

  async function finish(): Promise<void> {
    setStatus('')
    try {
      await window.api.settings.set({ ...settings, onboardingCompleted: true })
      onComplete()
    } catch {
      setStatus('Kurulum tamamlanamadı.')
    }
  }

  function next(): void {
    if (step === TOTAL_STEPS - 1) {
      void finish()
      return
    }
    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1))
  }

  const shellProps = {
    step,
    onBack: () => setStep((current) => Math.max(0, current - 1)),
    onNext: next,
    onSkip: () => void finish()
  }

  if (step === 0) {
    return (
      <StepShell
        {...shellProps}
        back={false}
        cta="Başlayalım →"
        title="Türkçe'ye yakışan sesli dikte"
        subtitle="Bir tuşa basılı tut, konuş, bırak. Konuştuğun her şey temiz, noktalanmış Türkçe metin olarak aktif uygulamaya yazılır."
      >
        <div className="flex h-full items-center justify-center">
          <BrandHero />
        </div>
      </StepShell>
    )
  }

  if (step === 1) {
    return (
      <StepShell
        {...shellProps}
        title="Mikrofon iznini ver"
        subtitle="SesliDikte sadece sen kısayolu basılı tutarken dinler. Ses verisi yalnızca o sırada işlenir."
        hint="İzin reddedildi mi? Sistem Ayarları → Gizlilik → Mikrofon'dan değiştirebilirsin."
      >
        <div className="flex h-full items-center gap-4">
          <div className="sd-panel flex-1 p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-sd-dim">
              Canlı seviye
            </p>
            <MicLevelMeter isActive deviceId={settings.microphoneDeviceId || undefined} />
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-medium text-sd-text">Varsayılan mikrofon</span>
              <span className="font-mono text-xs font-semibold text-sd-accent">-12 dB</span>
            </div>
          </div>
          <div className="w-[220px] rounded-sdLg border-2 border-dashed border-sd-accent bg-sd-muted p-5">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-sd-hover text-sd-accent">
              🎙
            </div>
            <p className="text-sm font-semibold text-sd-text">Mikrofon erişimi</p>
            <p className="mt-1 text-xs leading-5 text-sd-dim">
              SesliDikte mikrofonunu kullanmak istiyor.
            </p>
            <button
              type="button"
              className="sd-cta mt-4 h-9 w-full text-xs font-semibold"
              onClick={() => void requestMicrophone()}
            >
              İzin ver
            </button>
            <p className={`mt-3 text-xs font-medium ${micPermission.color}`}>
              {micPermission.text}
            </p>
          </div>
        </div>
      </StepShell>
    )
  }

  if (step === 2) {
    return (
      <StepShell
        {...shellProps}
        title="Erişilebilirlik iznini aç"
        subtitle="Metni aktif uygulamaya yazabilmek için. SesliDikte sadece sen konuştuktan sonra yazma izni kullanır."
        hint="Bu izin sistem geneli text injection için zorunludur."
      >
        <div className="flex h-full items-center gap-7">
          <div className="sd-panel flex-1 overflow-hidden bg-sd-solid">
            <div className="border-b border-sd-border bg-sd-muted px-4 py-2 text-xs font-semibold text-sd-text">
              Gizlilik & Güvenlik · Erişilebilirlik
            </div>
            <div className="space-y-1 p-3">
              {[
                ['Raycast', true],
                ['SesliDikte', true],
                ['1Password', true],
                ['Karabiner', false]
              ].map(([name, on]) => {
                const active = name === 'SesliDikte'
                return (
                  <div
                    key={String(name)}
                    className={`flex items-center gap-2.5 rounded-md px-2 py-2 ${
                      active ? 'outline outline-1 outline-sd-accent' : ''
                    }`}
                    style={
                      active ? { background: 'rgba(var(--sd-accent-glow-rgb), 0.15)' } : undefined
                    }
                  >
                    <span
                      className={`grid h-[22px] w-[22px] place-items-center rounded text-[10px] font-bold ${
                        active ? 'bg-sd-accent text-white' : 'bg-sd-hover text-sd-dim'
                      }`}
                    >
                      {String(name)[0]}
                    </span>
                    <span className="flex-1 text-[13px] font-medium text-sd-text">{name}</span>
                    <ToggleMock on={Boolean(on)} />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="sd-panel w-60 p-5">
            <p className="text-2xl text-sd-accent">⌾</p>
            <p className="mt-3 text-sm font-semibold text-sd-text">Neden bu izin?</p>
            <p className="mt-1 text-xs leading-5 text-sd-dim">
              Konuştuğun metni Slack, Mail, VS Code gibi aktif pencereye yapıştırabilmek için.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="sd-cta h-9 px-3 text-xs font-semibold"
                onClick={() => void window.api.permissions.openAccessibilitySettings()}
              >
                Ayarları aç
              </button>
              <button
                type="button"
                className="rounded-sdMd border border-sd-border px-3 text-xs text-sd-dim"
                onClick={() => void refreshPermissions()}
              >
                Kontrol et
              </button>
            </div>
            <p className={`mt-3 text-xs font-medium ${accPermission.color}`}>
              {accPermission.text}
            </p>
          </div>
        </div>
      </StepShell>
    )
  }

  if (step === 3) {
    return (
      <StepShell
        {...shellProps}
        title="API bağlantısını hazırla"
        subtitle="Groq anahtarı ses transkripsiyonu için gerekir. AI temizleme yerel Ollama/Gemma ile çalışır."
        hint="Son kullanıcı sürümünde bu ekran geliştirici modu dışında gösterilmeyecek."
      >
        <div className="grid h-full content-center gap-4">
          <label className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sd-text">Groq API Key</span>
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sd-accent"
              >
                Anahtar al →
              </a>
            </div>
            <input
              type="password"
              value={settings.groqApiKey}
              aria-label="Groq API Key"
              className="sd-input px-4"
              autoComplete="off"
              placeholder="gsk_..."
              onChange={(event) =>
                setSettings((current) => ({ ...current, groqApiKey: event.target.value }))
              }
            />
            <p className="text-xs leading-5 text-sd-faint">
              Groq Whisper ses transkripsiyonu için kullanılır. Şimdilik boş geçebilirsin; ilk
              dikteden önce Settings'ten eklemek gerekir.
            </p>
          </label>

          <div className="rounded-sdMd border border-sd-border bg-sd-muted p-4 text-xs leading-5 text-sd-dim">
            Yerel temizleme için Ollama'nın çalışıyor olması gerekir. Bu makinede kullanılacak
            model: {settings.ollamaModel}.
          </div>
        </div>
      </StepShell>
    )
  }

  if (step === 4) {
    return (
      <StepShell
        {...shellProps}
        title="Kısayolunu seç"
        subtitle="Konuşmak için basılı tutacağın tuş. macOS'ta Fn varsayılan; istersen kendi kombinasyonun."
      >
        <div className="flex flex-col gap-5">
          <div className="sd-panel flex justify-center gap-1.5 rounded-sdXl p-6">
            {['⌃', '⌥', '⌘', 'space', '⌘', '⌥', getHotkeyShortLabel(settings.hotkeyKeyCode)].map(
              (key, index) => (
                <span
                  key={`${key}-${index}`}
                  className={`grid h-11 place-items-center rounded-sdMd border border-sd-border text-[13px] font-semibold ${
                    index === 6
                      ? 'bg-sd-accent px-4 text-white shadow-sdGlow'
                      : 'bg-sd-solid text-sd-text'
                  } ${key === 'space' ? 'w-[140px]' : 'w-11'}`}
                >
                  {key}
                </span>
              )
            )}
          </div>
          <HotkeyRecorder
            value={settings.hotkeyKeyCode}
            onChange={(hotkeyKeyCode) => setSettings((current) => ({ ...current, hotkeyKeyCode }))}
          />
        </div>
      </StepShell>
    )
  }

  return (
    <StepShell
      {...shellProps}
      cta="Bitir & Başla"
      title="Dene — sonra hazırsın"
      subtitle="Aşağıdaki kutuya tıkla, kısayoluna basılı tut, bir şey söyle ve bırak."
    >
      <div className="flex h-full flex-col gap-4">
        <div className="relative min-h-0 flex-1 rounded-sdLg border border-dashed border-sd-accent bg-sd-muted p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-sd-accent">
            Deneme alanı
          </p>
          <p className="mt-3 text-sm leading-6 text-sd-text">
            Toplantıya geldim, deadline yarın. Slide'ları akşam toparlarım.
            <span className="ml-1 inline-block h-3.5 w-px animate-pulse bg-sd-accent align-middle" />
          </p>
          <div className="absolute bottom-4 left-1/2 flex h-[26px] -translate-x-1/2 items-center gap-2 rounded-sdPill border border-white/10 bg-[#1c1c1e] px-3 text-[11.5px] font-medium text-white shadow-sdSoft">
            <span className="h-1.5 w-1.5 rounded-full bg-sd-accent" />
            Dinleniyor · 0:04
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ['🎯', 'Doğal konuş', 'Dolgu kelimeleri otomatik temizlenir'],
            ['⚡', 'Hızlı', 'Konuşma sonu → metin görünmesi < 2 saniye'],
            ['🔒', 'KVKK', 'Anahtarlar yerel olarak şifreli saklanır']
          ].map(([icon, title, desc]) => (
            <div key={title} className="sd-panel p-3">
              <p className="text-base">{icon}</p>
              <p className="mt-1 text-[12.5px] font-semibold text-sd-text">{title}</p>
              <p className="mt-0.5 text-[11.5px] leading-4 text-sd-dim">{desc}</p>
            </div>
          ))}
        </div>
        {status && <p className="text-sm text-red-400">{status}</p>}
      </div>
    </StepShell>
  )
}

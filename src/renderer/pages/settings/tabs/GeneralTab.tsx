import type { ReactElement } from 'react'
import type {
  AppSettings,
  AppearanceAccent,
  AppearanceFont,
  AppearanceMetaphor,
  AppearanceMode
} from '@/shared/types'
import { UI_LANGUAGES } from '@/shared/constants'
import { PALETTES } from '@/renderer/styles/tokens'

interface GeneralTabProps {
  settings: AppSettings
  onChange: (patch: Partial<AppSettings>) => void
  section?: 'all' | 'api' | 'appearance' | 'behavior'
}

const SECTION_COPY = {
  all: ['Genel', 'API, davranış ve görünüm ayarları'],
  api: ['API Anahtarları', 'Transkripsiyon ve AI temizleme sağlayıcı bağlantıları'],
  appearance: ['Görünüm', 'Overlay ve ayarlar penceresinin ortak tasarım değişkenleri'],
  behavior: ['Davranış', 'Dikte akışının uygulama genelindeki çalışma şekli']
} satisfies Record<NonNullable<GeneralTabProps['section']>, [string, string]>

export function GeneralTab({ settings, onChange, section = 'all' }: GeneralTabProps): ReactElement {
  const paletteOptions: { id: AppearanceAccent; label: string }[] = [
    { id: 'green', label: 'Yeşil' },
    { id: 'amber', label: 'Amber' },
    { id: 'indigo', label: 'Indigo' },
    { id: 'red', label: 'Kırmızı' }
  ]
  const [title, subtitle] = SECTION_COPY[section]
  const showApi = section === 'all' || section === 'api'
  const showAppearance = section === 'all' || section === 'appearance'
  const showBehavior = section === 'all' || section === 'behavior'

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-sd-text">{title}</h2>
        <p className="mt-1 text-sm text-sd-dim">{subtitle}</p>
      </div>

      {showApi && (
        <div className="sd-panel space-y-5 p-6">
          <label className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sd-text">Groq API Key</span>
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sd-accent transition hover:opacity-100"
                style={{ opacity: 0.7 }}
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
              onChange={(e) => onChange({ groqApiKey: e.target.value })}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sd-text">DashScope API Key</span>
              <a
                href="https://dashscope.console.aliyun.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sd-accent transition hover:opacity-100"
                style={{ opacity: 0.7 }}
              >
                Anahtar al →
              </a>
            </div>
            <input
              type="password"
              value={settings.dashscopeApiKey}
              aria-label="DashScope API Key"
              className="sd-input px-4"
              autoComplete="off"
              onChange={(e) => onChange({ dashscopeApiKey: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-sd-text">DashScope Base URL</span>
              <input
                value={settings.dashscopeBaseUrl}
                aria-label="DashScope Base URL"
                className="sd-input px-4"
                onChange={(e) => onChange({ dashscopeBaseUrl: e.target.value })}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-sd-text">Arayüz Dili</span>
              <select
                value={settings.uiLanguage ?? 'tr'}
                aria-label="Arayüz Dili"
                className="sd-input px-3"
                onChange={(e) => onChange({ uiLanguage: e.target.value as 'tr' | 'en' })}
              >
                {UI_LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {showAppearance && (
        <div className="sd-panel space-y-5 p-6">
          <div>
            <h3 className="text-sm font-semibold text-sd-text">Görünüm</h3>
            <p className="mt-1 text-xs text-sd-faint">
              Overlay ve ayarlar penceresinin ortak tasarım değişkenleri.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2 text-sm">
              <span className="font-medium text-sd-text">Vurgu rengi</span>
              <div className="flex flex-wrap gap-2">
                {paletteOptions.map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    aria-pressed={settings.appearanceAccent === palette.id}
                    className={`flex items-center gap-2 rounded-sdPill border px-3 py-2 text-xs font-semibold transition ${
                      settings.appearanceAccent === palette.id
                        ? 'border-sd-accent text-sd-text'
                        : 'border-sd-border text-sd-dim hover:text-sd-text'
                    }`}
                    onClick={() => onChange({ appearanceAccent: palette.id })}
                  >
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ background: PALETTES[palette.id].hero }}
                      aria-hidden="true"
                    />
                    {palette.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-sd-text">Mod</span>
                <select
                  value={settings.appearanceMode}
                  className="sd-input px-3"
                  onChange={(event) =>
                    onChange({ appearanceMode: event.target.value as AppearanceMode })
                  }
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-sd-text">Overlay metaforu</span>
                <select
                  value={settings.appearanceMetaphor}
                  className="sd-input px-3"
                  onChange={(event) =>
                    onChange({ appearanceMetaphor: event.target.value as AppearanceMetaphor })
                  }
                >
                  <option value="wave">Wave</option>
                  <option value="orb">Orb</option>
                  <option value="dot">Dot</option>
                  <option value="blob">Blob</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-sd-text">Font</span>
                <select
                  value={settings.appearanceFont}
                  className="sd-input px-3"
                  onChange={(event) =>
                    onChange({ appearanceFont: event.target.value as AppearanceFont })
                  }
                >
                  <option value="system">System</option>
                  <option value="geist">Geist</option>
                  <option value="serif">Newsreader</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="flex items-center justify-between font-medium text-sd-text">
                  Radius
                  <span className="font-mono text-xs text-sd-faint">
                    {settings.radiusScale.toFixed(1)}x
                  </span>
                </span>
                <input
                  type="range"
                  min="0.4"
                  max="1.8"
                  step="0.1"
                  value={settings.radiusScale}
                  className="h-2 w-full cursor-pointer accent-sd-accent"
                  onChange={(event) => onChange({ radiusScale: Number(event.target.value) })}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {showBehavior && (
        <div className="sd-panel space-y-4 p-6">
          <h3 className="text-sm font-semibold text-sd-text">Davranış</h3>

          <label className="flex items-center justify-between rounded-sdMd border border-sd-border bg-sd-solid px-4 py-3 text-sm">
            <div>
              <p className="text-sd-text">Overlay göster</p>
              <p className="mt-0.5 text-xs text-sd-faint">Kayıt sırasında yüzen pencere</p>
            </div>
            <input
              type="checkbox"
              aria-label="Overlay göster"
              checked={settings.overlayEnabled}
              className="h-4 w-4 accent-sd-accent"
              onChange={(e) => onChange({ overlayEnabled: e.target.checked })}
            />
          </label>

          <label className="flex items-center justify-between rounded-sdMd border border-sd-border bg-sd-solid px-4 py-3 text-sm">
            <div>
              <p className="text-sd-text">Otomatik yapıştır</p>
              <p className="mt-0.5 text-xs text-sd-faint">
                Kapalıyken metin clipboard'a kopyalanır
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Otomatik yapıştır"
              checked={settings.autoApply}
              className="h-4 w-4 accent-sd-accent"
              onChange={(e) => onChange({ autoApply: e.target.checked })}
            />
          </label>

          <label className="flex items-center justify-between rounded-sdMd border border-sd-border bg-sd-solid px-4 py-3 text-sm">
            <div>
              <p className="text-sd-text">Clipboard yöntemi</p>
              <p className="mt-0.5 text-xs text-sd-faint">Metin yapıştırma için clipboard kullan</p>
            </div>
            <input
              type="checkbox"
              aria-label="Clipboard yöntemi"
              checked={settings.useClipboardInjection}
              className="h-4 w-4 accent-sd-accent"
              onChange={(e) => onChange({ useClipboardInjection: e.target.checked })}
            />
          </label>

          <label className="flex items-center justify-between rounded-sdMd border border-sd-border bg-sd-solid px-4 py-3 text-sm">
            <div>
              <p className="text-sd-text">LLM Önbellek</p>
              <p className="mt-0.5 text-xs text-sd-faint">
                Aynı metin tekrar dikted edilince cache'den döner
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="LLM Önbellek"
              checked={settings.llmCacheEnabled ?? true}
              className="h-4 w-4 accent-sd-accent"
              onChange={(e) => onChange({ llmCacheEnabled: e.target.checked })}
            />
          </label>
        </div>
      )}
    </div>
  )
}

export function ApiKeysTab(props: Omit<GeneralTabProps, 'section'>): ReactElement {
  return <GeneralTab {...props} section="api" />
}

export function AppearanceTab(props: Omit<GeneralTabProps, 'section'>): ReactElement {
  return <GeneralTab {...props} section="appearance" />
}

export function BehaviorTab(props: Omit<GeneralTabProps, 'section'>): ReactElement {
  return <GeneralTab {...props} section="behavior" />
}

import type { ReactElement } from 'react'
import type { AppSettings } from '@/shared/types'
import { DASHSCOPE_MODELS, UI_LANGUAGES } from '@/shared/constants'

interface GeneralTabProps {
  settings: AppSettings
  onChange: (patch: Partial<AppSettings>) => void
}

export function GeneralTab({ settings, onChange }: GeneralTabProps): ReactElement {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Genel Ayarlar</h2>
        <p className="mt-1 text-sm text-neutral-500">API bağlantı ayarları</p>
      </div>

      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-5">
        <label className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-300 font-medium">Groq API Key</span>
            <a
              href="https://console.groq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400/60 hover:text-emerald-400 transition"
            >
              Anahtar al →
            </a>
          </div>
          <input
            type="password"
            value={settings.groqApiKey}
            aria-label="Groq API Key"
            className="h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-neutral-100 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
            autoComplete="off"
            onChange={(e) => onChange({ groqApiKey: e.target.value })}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-300 font-medium">DashScope API Key</span>
            <a
              href="https://dashscope.console.aliyun.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400/60 hover:text-emerald-400 transition"
            >
              Anahtar al →
            </a>
          </div>
          <input
            type="password"
            value={settings.dashscopeApiKey}
            aria-label="DashScope API Key"
            className="h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-neutral-100 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
            autoComplete="off"
            onChange={(e) => onChange({ dashscopeApiKey: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <label className="grid gap-2 text-sm">
            <span className="text-neutral-300 font-medium">DashScope Base URL</span>
            <input
              value={settings.dashscopeBaseUrl}
              aria-label="DashScope Base URL"
              className="h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-neutral-100 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
              onChange={(e) => onChange({ dashscopeBaseUrl: e.target.value })}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-neutral-300 font-medium">Arayüz Dili</span>
            <select
              value={settings.uiLanguage ?? 'tr'}
              aria-label="Arayüz Dili"
              className="h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-neutral-100 outline-none transition focus:border-emerald-400"
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

      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-200">Davranış</h3>

        <label className="flex items-center justify-between rounded-lg border border-neutral-800/60 bg-neutral-950 px-4 py-3 text-sm">
          <div>
            <p className="text-neutral-300">Overlay göster</p>
            <p className="text-xs text-neutral-500 mt-0.5">Kayıt sırasında yüzen pencere</p>
          </div>
          <input
            type="checkbox"
            aria-label="Overlay göster"
            checked={settings.overlayEnabled}
            className="h-4 w-4 accent-emerald-400"
            onChange={(e) => onChange({ overlayEnabled: e.target.checked })}
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-neutral-800/60 bg-neutral-950 px-4 py-3 text-sm">
          <div>
            <p className="text-neutral-300">Otomatik yapıştır</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kapalıyken metin clipboard'a kopyalanır
            </p>
          </div>
          <input
            type="checkbox"
            aria-label="Otomatik yapıştır"
            checked={settings.autoApply}
            className="h-4 w-4 accent-emerald-400"
            onChange={(e) => onChange({ autoApply: e.target.checked })}
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-neutral-800/60 bg-neutral-950 px-4 py-3 text-sm">
          <div>
            <p className="text-neutral-300">Clipboard yöntemi</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Metin yapıştırma için clipboard kullan
            </p>
          </div>
          <input
            type="checkbox"
            aria-label="Clipboard yöntemi"
            checked={settings.useClipboardInjection}
            className="h-4 w-4 accent-emerald-400"
            onChange={(e) => onChange({ useClipboardInjection: e.target.checked })}
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-neutral-800/60 bg-neutral-950 px-4 py-3 text-sm">
          <div>
            <p className="text-neutral-300">LLM Önbellek</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Aynı metin tekrar dikted edilince cache'den döner
            </p>
          </div>
          <input
            type="checkbox"
            aria-label="LLM Önbellek"
            checked={settings.llmCacheEnabled ?? true}
            className="h-4 w-4 accent-emerald-400"
            onChange={(e) => onChange({ llmCacheEnabled: e.target.checked })}
          />
        </label>
      </div>
    </div>
  )
}

export { DASHSCOPE_MODELS }

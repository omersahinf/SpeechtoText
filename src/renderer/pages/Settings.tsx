import { type ReactElement } from 'react'
import { useSettings } from '@/renderer/hooks/useSettings'
import { GeneralTab } from './settings/tabs/GeneralTab'
import { KeyboardTab } from './settings/tabs/KeyboardTab'
import { AITab } from './settings/tabs/AITab'
import { MicrophoneTab } from './settings/tabs/MicrophoneTab'
import { PermissionsTab } from './settings/tabs/PermissionsTab'
import { SnippetsTab } from './settings/tabs/SnippetsTab'
import { ProfilesTab } from './settings/tabs/ProfilesTab'
import { HistoryTab } from './settings/tabs/HistoryTab'
import { AboutTab } from './settings/tabs/AboutTab'
import { useState } from 'react'
import type { AppSettings } from '@/shared/types'

type SettingsTab =
  | 'general'
  | 'keyboard'
  | 'ai'
  | 'microphone'
  | 'permissions'
  | 'snippets'
  | 'profiles'
  | 'history'
  | 'about'

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'general', label: 'Genel', icon: '⚙' },
  { id: 'keyboard', label: 'Klavye', icon: '⌨' },
  { id: 'ai', label: 'AI', icon: '✦' },
  { id: 'microphone', label: 'Mikrofon', icon: '🎙' },
  { id: 'permissions', label: 'Gizlilik ve İzinler', icon: '🔒' },
  { id: 'snippets', label: 'Snippets', icon: '⚡' },
  { id: 'profiles', label: 'Profiller', icon: '👤' },
  { id: 'history', label: 'Geçmiş', icon: '🕒' },
  { id: 'about', label: 'Hakkında', icon: 'ℹ' }
]

const TABS_WITH_SAVE: SettingsTab[] = ['general', 'keyboard', 'ai', 'microphone']

export default function Settings(): ReactElement {
  const { settings, setSettings, isSaving, status, saveSettings, canSave } = useSettings()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  const handleChange = (patch: Partial<AppSettings>): void => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const showSaveBar = TABS_WITH_SAVE.includes(activeTab)

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-[220px_1fr] gap-0 max-lg:grid-cols-1">
        {/* Sidebar */}
        <aside className="border-r border-neutral-800/50 px-4 py-8" aria-label="Ayarlar menüsü">
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
              Sesli Dikte
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">Ayarlar</h1>
          </div>
          <nav className="space-y-1" aria-label="Ayar sekmeleri">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  activeTab === tab.id
                    ? 'bg-emerald-400/10 text-emerald-300 font-medium'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="w-5 text-center text-base" aria-hidden>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex flex-col px-8 py-8">
          <div
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-label={TABS.find((t) => t.id === activeTab)?.label}
            className="flex-1 space-y-6"
          >
            {activeTab === 'general' && <GeneralTab settings={settings} onChange={handleChange} />}
            {activeTab === 'keyboard' && (
              <KeyboardTab settings={settings} onChange={handleChange} />
            )}
            {activeTab === 'ai' && <AITab settings={settings} onChange={handleChange} />}
            {activeTab === 'microphone' && (
              <MicrophoneTab settings={settings} onChange={handleChange} />
            )}
            {activeTab === 'permissions' && <PermissionsTab />}
            {activeTab === 'snippets' && <SnippetsTab />}
            {activeTab === 'profiles' && <ProfilesTab />}
            {activeTab === 'history' && <HistoryTab />}
            {activeTab === 'about' && <AboutTab />}
          </div>

          {/* Save bar — only for tabs that touch AppSettings */}
          {showSaveBar && (
            <div className="flex items-center justify-end gap-3 border-t border-neutral-800/30 pt-6 mt-8">
              {status && (
                <span
                  role={status === 'Kaydedildi.' ? 'status' : 'alert'}
                  aria-live={status === 'Kaydedildi.' ? 'polite' : 'assertive'}
                  className={`text-sm ${status === 'Kaydedildi.' ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {status}
                </span>
              )}
              <button
                type="button"
                disabled={!canSave || isSaving}
                className="h-10 rounded-lg bg-emerald-400 px-6 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                onClick={() => void saveSettings()}
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

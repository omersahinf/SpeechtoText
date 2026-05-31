import { useState, useEffect, type ReactElement } from 'react'
import type { DictationProfile } from '@/shared/types'
import { rendererLogger } from '@/renderer/lib/logger'

export function ProfilesTab(): ReactElement {
  const [profiles, setProfiles] = useState<DictationProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  const load = async (): Promise<void> => {
    try {
      const [all, id] = await Promise.all([
        window.api.profiles.getAll(),
        window.api.profiles.getActiveId()
      ])
      setProfiles(all as DictationProfile[])
      setActiveId(id as string | null)
    } catch (e: unknown) {
      rendererLogger.error('[ProfilesTab] load failed', e)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function addProfile(): Promise<void> {
    if (!newName.trim()) return
    try {
      await window.api.profiles.add(newName.trim())
      setNewName('')
      void load()
    } catch (e: unknown) {
      rendererLogger.error('[ProfilesTab] add failed', e)
    }
  }

  async function deleteProfile(id: string): Promise<void> {
    try {
      await window.api.profiles.delete(id)
      void load()
    } catch (e: unknown) {
      rendererLogger.error('[ProfilesTab] delete failed', e)
    }
  }

  async function setActive(id: string | null): Promise<void> {
    try {
      await window.api.profiles.setActive(id)
      setActiveId(id)
    } catch (e: unknown) {
      rendererLogger.error('[ProfilesTab] setActive failed', e)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Dikte Profilleri</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Farklı bağlamlar için ayrı ayar setleri — tray menüsünden hızlıca geçiş yap
        </p>
      </div>

      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            aria-label="Yeni profil adı"
            placeholder="Profil adı (örn: İş, Kişisel)"
            className="flex-1 h-9 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none transition focus:border-sd-accent placeholder:text-neutral-600"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addProfile()}
          />
          <button
            type="button"
            disabled={!newName.trim()}
            className="h-9 rounded-lg bg-sd-accent px-4 text-sm font-medium text-neutral-950 transition hover:opacity-90 disabled:opacity-40"
            onClick={() => void addProfile()}
          >
            Ekle
          </button>
        </div>

        {profiles.length === 0 ? (
          <p className="text-sm text-neutral-600 py-4 text-center">Henüz profil yok</p>
        ) : (
          <div className="space-y-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                className={`group flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                  activeId === p.id
                    ? 'border-sd-accent bg-sd-hover'
                    : 'border-neutral-800/60 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {activeId === p.id && (
                    <span className="text-xs text-sd-accent font-medium">Aktif</span>
                  )}
                  <span className="text-sm text-neutral-200">{p.name}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  {activeId !== p.id && (
                    <button
                      type="button"
                      aria-label={`"${p.name}" profilini aktif et`}
                      className="rounded-md px-2 py-1 text-xs text-sd-accent hover:bg-sd-hover transition"
                      onClick={() => void setActive(p.id)}
                    >
                      Aktif et
                    </button>
                  )}
                  {activeId === p.id && (
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-800 transition"
                      onClick={() => void setActive(null)}
                    >
                      Devre dışı
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`"${p.name}" profilini sil`}
                    className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 transition"
                    onClick={() => void deleteProfile(p.id)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

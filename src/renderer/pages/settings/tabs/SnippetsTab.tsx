import { useState, useEffect, type ReactElement } from 'react'
import type { SnippetEntry } from '@/shared/types'
import { rendererLogger } from '@/renderer/lib/logger'

export function SnippetsTab(): ReactElement {
  const [snippets, setSnippets] = useState<SnippetEntry[]>([])
  const [trigger, setTrigger] = useState('')
  const [expansion, setExpansion] = useState('')

  useEffect(() => {
    void window.api.snippets
      .getAll()
      .then(setSnippets)
      .catch((e: unknown) => {
        rendererLogger.error('[SnippetsTab] load failed', e)
      })
  }, [])

  async function addSnippet(): Promise<void> {
    if (!trigger.trim() || !expansion.trim()) return
    try {
      const entry = await window.api.snippets.add(trigger.trim(), expansion.trim())
      setSnippets((prev) => [...prev, entry])
      setTrigger('')
      setExpansion('')
    } catch (e: unknown) {
      rendererLogger.error('[SnippetsTab] add failed', e)
    }
  }

  async function deleteSnippet(id: string): Promise<void> {
    try {
      await window.api.snippets.delete(id)
      setSnippets((prev) => prev.filter((s) => s.id !== id))
    } catch (e: unknown) {
      rendererLogger.error('[SnippetsTab] delete failed', e)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Snippets</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Kısa tetikleyiciyle uzun metin genişletme — diktet ederken otomatik uygulanır
        </p>
      </div>

      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-4">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 max-md:grid-cols-1">
          <label className="grid gap-1 text-xs text-neutral-400">
            Tetikleyici
            <input
              type="text"
              value={trigger}
              aria-label="Snippet tetikleyicisi"
              placeholder="örn: adresim"
              className="h-9 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none transition focus:border-emerald-400 placeholder:text-neutral-600"
              onChange={(e) => setTrigger(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void addSnippet()}
            />
          </label>
          <label className="grid gap-1 text-xs text-neutral-400">
            Genişletme metni
            <input
              type="text"
              value={expansion}
              aria-label="Snippet genişletme metni"
              placeholder="örn: Atatürk Cad. No:5 Kadıköy/İstanbul"
              className="h-9 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none transition focus:border-emerald-400 placeholder:text-neutral-600"
              onChange={(e) => setExpansion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void addSnippet()}
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              disabled={!trigger.trim() || !expansion.trim()}
              className="h-9 rounded-lg bg-emerald-400 px-4 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => void addSnippet()}
            >
              Ekle
            </button>
          </div>
        </div>

        {snippets.length === 0 ? (
          <p className="text-sm text-neutral-600 py-4 text-center">
            Henüz snippet yok. Bir tane ekleyerek başla.
          </p>
        ) : (
          <div className="space-y-2 mt-2">
            {snippets.map((s) => (
              <div
                key={s.id}
                className="group flex items-start gap-3 rounded-lg border border-neutral-800/60 bg-neutral-950 px-4 py-3"
              >
                <div className="min-w-0 flex-1 grid grid-cols-[auto_16px_1fr] items-start gap-2 text-sm">
                  <span className="font-mono text-emerald-400 font-medium truncate">
                    {s.trigger}
                  </span>
                  <span className="text-neutral-600 mt-0.5">→</span>
                  <span className="text-neutral-300 break-words">{s.expansion}</span>
                </div>
                <button
                  type="button"
                  aria-label={`"${s.trigger}" snippet'ini sil`}
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                  onClick={() => void deleteSnippet(s.id)}
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

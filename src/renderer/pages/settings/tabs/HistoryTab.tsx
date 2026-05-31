import { useState, useEffect, useCallback, type ReactElement } from 'react'
import type { DictationEntry } from '@/shared/types'
import { rendererLogger } from '@/renderer/lib/logger'

export function HistoryTab(): ReactElement {
  const [entries, setEntries] = useState<DictationEntry[]>([])
  const [search, setSearch] = useState('')
  const [exportStatus, setExportStatus] = useState('')

  const loadHistory = useCallback((): void => {
    void window.api.history
      .getEntries()
      .then(setEntries)
      .catch((e: unknown) => {
        rendererLogger.error('[HistoryTab] load failed', e)
      })
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  async function deleteEntry(id: string): Promise<void> {
    await window.api.history.deleteEntry(id)
    loadHistory()
  }

  async function clearAll(): Promise<void> {
    if (!window.confirm('Tüm geçmiş silinecek. Emin misin?')) return
    await window.api.history.clearAll()
    loadHistory()
  }

  async function reinjectEntry(id: string): Promise<void> {
    const result = await window.api.history.reinjectEntry(id)
    if (!result.ok) {
      rendererLogger.error('[HistoryTab] reinject failed', result.error)
    }
  }

  async function exportHistory(format: 'json' | 'markdown' | 'csv'): Promise<void> {
    try {
      const content = await window.api.history.exportEntries(format)
      const ext = format === 'markdown' ? 'md' : format
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dodo-history-${new Date().toISOString().split('T')[0]}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      setExportStatus('İndirildi.')
      setTimeout(() => setExportStatus(''), 2000)
    } catch (e: unknown) {
      rendererLogger.error('[HistoryTab] export failed', e)
    }
  }

  const filtered = entries.filter((e) =>
    search
      ? e.cleanText.toLowerCase().includes(search.toLowerCase()) ||
        e.rawText.toLowerCase().includes(search.toLowerCase())
      : true
  )

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dikte Geçmişi</h2>
          <p className="mt-1 text-sm text-neutral-500">Son {entries.length} dikte kaydı</p>
        </div>
        <div className="flex gap-2 items-center">
          {exportStatus && <span className="text-xs text-sd-accent">{exportStatus}</span>}
          {entries.length > 0 && (
            <>
              <div className="relative group">
                <button
                  type="button"
                  className="h-9 rounded-lg border border-neutral-700 px-3 text-sm text-neutral-300 transition hover:border-neutral-500"
                >
                  Dışa Aktar ▾
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col w-48 rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden z-10">
                  <button
                    type="button"
                    className="px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-800 transition"
                    onClick={() => void exportHistory('json')}
                  >
                    JSON olarak indir
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-800 transition"
                    onClick={() => void exportHistory('markdown')}
                  >
                    Markdown olarak indir
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-800 transition"
                    onClick={() => void exportHistory('csv')}
                  >
                    CSV olarak indir
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="h-9 rounded-lg border border-red-800/40 px-3 text-sm text-red-400 transition hover:bg-red-400/10"
                onClick={() => void clearAll()}
              >
                Tümünü Sil
              </button>
            </>
          )}
        </div>
      </div>

      {entries.length > 0 && (
        <input
          type="search"
          placeholder="Geçmişte ara…"
          value={search}
          aria-label="Geçmişte ara"
          className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none transition focus:border-sd-accent placeholder:text-neutral-600"
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
          <span className="text-4xl" aria-hidden>
            🎙
          </span>
          <p className="mt-3 text-sm">Henüz dikte kaydı yok</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <article
              key={entry.id}
              className="group rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-4 transition hover:border-neutral-700"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="flex-1 text-sm text-neutral-100 leading-relaxed">{entry.cleanText}</p>
                <div className="flex shrink-0 gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    title="Kopyala"
                    aria-label="Kopyala"
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:text-neutral-100 transition"
                    onClick={() => void navigator.clipboard.writeText(entry.cleanText)}
                  >
                    Kopyala
                  </button>
                  <button
                    type="button"
                    title="Tekrar yapıştır"
                    aria-label="Tekrar yapıştır"
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-sd-accent hover:bg-sd-hover transition"
                    onClick={() => void reinjectEntry(entry.id)}
                  >
                    Yapıştır
                  </button>
                  <button
                    type="button"
                    title="Sil"
                    aria-label="Sil"
                    className="rounded-md border border-neutral-800 px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 transition"
                    onClick={() => void deleteEntry(entry.id)}
                  >
                    Sil
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-neutral-600">
                <span>{new Date(entry.timestamp).toLocaleString('tr-TR')}</span>
                {entry.app && <span>· {entry.app}</span>}
                <span>· {entry.latencyMs}ms</span>
                {entry.fallback && <span className="text-yellow-600">· ham metin</span>}
                {(entry.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-400"
                  >
                    {tag}
                  </span>
                ))}
                {entry.rawText !== entry.cleanText && (
                  <details className="inline">
                    <summary className="cursor-pointer hover:text-neutral-400">
                      · ham göster
                    </summary>
                    <p className="mt-1 text-neutral-500">{entry.rawText}</p>
                  </details>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

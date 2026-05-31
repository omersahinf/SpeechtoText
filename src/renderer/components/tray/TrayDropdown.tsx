import { useEffect, useState, type ReactElement } from 'react'
import type { DictationEntry } from '@/shared/types'
import { BrandMark } from '@/renderer/components/brand/BrandMark'

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

export function TrayDropdown(): ReactElement {
  const [entries, setEntries] = useState<DictationEntry[]>([])

  useEffect(() => {
    void window.api.history.getEntries().then((items) => setEntries(items.slice(0, 3)))
  }, [])

  return (
    <main className="w-[320px] overflow-hidden rounded-sdLg border border-sd-border bg-sd-solid text-sd-text shadow-sdHard">
      <header className="flex items-center gap-3 border-b border-sd-border px-4 py-3">
        <BrandMark size={28} />
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold">SesliDikte</h1>
          <p className="text-[11px] text-sd-faint">Hazır</p>
        </div>
        <span className="h-2 w-2 rounded-full bg-sd-accent shadow-sdGlow" />
      </header>

      <section className="p-2">
        <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-sd-faint">
          Son transkriptler
        </p>
        {entries.length === 0 ? (
          <p className="rounded-sdMd px-3 py-3 text-sm text-sd-dim">Henüz kayıt yok</p>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="w-full rounded-sdMd px-3 py-2 text-left transition hover:bg-sd-hover"
                onClick={() => void navigator.clipboard.writeText(entry.cleanText)}
              >
                <p className="text-[12.5px] leading-5 text-sd-text">
                  {truncate(entry.cleanText, 78)}
                </p>
                <p className="mt-0.5 text-[10.5px] text-sd-faint">
                  {new Date(entry.timestamp).toLocaleString('tr-TR')}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-sd-border p-2">
        <button
          type="button"
          className="w-full rounded-sdMd px-3 py-2 text-left text-[13px] text-sd-dim transition hover:bg-sd-hover hover:text-sd-text"
          onClick={() => void window.api.history.exportEntries('markdown')}
        >
          Geçmişi dışa aktar
        </button>
        <button
          type="button"
          className="w-full rounded-sdMd px-3 py-2 text-left text-[13px] text-sd-dim transition hover:bg-sd-hover hover:text-sd-text"
          onClick={() => void window.api.app.openLogDir()}
        >
          Log klasörünü aç
        </button>
      </section>
    </main>
  )
}

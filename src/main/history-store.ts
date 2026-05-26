import ElectronStoreImport from 'electron-store'
import type ElectronStoreDefault from 'electron-store'
import type { DictationEntry } from '@/shared/types'
import { logger } from './logger'

const MAX_ENTRIES = 200

interface HistorySchema {
  entries: DictationEntry[]
}

function makeStore(): InstanceType<typeof ElectronStoreDefault<HistorySchema>> {
  const StoreConstructor =
    (ElectronStoreImport as unknown as { default?: typeof ElectronStoreDefault }).default ??
    (ElectronStoreImport as unknown as typeof ElectronStoreDefault)
  return new StoreConstructor<HistorySchema>({
    name: 'history',
    defaults: { entries: [] }
  })
}

export interface HistoryStore {
  addEntry: (entry: DictationEntry) => void
  getEntries: () => DictationEntry[]
  deleteEntry: (id: string) => void
  clearAll: () => void
  tagEntry: (id: string, tag: string) => void
  exportEntries: (format: 'json' | 'markdown' | 'csv') => string
}

export function createHistoryStore(): HistoryStore {
  const store = makeStore()

  const getEntries = (): DictationEntry[] => {
    const raw = store.get('entries')
    return Array.isArray(raw) ? raw : []
  }

  const addEntry = (entry: DictationEntry): void => {
    const entries = getEntries()
    const next = [entry, ...entries].slice(0, MAX_ENTRIES)
    store.set('entries', next)
    logger.debug(`[history] saved entry ${entry.id}`)
  }

  const deleteEntry = (id: string): void => {
    store.set(
      'entries',
      getEntries().filter((e) => e.id !== id)
    )
  }

  const clearAll = (): void => {
    store.set('entries', [])
    logger.info('[history] cleared all entries')
  }

  const tagEntry = (id: string, tag: string): void => {
    const entries = getEntries()
    const idx = entries.findIndex((e) => e.id === id)
    if (idx === -1) return
    const entry = entries[idx]!
    const tags = Array.from(new Set([...(entry.tags ?? []), tag.trim()]))
    const next = [...entries]
    next[idx] = { ...entry, tags }
    store.set('entries', next)
  }

  const exportEntries = (format: 'json' | 'markdown' | 'csv'): string => {
    const entries = getEntries()

    if (format === 'json') {
      return JSON.stringify(entries, null, 2)
    }

    if (format === 'csv') {
      const header = 'id,timestamp,rawText,cleanText,latencyMs,app,fallback,tags'
      const rows = entries.map((e) =>
        [
          e.id,
          new Date(e.timestamp).toISOString(),
          `"${e.rawText.replace(/"/g, '""')}"`,
          `"${e.cleanText.replace(/"/g, '""')}"`,
          e.latencyMs,
          e.app ?? '',
          e.fallback ? 'true' : 'false',
          (e.tags ?? []).join('|')
        ].join(',')
      )
      return [header, ...rows].join('\n')
    }

    // markdown
    const lines = entries.map((e) => {
      const date = new Date(e.timestamp).toLocaleString('tr-TR')
      const meta = [e.app, `${e.latencyMs}ms`, ...(e.tags ?? [])].filter(Boolean).join(' · ')
      return `## ${date}\n\n${e.cleanText}\n\n*${meta}*\n`
    })
    return lines.join('\n---\n\n')
  }

  return { addEntry, getEntries, deleteEntry, clearAll, tagEntry, exportEntries }
}

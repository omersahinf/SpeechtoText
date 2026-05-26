import ElectronStoreImport from 'electron-store'
import type ElectronStoreDefault from 'electron-store'
import { randomUUID } from 'node:crypto'
import { logger } from './logger'

export interface SnippetEntry {
  id: string
  trigger: string
  expansion: string
  createdAt: number
}

interface SnippetsSchema {
  snippets: SnippetEntry[]
}

function makeStore(): InstanceType<typeof ElectronStoreDefault<SnippetsSchema>> {
  const StoreConstructor =
    (ElectronStoreImport as unknown as { default?: typeof ElectronStoreDefault }).default ??
    (ElectronStoreImport as unknown as typeof ElectronStoreDefault)
  return new StoreConstructor<SnippetsSchema>({
    name: 'snippets',
    defaults: { snippets: [] }
  })
}

export interface SnippetsStore {
  getAll: () => SnippetEntry[]
  add: (trigger: string, expansion: string) => SnippetEntry
  update: (id: string, trigger: string, expansion: string) => SnippetEntry | null
  delete: (id: string) => void
  applySnippets: (text: string) => string
}

export function createSnippetsStore(): SnippetsStore {
  const store = makeStore()

  const getAll = (): SnippetEntry[] => {
    const raw = store.get('snippets')
    return Array.isArray(raw) ? raw : []
  }

  const save = (snippets: SnippetEntry[]): void => {
    store.set('snippets', snippets)
  }

  return {
    getAll,

    add(trigger: string, expansion: string): SnippetEntry {
      const entry: SnippetEntry = {
        id: randomUUID(),
        trigger: trigger.trim(),
        expansion,
        createdAt: Date.now()
      }
      save([...getAll(), entry])
      logger.debug(`[snippets] added: ${trigger}`)
      return entry
    },

    update(id: string, trigger: string, expansion: string): SnippetEntry | null {
      const all = getAll()
      const idx = all.findIndex((s) => s.id === id)
      if (idx === -1) return null
      const updated = { ...all[idx]!, trigger: trigger.trim(), expansion }
      const next = [...all]
      next[idx] = updated
      save(next)
      return updated
    },

    delete(id: string): void {
      save(getAll().filter((s) => s.id !== id))
      logger.debug(`[snippets] deleted: ${id}`)
    },

    applySnippets(text: string): string {
      const snippets = getAll()
      if (snippets.length === 0) return text

      let result = text
      for (const snippet of snippets) {
        if (!snippet.trigger) continue
        // Kelime sınırlarına dikkat ederek değiştir
        const escaped = snippet.trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
        result = result.replace(regex, snippet.expansion)
      }
      return result
    }
  }
}

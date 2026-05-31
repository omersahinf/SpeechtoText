import ElectronStoreImport from 'electron-store'
import type ElectronStoreDefault from 'electron-store'
import { randomUUID } from 'node:crypto'
import { logger } from './logger'

export interface CustomVocabEntry {
  id: string
  term: string
  replacement: string
  createdAt: number
}

interface CustomVocabSchema {
  vocab: CustomVocabEntry[]
}

function makeStore(): InstanceType<typeof ElectronStoreDefault<CustomVocabSchema>> {
  const StoreConstructor =
    (ElectronStoreImport as unknown as { default?: typeof ElectronStoreDefault }).default ??
    (ElectronStoreImport as unknown as typeof ElectronStoreDefault)
  return new StoreConstructor<CustomVocabSchema>({
    name: 'custom-vocab',
    defaults: { vocab: [] }
  })
}

export interface CustomVocabStore {
  getAll: () => CustomVocabEntry[]
  add: (term: string, replacement: string) => CustomVocabEntry
  delete: (id: string) => void
  buildPromptFragment: () => string
  applyToText: (text: string) => string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toAsciiLower(value: string): string {
  return value
    .toLocaleLowerCase('tr')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
}

function buildMatchVariants(term: string, replacement: string): string[] {
  const variants = new Set<string>()

  for (const value of [term, replacement]) {
    const trimmed = value.trim()
    if (!trimmed) continue

    const ascii = toAsciiLower(trimmed)
    variants.add(trimmed)
    variants.add(ascii)

    if (ascii === 'cloud' || ascii === 'claude') {
      variants.add('cloud')
      variants.add('claude')
      variants.add('klaud')
      variants.add('klod')
    }
  }

  return Array.from(variants).sort((a, b) => b.length - a.length)
}

function applyVocabEntries(text: string, entries: CustomVocabEntry[]): string {
  return entries.reduce((current, entry) => {
    const variants = buildMatchVariants(entry.term, entry.replacement)
    if (variants.length === 0 || !entry.replacement.trim()) {
      return current
    }

    const source = variants.map(escapeRegExp).join('|')
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${source})(?=$|[^\\p{L}\\p{N}_])`, 'giu')

    return current.replace(pattern, (_match, prefix: string) => `${prefix}${entry.replacement}`)
  }, text)
}

export function createCustomVocabStore(): CustomVocabStore {
  const store = makeStore()

  const getAll = (): CustomVocabEntry[] => {
    const raw = store.get('vocab')
    return Array.isArray(raw) ? raw : []
  }

  const save = (vocab: CustomVocabEntry[]): void => {
    store.set('vocab', vocab)
  }

  return {
    getAll,

    add(term: string, replacement: string): CustomVocabEntry {
      const entry: CustomVocabEntry = {
        id: randomUUID(),
        term: term.trim(),
        replacement: replacement.trim(),
        createdAt: Date.now()
      }
      save([...getAll(), entry])
      logger.debug(`[custom-vocab] added: "${term}" → "${replacement}"`)
      return entry
    },

    delete(id: string): void {
      save(getAll().filter((v) => v.id !== id))
      logger.debug(`[custom-vocab] deleted: ${id}`)
    },

    buildPromptFragment(): string {
      const vocab = getAll()
      if (vocab.length === 0) return ''

      const lines = vocab
        .map((v) => `- "${v.term}" → her zaman "${v.replacement}" olarak yaz`)
        .join('\n')

      return `\nÖZEL TERİMLER (kesinlikle bu şekilde yaz):\n${lines}`
    },

    applyToText(text: string): string {
      return applyVocabEntries(text, getAll())
    }
  }
}

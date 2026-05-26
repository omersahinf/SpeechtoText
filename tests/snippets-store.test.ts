import { describe, it, expect, vi, beforeEach } from 'vitest'

// electron-store mock
vi.mock('electron-store', () => {
  class FakeStore {
    private _data: Record<string, unknown>
    constructor(opts: { defaults?: Record<string, unknown> } = {}) {
      this._data = { ...opts.defaults }
    }
    get(key: string) {
      return this._data[key]
    }
    set(key: string, value: unknown) {
      this._data[key] = value
    }
    get store() {
      return this._data
    }
    set store(v: Record<string, unknown>) {
      Object.assign(this._data, v)
    }
  }
  return { default: FakeStore }
})

vi.mock('../src/main/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}))

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => Math.random().toString(36).slice(2))
}))

import { createSnippetsStore } from '../src/main/snippets-store'

describe('createSnippetsStore', () => {
  let store: ReturnType<typeof createSnippetsStore>

  beforeEach(() => {
    store = createSnippetsStore()
  })

  it('starts empty', () => {
    expect(store.getAll()).toHaveLength(0)
  })

  it('adds a snippet', () => {
    const s = store.add('adresim', 'Bağdat Cad. No:1')
    expect(s.trigger).toBe('adresim')
    expect(s.expansion).toBe('Bağdat Cad. No:1')
    expect(s.id).toBeTruthy()
    expect(store.getAll()).toHaveLength(1)
  })

  it('trims trigger whitespace on add', () => {
    const s = store.add('  imzam  ', 'Ömer Şahin')
    expect(s.trigger).toBe('imzam')
  })

  it('updates a snippet', () => {
    const s = store.add('x', 'old')
    const updated = store.update(s.id, 'x', 'new')
    expect(updated?.expansion).toBe('new')
    expect(store.getAll()[0]?.expansion).toBe('new')
  })

  it('returns null when updating non-existent id', () => {
    expect(store.update('nonexistent', 't', 'e')).toBeNull()
  })

  it('deletes a snippet', () => {
    const s = store.add('trig', 'exp')
    store.delete(s.id)
    expect(store.getAll()).toHaveLength(0)
  })

  describe('applySnippets', () => {
    it('replaces trigger in text', () => {
      store.add('imzam', 'Ömer Şahin')
      const result = store.applySnippets('Saygılarımla, imzam')
      expect(result).toBe('Saygılarımla, Ömer Şahin')
    })

    it('replaces all occurrences', () => {
      store.add('mrb', 'merhaba')
      const result = store.applySnippets('mrb dünya mrb')
      expect(result).toBe('merhaba dünya merhaba')
    })

    it('does not replace partial matches', () => {
      store.add('ad', 'Ömer')
      // "adresi" should NOT be replaced by "ad"
      const result = store.applySnippets('adresi kontrol et')
      expect(result).toBe('adresi kontrol et')
    })

    it('returns unchanged text when no snippets', () => {
      const text = 'merhaba dünya'
      expect(store.applySnippets(text)).toBe(text)
    })
  })
})

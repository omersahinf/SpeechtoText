import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import { createCustomVocabStore } from '../src/main/custom-vocab-store'

describe('createCustomVocabStore', () => {
  let store: ReturnType<typeof createCustomVocabStore>

  beforeEach(() => {
    store = createCustomVocabStore()
  })

  it('starts empty', () => {
    expect(store.getAll()).toHaveLength(0)
  })

  it('adds a vocab entry', () => {
    const e = store.add('kubernetes', 'Kubernetes')
    expect(e.term).toBe('kubernetes')
    expect(e.replacement).toBe('Kubernetes')
    expect(store.getAll()).toHaveLength(1)
  })

  it('trims term and replacement', () => {
    const e = store.add('  docker  ', '  Docker  ')
    expect(e.term).toBe('docker')
    expect(e.replacement).toBe('Docker')
  })

  it('deletes a vocab entry', () => {
    const e = store.add('t', 'T')
    store.delete(e.id)
    expect(store.getAll()).toHaveLength(0)
  })

  describe('buildPromptFragment', () => {
    it('returns empty string when no vocab', () => {
      expect(store.buildPromptFragment()).toBe('')
    })

    it('returns formatted fragment with entries', () => {
      store.add('kubernetes', 'Kubernetes')
      store.add('dodo', 'DoDo')
      const fragment = store.buildPromptFragment()
      expect(fragment).toContain('kubernetes')
      expect(fragment).toContain('Kubernetes')
      expect(fragment).toContain('dodo')
      expect(fragment).toContain('DoDo')
      expect(fragment).toContain('ÖZEL TERİMLER')
    })
  })
})

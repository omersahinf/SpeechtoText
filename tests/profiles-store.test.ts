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

import { createProfilesStore } from '../src/main/profiles-store'

describe('createProfilesStore', () => {
  let store: ReturnType<typeof createProfilesStore>

  beforeEach(() => {
    store = createProfilesStore()
  })

  it('starts with empty profiles', () => {
    expect(store.getAll()).toHaveLength(0)
  })

  it('starts with no active profile', () => {
    expect(store.getActive()).toBeNull()
    expect(store.getActiveId()).toBeNull()
  })

  it('adds a profile', () => {
    const p = store.add('İş', { llmMode: 'standard' })
    expect(p.name).toBe('İş')
    expect(p.llmMode).toBe('standard')
    expect(p.id).toBeTruthy()
    expect(store.getAll()).toHaveLength(1)
  })

  it('trims profile name', () => {
    const p = store.add('  Kişisel  ')
    expect(p.name).toBe('Kişisel')
  })

  it('updates a profile', () => {
    const p = store.add('Test')
    const updated = store.update(p.id, { name: 'Test 2', llmMode: 'conservative' })
    expect(updated?.name).toBe('Test 2')
    expect(updated?.llmMode).toBe('conservative')
  })

  it('returns null when updating non-existent profile', () => {
    expect(store.update('bad-id', { name: 'x' })).toBeNull()
  })

  it('sets and gets active profile', () => {
    const p = store.add('Profile 1')
    store.setActive(p.id)
    expect(store.getActiveId()).toBe(p.id)
    expect(store.getActive()?.name).toBe('Profile 1')
  })

  it('clears active profile on delete', () => {
    const p = store.add('Temp')
    store.setActive(p.id)
    store.delete(p.id)
    expect(store.getActiveId()).toBeNull()
    expect(store.getAll()).toHaveLength(0)
  })

  it('deletes a non-active profile without clearing active', () => {
    const p1 = store.add('P1')
    const p2 = store.add('P2')
    store.setActive(p1.id)
    store.delete(p2.id)
    expect(store.getActiveId()).toBe(p1.id)
    expect(store.getAll()).toHaveLength(1)
  })
})

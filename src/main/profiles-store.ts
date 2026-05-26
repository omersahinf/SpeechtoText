import ElectronStoreImport from 'electron-store'
import type ElectronStoreDefault from 'electron-store'
import { randomUUID } from 'node:crypto'
import type { LlmMode, VocabPreset } from '@/shared/types'
import { logger } from './logger'

export interface DictationProfile {
  id: string
  name: string
  hotkeyKeyCode?: number
  hotkeyMode?: 'push-to-talk' | 'toggle'
  llmMode?: LlmMode
  llmEnabled?: boolean
  vocabPreset?: VocabPreset
  customPrompt?: string
  createdAt: number
  updatedAt: number
}

interface ProfilesSchema {
  profiles: DictationProfile[]
  activeProfileId: string | null
}

function makeStore(): InstanceType<typeof ElectronStoreDefault<ProfilesSchema>> {
  const StoreConstructor =
    (ElectronStoreImport as unknown as { default?: typeof ElectronStoreDefault }).default ??
    (ElectronStoreImport as unknown as typeof ElectronStoreDefault)
  return new StoreConstructor<ProfilesSchema>({
    name: 'profiles',
    defaults: { profiles: [], activeProfileId: null }
  })
}

export interface ProfilesStore {
  getAll: () => DictationProfile[]
  getActive: () => DictationProfile | null
  add: (
    name: string,
    data?: Partial<Omit<DictationProfile, 'id' | 'name' | 'createdAt' | 'updatedAt'>>
  ) => DictationProfile
  update: (
    id: string,
    data: Partial<Omit<DictationProfile, 'id' | 'createdAt' | 'updatedAt'>>
  ) => DictationProfile | null
  delete: (id: string) => void
  setActive: (id: string | null) => void
  getActiveId: () => string | null
}

export function createProfilesStore(): ProfilesStore {
  const store = makeStore()

  const getAll = (): DictationProfile[] => {
    const raw = store.get('profiles')
    return Array.isArray(raw) ? raw : []
  }

  const saveAll = (profiles: DictationProfile[]): void => {
    store.set('profiles', profiles)
  }

  return {
    getAll,

    getActive(): DictationProfile | null {
      const id = store.get('activeProfileId')
      if (!id) return null
      return getAll().find((p) => p.id === id) ?? null
    },

    add(name, data = {}): DictationProfile {
      const now = Date.now()
      const profile: DictationProfile = {
        id: randomUUID(),
        name: name.trim(),
        ...data,
        createdAt: now,
        updatedAt: now
      }
      saveAll([...getAll(), profile])
      logger.debug(`[profiles] added: "${name}"`)
      return profile
    },

    update(id, data): DictationProfile | null {
      const all = getAll()
      const idx = all.findIndex((p) => p.id === id)
      if (idx === -1) return null
      const updated = { ...all[idx]!, ...data, updatedAt: Date.now() }
      const next = [...all]
      next[idx] = updated
      saveAll(next)
      return updated
    },

    delete(id: string): void {
      saveAll(getAll().filter((p) => p.id !== id))
      if (store.get('activeProfileId') === id) {
        store.set('activeProfileId', null)
      }
      logger.debug(`[profiles] deleted: ${id}`)
    },

    setActive(id: string | null): void {
      store.set('activeProfileId', id)
      logger.debug(`[profiles] active: ${id ?? 'none'}`)
    },

    getActiveId(): string | null {
      return store.get('activeProfileId') ?? null
    }
  }
}

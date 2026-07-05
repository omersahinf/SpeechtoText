import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '@/shared/types'
import { DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL } from '@/shared/constants'

const EMPTY_SETTINGS: AppSettings = {
  groqApiKey: '',
  ollamaBaseUrl: DEFAULT_OLLAMA_BASE_URL,
  ollamaModel: DEFAULT_OLLAMA_MODEL,
  dictationLanguageMode: 'tr-en',
  hotkeyKeyCode: 3640,
  hotkeyMode: 'push-to-talk',
  llmEnabled: true,
  llmMode: 'conservative',
  llmTemperature: 0.1,
  microphoneDeviceId: '',
  useClipboardInjection: true,
  onboardingCompleted: false,
  autoApply: true,
  transformMode: 'raw',
  overlayEnabled: true,
  customPrompt: '',
  vocabPreset: 'none',
  appContextEnabled: false,
  uiLanguage: 'tr',
  llmCacheEnabled: true,
  activeProfileId: null,
  appearanceAccent: 'indigo',
  appearanceMode: 'dark',
  appearanceMetaphor: 'wave',
  appearanceFont: 'system',
  radiusScale: 1
}

export interface UseSettingsReturn {
  settings: AppSettings
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>
  isSaving: boolean
  status: string
  saveSettings: () => Promise<void>
  isDirty: boolean
  canSave: boolean
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(EMPTY_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<AppSettings>(EMPTY_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    void window.api.settings.get().then((s) => {
      setSettings(s)
      setSavedSettings(s)
    })

    const unsubscribe = window.api.settings.onChanged((s) => {
      setSettings(s)
      setSavedSettings(s)
    })
    return unsubscribe
  }, [])

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)
  const canSave = isDirty

  const saveSettings = useCallback(async (): Promise<void> => {
    setIsSaving(true)
    setStatus('')
    try {
      const saved = await window.api.settings.set(settings)
      setSettings(saved)
      setSavedSettings(saved)
      setStatus('Kaydedildi.')
      setTimeout(() => setStatus(''), 3000)
    } catch {
      setStatus('Kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  return { settings, setSettings, isSaving, status, saveSettings, isDirty, canSave }
}

import { useState, useEffect, type ReactElement } from 'react'
import type { AppSettings, LlmMode, VocabPreset, CustomVocabEntry } from '@/shared/types'
import { DASHSCOPE_MODELS } from '@/shared/constants'
import { rendererLogger } from '@/renderer/lib/logger'

interface AITabProps {
  settings: AppSettings
  onChange: (patch: Partial<AppSettings>) => void
}

export function AITab({ settings, onChange }: AITabProps): ReactElement {
  const [testResult, setTestResult] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [vocabList, setVocabList] = useState<CustomVocabEntry[]>([])
  const [newTerm, setNewTerm] = useState('')
  const [newReplacement, setNewReplacement] = useState('')

  useEffect(() => {
    void window.api.customVocab
      .getAll()
      .then(setVocabList)
      .catch((e: unknown) => {
        rendererLogger.error('[AITab] custom vocab load failed', e)
      })
  }, [])

  async function testLlm(): Promise<void> {
    setIsTesting(true)
    setTestResult('')
    try {
      await window.api.settings.set(settings)
      const result = await window.api.llm.test({ mode: settings.llmMode })
      if (result.error) {
        setTestResult(`✕ Hata: ${result.error}`)
      } else if (result.fallback) {
        setTestResult(
          `⚠ Temizleme başarısız, ham metin döndü. Çıktı: "${result.output}" (${result.latencyMs}ms)`
        )
      } else {
        setTestResult(
          `✓ Başarılı (${result.latencyMs}ms). Giriş: "${result.input}" → Çıkış: "${result.output}"`
        )
      }
    } catch (error: unknown) {
      rendererLogger.error('[AITab] llm test failed', error)
      setTestResult('✕ Test başarısız: ' + String(error))
    } finally {
      setIsTesting(false)
    }
  }

  async function addVocab(): Promise<void> {
    if (!newTerm.trim() || !newReplacement.trim()) return
    try {
      const entry = await window.api.customVocab.add(newTerm.trim(), newReplacement.trim())
      setVocabList((prev) => [...prev, entry])
      setNewTerm('')
      setNewReplacement('')
    } catch (e: unknown) {
      rendererLogger.error('[AITab] vocab add failed', e)
    }
  }

  async function deleteVocab(id: string): Promise<void> {
    try {
      await window.api.customVocab.delete(id)
      setVocabList((prev) => prev.filter((v) => v.id !== id))
    } catch (e: unknown) {
      rendererLogger.error('[AITab] vocab delete failed', e)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AI Ayarları</h2>
        <p className="mt-1 text-sm text-neutral-500">Metin temizleme modeli ve davranışı</p>
      </div>

      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-5">
        <label className="flex items-center justify-between text-sm">
          <div>
            <p className="text-neutral-300 font-medium">LLM temizleme</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Kapalıyken ham transkript yapıştırılır
            </p>
          </div>
          <input
            type="checkbox"
            aria-label="LLM temizleme"
            checked={settings.llmEnabled}
            className="h-4 w-4 accent-emerald-400"
            onChange={(e) => onChange({ llmEnabled: e.target.checked })}
          />
        </label>

        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <label className="grid gap-2 text-sm">
            <span className="text-neutral-300 font-medium">Qwen Model</span>
            <select
              value={settings.dashscopeModel}
              disabled={!settings.llmEnabled}
              aria-label="Qwen Model"
              className="h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-neutral-100 outline-none transition focus:border-emerald-400 disabled:opacity-40"
              onChange={(e) => onChange({ dashscopeModel: e.target.value })}
            >
              {DASHSCOPE_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-neutral-300 font-medium">Temizleme modu</span>
            <select
              value={settings.llmMode}
              disabled={!settings.llmEnabled}
              aria-label="Temizleme modu"
              className="h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-neutral-100 outline-none transition focus:border-emerald-400 disabled:opacity-40"
              onChange={(e) => onChange({ llmMode: e.target.value as LlmMode })}
            >
              <option value="conservative">Conservative</option>
              <option value="standard">Standard</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-300 font-medium">Temperature</span>
            <span className="text-xs text-neutral-500 tabular-nums">
              {settings.llmTemperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            value={settings.llmTemperature}
            disabled={!settings.llmEnabled}
            aria-label="Temperature"
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 accent-emerald-400 disabled:opacity-40"
            onChange={(e) => onChange({ llmTemperature: parseFloat(e.target.value) })}
          />
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>Kesin</span>
            <span>Yaratıcı</span>
          </div>
        </label>

        <div className="border-t border-neutral-800/40 pt-5">
          <button
            type="button"
            disabled={!settings.llmEnabled || isTesting}
            className="h-10 rounded-lg border border-emerald-400/30 px-5 text-sm text-emerald-400 transition hover:bg-emerald-400/10 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => void testLlm()}
          >
            {isTesting ? 'Test ediliyor...' : '✦ AI Ayarlarını Test Et'}
          </button>
          {testResult && (
            <p
              role={testResult.startsWith('✓') ? 'status' : 'alert'}
              aria-live={testResult.startsWith('✓') ? 'polite' : 'assertive'}
              className={`mt-3 text-sm ${testResult.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {testResult}
            </p>
          )}
        </div>
      </div>

      {/* Bağlam & Sözlük */}
      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-5">
        <h3 className="text-sm font-semibold text-neutral-200">Bağlam & Sözlük</h3>

        <label className="grid gap-2 text-sm">
          <span className="text-neutral-300 font-medium">Sektörel Sözlük</span>
          <select
            value={settings.vocabPreset}
            aria-label="Sektörel Sözlük"
            className="h-11 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-neutral-100 outline-none transition focus:border-emerald-400"
            onChange={(e) => onChange({ vocabPreset: e.target.value as VocabPreset })}
          >
            <option value="none">Genel (yok)</option>
            <option value="software">Yazılım / Tech</option>
            <option value="medical">Sağlık / Tıp</option>
            <option value="legal">Hukuk</option>
          </select>
          <p className="text-xs text-neutral-500">
            Sektöre özel terimler ve kısaltmalar doğru yazılır
          </p>
        </label>

        <label className="flex items-center justify-between text-sm">
          <div>
            <p className="text-neutral-300 font-medium">Uygulama bağlamı</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Aktif uygulamaya göre ton ayarla (Slack → samimi, IDE → teknik)
            </p>
          </div>
          <input
            type="checkbox"
            aria-label="Uygulama bağlamı"
            checked={settings.appContextEnabled}
            className="h-4 w-4 accent-emerald-400"
            onChange={(e) => onChange({ appContextEnabled: e.target.checked })}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-neutral-300 font-medium">Ek Kural (Custom Prompt)</span>
          <textarea
            value={settings.customPrompt}
            rows={3}
            aria-label="Ek Kural"
            placeholder='Örn: Şirket adımı her zaman "FooBar" olarak yaz.'
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-emerald-400 resize-none placeholder:text-neutral-600"
            onChange={(e) => onChange({ customPrompt: e.target.value })}
          />
          <p className="text-xs text-neutral-500">Her dikteye eklenen kişisel temizleme kuralın</p>
        </label>
      </div>

      {/* Özel Sözlük */}
      <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-200">Özel Sözlük</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Belirli terimlerin her zaman istediğin gibi yazılmasını sağla
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTerm}
            aria-label="Yeni terim"
            placeholder="Terim (örn: kubernetes)"
            className="flex-1 h-9 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none transition focus:border-emerald-400 placeholder:text-neutral-600"
            onChange={(e) => setNewTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addVocab()}
          />
          <input
            type="text"
            value={newReplacement}
            aria-label="Yazılacak şekli"
            placeholder="Yazılacak şekli (örn: Kubernetes)"
            className="flex-1 h-9 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none transition focus:border-emerald-400 placeholder:text-neutral-600"
            onChange={(e) => setNewReplacement(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addVocab()}
          />
          <button
            type="button"
            className="h-9 rounded-lg bg-emerald-400 px-4 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300 disabled:opacity-40"
            disabled={!newTerm.trim() || !newReplacement.trim()}
            onClick={() => void addVocab()}
          >
            Ekle
          </button>
        </div>

        {vocabList.length === 0 ? (
          <p className="text-sm text-neutral-600 py-2">Henüz özel terim yok</p>
        ) : (
          <div className="space-y-2">
            {vocabList.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-800/60 bg-neutral-950 px-3 py-2 text-sm"
              >
                <span className="flex-1 text-neutral-300 font-mono">{v.term}</span>
                <span className="text-neutral-600">→</span>
                <span className="flex-1 text-neutral-100 font-mono">{v.replacement}</span>
                <button
                  type="button"
                  aria-label={`"${v.term}" terimini sil`}
                  className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 transition"
                  onClick={() => void deleteVocab(v.id)}
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

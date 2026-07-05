import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react'
import type { AppSettings, CustomVocabEntry, DictationLanguageMode } from '@/shared/types'
import { useSettings } from '@/renderer/hooks/useSettings'
import { applyAppearance, buildAppearanceTheme } from '@/renderer/styles/tokens'
import { ApiKeysTab, AppearanceTab, BehaviorTab } from './settings/tabs/GeneralTab'
import { KeyboardTab } from './settings/tabs/KeyboardTab'
import { MicrophoneTab } from './settings/tabs/MicrophoneTab'
import { PermissionsTab } from './settings/tabs/PermissionsTab'
import { SnippetsTab } from './settings/tabs/SnippetsTab'
import { HistoryTab } from './settings/tabs/HistoryTab'
import { AboutTab } from './settings/tabs/AboutTab'

type SettingsTab =
  | 'api'
  | 'appearance'
  | 'behavior'
  | 'microphone'
  | 'keyboard'
  | 'ai'
  | 'sozluk'
  | 'snippets'
  | 'history'
  | 'permissions'
  | 'about'

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'api', label: 'API ve Model', icon: '🔑' },
  { id: 'appearance', label: 'Görünüm', icon: '◐' },
  { id: 'behavior', label: 'Davranış', icon: '⚙' },
  { id: 'microphone', label: 'Mikrofon', icon: '🎙' },
  { id: 'keyboard', label: 'Kısayol', icon: '⌨' },
  { id: 'ai', label: 'AI Temizleme', icon: '✨' },
  { id: 'sozluk', label: 'Sözlük', icon: '📖' },
  { id: 'snippets', label: 'Snippets', icon: '📚' },
  { id: 'history', label: 'Geçmiş', icon: '🕘' },
  { id: 'permissions', label: 'İzinler', icon: '🔒' },
  { id: 'about', label: 'Hakkında', icon: 'ⓘ' }
]

const SAVE_TABS: SettingsTab[] = ['api', 'appearance', 'behavior', 'microphone', 'keyboard', 'ai']

function Toggle({ checked }: { checked: boolean }): ReactElement {
  return (
    <span
      style={{
        width: 32,
        height: 18,
        borderRadius: 999,
        position: 'relative',
        background: checked ? 'var(--sd-accent-hero)' : 'var(--sd-surface-3)',
        flex: '0 0 auto'
      }}
      aria-hidden="true"
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 16 : 2,
          width: 14,
          height: 14,
          borderRadius: 999,
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.25)'
        }}
      />
    </span>
  )
}

function SettingsAiSection({
  settings,
  onChange
}: {
  settings: AppSettings
  onChange: (patch: Partial<AppSettings>) => void
}): ReactElement {
  const theme = buildAppearanceTheme(settings)
  const a = theme.accent
  const m = theme.mode
  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderBottom: `1px solid ${m.border}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, color: m.text }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>AI Temizleme</div>
        <div style={{ fontSize: 13, color: m.textDim, marginTop: 6 }}>
          Sadece Türkçe modunda hızlı fonetik yazım, Türkçe + İngilizce modunda yerel Gemma
          temizliği.
        </div>
      </div>

      <div
        style={{
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          border: `1px solid ${m.border}`,
          background: m.surface2
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ padding: 16, borderRight: `1px solid ${m.border}` }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: m.textFaint,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              Ham
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: m.textDim,
                fontFamily: 'ui-monospace, monospace'
              }}
            >
              "<span style={{ color: m.textFaint }}>şey</span> yani{' '}
              <span style={{ color: m.textFaint }}>yaa</span> meeting'e geldim{' '}
              <span style={{ color: m.textFaint }}>hani</span> deadline yarın{' '}
              <span style={{ color: m.textFaint }}>abi</span> slide'ları akşam toparlarım"
            </div>
          </div>
          <div style={{ padding: 16, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: a.hero,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                Temizlenmiş
              </span>
              <svg width="11" height="11" viewBox="0 0 12 12" fill={a.hero} aria-hidden="true">
                <path d="M6 1L7 4.5L10.5 5.5L7 6.5L6 10L5 6.5L1.5 5.5L5 4.5Z" />
              </svg>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: m.text, fontWeight: 450 }}>
              "Meeting'e geldim, deadline yarın. Slide'ları akşam toparlarım."
            </div>
          </div>
        </div>
        <div
          style={{
            padding: '10px 16px',
            background: m.surface3,
            fontSize: 11,
            color: m.textDim,
            display: 'flex',
            gap: 14
          }}
        >
          <span>⏱ 1.4s</span>
          <span>🧹 4 dolgu kelime</span>
          <span>🌐 kod-switching korundu</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: theme.radius.lg,
          border: `1px solid ${m.border}`,
          overflow: 'hidden',
          background: m.surface2
        }}
      >
        {[
          {
            label: 'Dolgu kelime temizliği',
            desc: 'şey, yaa, hani, abi, ee gibi',
            checked: settings.llmEnabled,
            patch: { llmEnabled: !settings.llmEnabled }
          },
          {
            label: 'Noktalama düzeltmesi',
            desc: 'Virgül, soru eki (mı/mi/mu/mü), nokta',
            checked: settings.llmMode === 'conservative',
            patch: {
              llmMode: settings.llmMode === 'conservative' ? 'standard' : 'conservative'
            } satisfies Partial<AppSettings>
          },
          {
            label: 'Kod-switching koru',
            desc: 'Türkçe + İngilizce modu',
            checked: settings.dictationLanguageMode === 'tr-en',
            patch: {
              dictationLanguageMode: settings.dictationLanguageMode === 'tr-en' ? 'tr' : 'tr-en'
            } satisfies Partial<AppSettings>
          },
          {
            label: 'Yerel Gemma temizliği',
            desc:
              settings.dictationLanguageMode === 'tr'
                ? 'Sadece Türkçe modunda Gemma kullanılmaz'
                : 'Türkçe + İngilizce modunda AI temizleme',
            checked: settings.dictationLanguageMode !== 'tr' && settings.transformMode !== 'raw',
            patch: {
              transformMode: settings.transformMode === 'polish' ? 'raw' : 'polish'
            } satisfies Partial<AppSettings>
          }
        ].map((row, index, rows) => (
          <button
            key={row.label}
            type="button"
            style={{
              ...rowStyle,
              borderBottom: index < rows.length - 1 ? rowStyle.borderBottom : 0
            }}
            onClick={() => onChange(row.patch as Partial<AppSettings>)}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: m.text }}>
                {row.label}
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: m.textDim, marginTop: 1 }}>
                {row.desc}
              </span>
            </span>
            <Toggle checked={row.checked} />
          </button>
        ))}
      </div>

      <div
        style={{
          borderRadius: theme.radius.lg,
          border: `1px solid ${m.border}`,
          background: m.surface2,
          padding: 16
        }}
      >
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: m.text }}>Dikte dili</span>
          <select
            value={settings.dictationLanguageMode}
            aria-label="Dikte dili"
            style={{
              height: 40,
              borderRadius: theme.radius.md,
              border: `1px solid ${m.border}`,
              background: m.surfaceSolid,
              color: m.text,
              padding: '0 12px',
              outline: 'none'
            }}
            onChange={(event) =>
              onChange({ dictationLanguageMode: event.target.value as DictationLanguageMode })
            }
          >
            <option value="tr-en">Türkçe + İngilizce</option>
            <option value="tr">Sadece Türkçe</option>
          </select>
          <span style={{ fontSize: 11.5, color: m.textDim, lineHeight: 1.45 }}>
            Sadece Türkçe modunda Whisper Türkçe'ye zorlanır, Gemma kullanılmaz ve fonetik Türkçe
            yazım lokal uygulanır. Türkçe + İngilizce modunda dil otomatik algılanır ve Gemma
            kod-switching'i korur.
          </span>
        </label>
      </div>

      <div
        style={{
          borderRadius: theme.radius.md,
          border: `1px solid ${m.border}`,
          background: m.surface2,
          padding: 12,
          color: m.textDim,
          fontSize: 12,
          lineHeight: 1.45
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: a.hero,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 6
          }}
        >
          Gerçek pipeline
        </div>
        Konuşmayı metne çevirme Groq Whisper Large v3 ile yapılır. AI temizleme açıksa metin
        temizleme katmanı çalışır; kapalıysa ham transkript doğrudan kullanılır.
      </div>
    </div>
  )
}

function SozlukSection({ settings }: { settings: AppSettings }): ReactElement {
  const theme = buildAppearanceTheme(settings)
  const a = theme.accent
  const m = theme.mode

  const [vocabList, setVocabList] = useState<CustomVocabEntry[]>([])
  const [newTerm, setNewTerm] = useState('')
  const [newReplacement, setNewReplacement] = useState('')

  useEffect(() => {
    void window.api.customVocab
      .getAll()
      .then(setVocabList)
      .catch(() => {})
  }, [])

  async function addVocab(): Promise<void> {
    if (!newTerm.trim() || !newReplacement.trim()) return
    try {
      const entry = await window.api.customVocab.add(newTerm.trim(), newReplacement.trim())
      setVocabList((prev) => [...prev, entry])
      setNewTerm('')
      setNewReplacement('')
    } catch {
      /* ignore */
    }
  }

  async function deleteVocab(id: string): Promise<void> {
    try {
      await window.api.customVocab.delete(id)
      setVocabList((prev) => prev.filter((v) => v.id !== id))
    } catch {
      /* ignore */
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, color: m.text }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Sözlük</div>
        <div style={{ fontSize: 13, color: m.textDim, marginTop: 6 }}>
          Yanlış duyulan veya yazılan kelimeleri otomatik düzelt. Eklediğin terimler her diktede
          uygulanır.
        </div>
      </div>

      {/* Nasıl çalışır */}
      <div
        style={{
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          border: `1px solid ${m.border}`,
          background: m.surface2
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ padding: 16, borderRight: `1px solid ${m.border}` }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: m.textFaint,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              Duyulan
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: m.textDim,
                fontFamily: 'ui-monospace, monospace'
              }}
            >
              "...sonra{' '}
              <span style={{ color: '#fb7185', textDecoration: 'line-through' }}>cloud</span>'a
              sordum..."
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: a.hero,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                Düzeltilmiş
              </span>
              <svg width="11" height="11" viewBox="0 0 12 12" fill={a.hero} aria-hidden="true">
                <path d="M6 1L7 4.5L10.5 5.5L7 6.5L6 10L5 6.5L1.5 5.5L5 4.5Z" />
              </svg>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: m.text, fontWeight: 450 }}>
              "...sonra <span style={{ color: a.hero }}>Claude</span>'a sordum..."
            </div>
          </div>
        </div>
        <div
          style={{
            padding: '10px 16px',
            background: m.surface3,
            fontSize: 11,
            color: m.textDim,
            display: 'flex',
            gap: 14
          }}
        >
          <span>📖 Özel sözlük eşleşmesi</span>
          <span>🔄 Her diktede otomatik uygulanır</span>
        </div>
      </div>

      {/* Terim ekleme */}
      <div
        style={{
          borderRadius: theme.radius.lg,
          border: `1px solid ${m.border}`,
          background: m.surface2,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: m.text }}>Yeni terim ekle</div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={newTerm}
            aria-label="Yeni terim"
            placeholder="Duyulan (örn: cloud)"
            style={{
              flex: 1,
              height: 40,
              borderRadius: theme.radius.sm,
              border: `1px solid ${m.border}`,
              background: m.bg,
              padding: '0 12px',
              fontSize: 13,
              color: m.text,
              outline: 'none'
            }}
            onChange={(e) => setNewTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addVocab()}
          />
          <span style={{ color: m.textFaint, fontSize: 16, fontWeight: 600 }}>→</span>
          <input
            type="text"
            value={newReplacement}
            aria-label="Yazılacak şekli"
            placeholder="Yazılacak (örn: Claude)"
            style={{
              flex: 1,
              height: 40,
              borderRadius: theme.radius.sm,
              border: `1px solid ${m.border}`,
              background: m.bg,
              padding: '0 12px',
              fontSize: 13,
              color: m.text,
              outline: 'none'
            }}
            onChange={(e) => setNewReplacement(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addVocab()}
          />
          <button
            type="button"
            disabled={!newTerm.trim() || !newReplacement.trim()}
            style={{
              height: 40,
              borderRadius: theme.radius.sm,
              border: 0,
              background: a.hero,
              color: '#fff',
              padding: '0 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: !newTerm.trim() || !newReplacement.trim() ? 'not-allowed' : 'pointer',
              opacity: !newTerm.trim() || !newReplacement.trim() ? 0.4 : 1,
              boxShadow: `0 2px 8px rgba(${a.glowRgb}, 0.25)`
            }}
            onClick={() => void addVocab()}
          >
            Ekle
          </button>
        </div>
      </div>

      {/* Terim listesi */}
      <div
        style={{
          borderRadius: theme.radius.lg,
          border: `1px solid ${m.border}`,
          background: m.surface2,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: m.text }}>Kayıtlı terimler</div>
          <div style={{ fontSize: 12, color: m.textFaint }}>{vocabList.length} terim</div>
        </div>

        {vocabList.length === 0 ? (
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              fontSize: 13,
              color: m.textFaint
            }}
          >
            Henüz özel terim yok. Yukarıdan bir tane ekleyerek başla.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {vocabList.map((v) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${m.border}`,
                  background: m.bg,
                  padding: '10px 14px',
                  fontSize: 13
                }}
              >
                <span
                  style={{
                    flex: 1,
                    color: m.textDim,
                    fontFamily: 'ui-monospace, monospace'
                  }}
                >
                  {v.term}
                </span>
                <span style={{ color: a.hero, fontSize: 14 }}>→</span>
                <span
                  style={{
                    flex: 1,
                    color: m.text,
                    fontWeight: 500,
                    fontFamily: 'ui-monospace, monospace'
                  }}
                >
                  {v.replacement}
                </span>
                <button
                  type="button"
                  aria-label={`"${v.term}" terimini sil`}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: '#fb7185',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4
                  }}
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

export default function Settings(): ReactElement {
  const { settings, setSettings, isSaving, status, saveSettings, canSave } = useSettings()
  const [activeTab, setActiveTab] = useState<SettingsTab>('api')
  const theme = useMemo(() => buildAppearanceTheme(settings), [settings])
  const m = theme.mode
  const a = theme.accent

  useEffect(() => {
    applyAppearance(settings)
  }, [settings])

  const handleChange = (patch: Partial<AppSettings>): void => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const showSaveBar = SAVE_TABS.includes(activeTab)

  const shellStyle: CSSProperties = {
    minHeight: '100vh',
    background: m.bg,
    color: m.text,
    font: `14px ${theme.font}`
  }

  return (
    <main style={shellStyle}>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          minHeight: '100vh',
          color: m.text
        }}
      >
        <aside
          aria-label="Ayarlar menüsü"
          style={{
            background: m.surface2,
            borderRight: `1px solid ${m.border}`,
            padding: '14px 8px',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: m.textFaint,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 10px 8px'
            }}
          >
            Ayarlar
          </div>
          {TABS.map((tab) => {
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 10px',
                  border: 0,
                  borderRadius: theme.radius.sm + 2,
                  background: selected ? a.hero : 'transparent',
                  color: selected ? '#fff' : m.textDim,
                  fontSize: 13,
                  fontWeight: selected ? 600 : 500,
                  cursor: 'pointer',
                  marginBottom: 2,
                  textAlign: 'left'
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <span style={{ fontSize: 14, width: 18 }} aria-hidden="true">
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            )
          })}
        </aside>

        <div style={{ padding: 32, overflowY: 'auto', background: m.bg }}>
          {activeTab === 'ai' && <SettingsAiSection settings={settings} onChange={handleChange} />}
          {activeTab === 'sozluk' && <SozlukSection settings={settings} />}
          {activeTab === 'api' && <ApiKeysTab settings={settings} onChange={handleChange} />}
          {activeTab === 'appearance' && (
            <AppearanceTab settings={settings} onChange={handleChange} />
          )}
          {activeTab === 'behavior' && <BehaviorTab settings={settings} onChange={handleChange} />}
          {activeTab === 'keyboard' && <KeyboardTab settings={settings} onChange={handleChange} />}
          {activeTab === 'microphone' && (
            <MicrophoneTab settings={settings} onChange={handleChange} />
          )}
          {activeTab === 'permissions' && <PermissionsTab />}
          {activeTab === 'snippets' && <SnippetsTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'about' && <AboutTab />}

          {showSaveBar && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                borderTop: `1px solid ${m.border}`,
                paddingTop: 24,
                marginTop: 32
              }}
            >
              {status && (
                <span
                  role={status === 'Kaydedildi.' ? 'status' : 'alert'}
                  aria-live={status === 'Kaydedildi.' ? 'polite' : 'assertive'}
                  style={{ color: status === 'Kaydedildi.' ? a.hero : '#fb7185', fontSize: 13 }}
                >
                  {status}
                </span>
              )}
              <button
                type="button"
                disabled={!canSave || isSaving}
                style={{
                  height: 40,
                  border: 0,
                  borderRadius: theme.radius.md,
                  padding: '0 24px',
                  background: a.hero,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: !canSave || isSaving ? 'not-allowed' : 'pointer',
                  opacity: !canSave || isSaving ? 0.5 : 1,
                  boxShadow: `0 4px 14px rgba(${a.glowRgb}, 0.32)`
                }}
                onClick={() => void saveSettings()}
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

import { describe, it, expect } from 'vitest'
import {
  CLEAN_TRANSCRIPT_SYSTEM_PROMPT,
  estimateMaxTokens,
  createCleanTranscriptMessages
} from '../src/main/llm'

// --- Unit tests (no API call) ---

describe('estimateMaxTokens', () => {
  it('returns minimum 64 for short text', () => {
    expect(estimateMaxTokens('kısa')).toBeGreaterThanOrEqual(64)
  })

  it('returns at most 4096', () => {
    const longText = 'a'.repeat(10000)
    expect(estimateMaxTokens(longText)).toBeLessThanOrEqual(4096)
  })
})

describe('createCleanTranscriptMessages', () => {
  it('includes system prompt', () => {
    const messages = createCleanTranscriptMessages('test')
    expect(messages[0].content).toContain('Türkçe konuşma transkriptlerini temizleyen')
  })

  it('includes user message', () => {
    const messages = createCleanTranscriptMessages('merhaba dünya')
    expect(messages[1].content).toBe('merhaba dünya')
  })

  it('adds conservative mode instruction by default', () => {
    const messages = createCleanTranscriptMessages('test')
    const systemContent = messages[0].content as string
    expect(systemContent).toContain('Conservative')
  })

  it('adds standard mode instruction when specified', () => {
    const messages = createCleanTranscriptMessages('test', { mode: 'standard' })
    const systemContent = messages[0].content as string
    expect(systemContent).toContain('Standard')
  })
})

describe('CLEAN_TRANSCRIPT_SYSTEM_PROMPT', () => {
  it('only removes configured pause sounds', () => {
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('Sadece şu duraklama seslerini sil')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('ee')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('ııı')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('mmm')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('yaa')
  })

  it('explicitly preserves conversational Turkish words', () => {
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('KESİNLİKLE KORU')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('şey')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('hani')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('işte')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('yani')
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).not.toContain('Dolgu kelimelerini sil')
  })

  it('instructs to preserve code-switching', () => {
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('Kod-switching')
  })

  it('instructs not to change meaning', () => {
    expect(CLEAN_TRANSCRIPT_SYSTEM_PROMPT).toContain('DEĞİŞTİRME')
  })
})

// --- Integration test cases (expectations for when cleanTranscript is run) ---
// These define the expected input→output pairs for quality evaluation.
// Run these against the live API with: INTEGRATION=1 npm test

export const TURKISH_TRANSCRIPT_TEST_CASES = [
  // Dolgu kelimeleri
  {
    input: 'şey ee bugün hani toplantıya gittim yaa',
    expected: 'Şey bugün hani toplantıya gittim.',
    category: 'dolgu'
  },
  {
    input: 'yani işte ben de dedim ki ee bunu yapmalıyız',
    expected: 'Yani işte ben de dedim ki bunu yapmalıyız.',
    category: 'dolgu'
  },
  {
    input: 'ee şey şey müdür bey geldi hani onu gördüm',
    expected: 'Şey müdür bey geldi, hani onu gördüm.',
    category: 'dolgu'
  },
  {
    input: 'hani ya şimdi düşündüm de doğru söylüyorsun',
    expected: 'Hani ya şimdi düşündüm de doğru söylüyorsun.',
    category: 'dolgu'
  },
  {
    input: 'işte yaa bugün çok yoruldum abi',
    expected: 'İşte bugün çok yoruldum abi.',
    category: 'dolgu'
  },

  // Tekrar eden kelimeler
  {
    input: 'ben ben yarın geliyorum geliyorum',
    expected: 'Ben yarın geliyorum.',
    category: 'tekrar'
  },
  {
    input: 'tamam tamam tamam anladım',
    expected: 'Tamam, anladım.',
    category: 'tekrar'
  },

  // Soru eki (mı/mi/mu/mü ayrı yazım)
  {
    input: 'deadline yarın mı işte bilmiyorum',
    expected: 'Deadline yarın mı, işte bilmiyorum.',
    category: 'soru-eki'
  },
  {
    input: 'sen gelecekmisin bu akşam',
    expected: 'Sen gelecek misin bu akşam?',
    category: 'soru-eki'
  },
  {
    input: 'bunu yapmışmıydın daha önce',
    expected: 'Bunu yapmış mıydın daha önce?',
    category: 'soru-eki'
  },
  {
    input: 'burası güzelmi sence',
    expected: 'Burası güzel mi sence?',
    category: 'soru-eki'
  },
  {
    input: 'o geldiğini biliyormusun',
    expected: 'O geldiğini biliyor musun?',
    category: 'soru-eki'
  },

  // Kod-switching
  {
    input: 'ee meetinge geldim hani deadline yarın',
    expected: "Meeting'e geldim, hani deadline yarın.",
    category: 'kod-switching'
  },
  {
    input: 'şey frontend tarafında bug var deploy edemiyoruz',
    expected: 'Şey frontend tarafında bug var, deploy edemiyoruz.',
    category: 'kod-switching'
  },
  {
    input: 'pull request açtım review yapabilirmisin',
    expected: 'Pull request açtım, review yapabilir misin?',
    category: 'kod-switching'
  },
  {
    input: 'sprintdeki taskları bitirdim standup a katılıyorum',
    expected: "Sprint'teki task'ları bitirdim, standup'a katılıyorum.",
    category: 'kod-switching'
  },

  // Büyük harf ve noktalama
  {
    input: 'merhaba nasılsın bugün hava çok güzel değil mi',
    expected: 'Merhaba, nasılsın? Bugün hava çok güzel, değil mi?',
    category: 'noktalama'
  },
  {
    input: 'ankara ya gittik oradan istanbul a geçtik',
    expected: "Ankara'ya gittik, oradan İstanbul'a geçtik.",
    category: 'noktalama'
  },
  {
    input: 'ali bey sizinle görüşmek istiyor ne zaman müsaitsiniz',
    expected: 'Ali bey sizinle görüşmek istiyor, ne zaman müsaitsiniz?',
    category: 'noktalama'
  },

  // Argo/Gündelik konuşma
  {
    input: 'ya abi bu iş çok saçma lan neyse boşver',
    expected: 'Ya abi bu iş çok saçma, neyse boşver.',
    category: 'gundelik'
  },
  {
    input: 'hocam ben şey dedim hani o konuyu sormak istiyorum',
    expected: 'Hocam, ben şey dedim, hani o konuyu sormak istiyorum.',
    category: 'gundelik'
  },

  // Yazılım jargonu
  {
    input: 'ee docker container ı ayağa kaldırdım kubernetes te çalışıyor',
    expected: "Docker container'ı ayağa kaldırdım, Kubernetes'te çalışıyor.",
    category: 'yazilim'
  },
  {
    input: 'api endpoint ini test ettim postman den çağırınca 200 dönüyor',
    expected: "API endpoint'ini test ettim, Postman'den çağırınca 200 dönüyor.",
    category: 'yazilim'
  },
  {
    input: 'typescript da interface tanımladım generic type kullanacağız',
    expected: "TypeScript'te interface tanımladım, generic type kullanacağız.",
    category: 'yazilim'
  },

  // Karışık (dolgu + kod-switching + soru)
  {
    input: 'şey ee bu feature ı release edecek miyiz yani deadline ne zaman',
    expected: "Şey bu feature'ı release edecek miyiz, yani deadline ne zaman?",
    category: 'karisik'
  },
  {
    input: 'hani şimdi backend de migration çalıştırdım mı database güncellenecek herhalde',
    expected: "Hani şimdi backend'de migration çalıştırdım mı, database güncellenecek herhalde.",
    category: 'karisik'
  },

  // Kısa ifadeler
  {
    input: 'evet',
    expected: 'Evet.',
    category: 'kisa'
  },
  {
    input: 'tamam teşekkürler',
    expected: 'Tamam, teşekkürler.',
    category: 'kisa'
  },

  // Uzun paragraf
  {
    input:
      'şey bugün ee toplantıda yani hani şöyle bir şey konuştuk işte proje nin deadline ı yaklaşıyor ve biz hala backend tarafında testleri tamamlayamadık hani frontend ekibi de bekliyor yani bir an önce bitirmemiz lazım yoksa release a yetişemeyeceğiz',
    expected:
      "Şey bugün toplantıda yani hani şöyle bir şey konuştuk. İşte projenin deadline'ı yaklaşıyor ve biz hala backend tarafında testleri tamamlayamadık. Hani frontend ekibi de bekliyor, yani bir an önce bitirmemiz lazım yoksa release'a yetişemeyeceğiz.",
    category: 'uzun'
  },

  // Sayılar ve tarih
  {
    input: 'ee toplantı saat 3 te başlıyor hani 15 kişi katılacak',
    expected: "Toplantı saat 3'te başlıyor, hani 15 kişi katılacak.",
    category: 'sayi'
  }
]

describe('Turkish transcript test cases data', () => {
  it('has at least 30 test cases', () => {
    expect(TURKISH_TRANSCRIPT_TEST_CASES.length).toBeGreaterThanOrEqual(30)
  })

  it('covers all categories', () => {
    const categories = new Set(TURKISH_TRANSCRIPT_TEST_CASES.map((c) => c.category))
    expect(categories).toContain('dolgu')
    expect(categories).toContain('tekrar')
    expect(categories).toContain('soru-eki')
    expect(categories).toContain('kod-switching')
    expect(categories).toContain('noktalama')
    expect(categories).toContain('gundelik')
    expect(categories).toContain('yazilim')
    expect(categories).toContain('karisik')
    expect(categories).toContain('kisa')
    expect(categories).toContain('uzun')
  })
})

// --- Opt-in entegrasyon: gerçek API çağrısı ---
// `LLM_EVAL=1 npm test` ile çalıştır.
// Her test case için modelin çıktısını gold-standard ile karşılaştırır,
// kategori bazlı ortalama benzerlik skoru raporlar.
const RUN_INTEGRATION = process.env.LLM_EVAL === '1'

describe.skipIf(!RUN_INTEGRATION)('Turkish quality eval (live LLM)', async () => {
  const { cleanTranscript } = await import('../src/main/llm')
  const { normalizedSimilarity } = await import('../src/main/util/text-similarity')

  const results: Array<{ category: string; score: number }> = []

  for (const tc of TURKISH_TRANSCRIPT_TEST_CASES) {
    it(`[${tc.category}] "${tc.input.slice(0, 40)}…"`, async () => {
      const out = await cleanTranscript(tc.input, { mode: 'standard' })
      const score = normalizedSimilarity(out.text, tc.expected)
      results.push({ category: tc.category, score })
      // 0.6 oldukça gevşek bir alt sınır; hedef puan setine göre revize edilebilir
      expect(score).toBeGreaterThan(0.6)
    }, 30_000)
  }

  it('overall category score report', () => {
    const byCategory = new Map<string, number[]>()
    for (const r of results) {
      const arr = byCategory.get(r.category) ?? []
      arr.push(r.score)
      byCategory.set(r.category, arr)
    }

    const report: Record<string, number> = {}
    for (const [cat, scores] of byCategory) {
      report[cat] = scores.reduce((a, b) => a + b, 0) / scores.length
    }

    // Skor raporu — testin asıl çıktısı bu
    console.log('[llm-quality] kategori skorları:', report)
    expect(results.length).toBeGreaterThan(0)
  })
})

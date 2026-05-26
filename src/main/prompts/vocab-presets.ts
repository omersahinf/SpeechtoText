export type VocabPreset = 'none' | 'software' | 'medical' | 'legal'

const VOCAB_BLOCKS: Record<VocabPreset, string> = {
  none: '',
  software: `
YAZILIM SÖZLÜĞÜ — Bu terimleri standart biçimde yaz:
- API, SDK, UI, UX, CI/CD, PR, MR, CLI, IDE, ORM, HTTP, HTTPS, JSON, REST, GraphQL
- GitHub, GitLab, Docker, Kubernetes, AWS, Azure, GCP, Linux, macOS, Windows
- TypeScript, JavaScript, Python, Rust, Go, Java, Kotlin, Swift, React, Vue, Angular
- frontend, backend, fullstack (bu kelimeleri Türkçe'ye çevirme)
- Büyük/küçük harf: doğru biçimde yaz (github değil GitHub, javascript değil JavaScript)`,

  medical: `
SAĞLIK SÖZLÜĞÜ — Bu terimleri standart biçimde yaz:
- MRI, CT, EKG, ECG, ICU, ER, OR, IV, IM, SC, PO, PRN, QD, BID, TID, QID
- Tanı adlarını orijinal İngilizce veya Türkçe standart halinde koru
- İlaç adlarını tam ve doğru yaz; kısaltma ve hata kabul edilemez
- mg, mcg, mL, IU, mmHg, BPM gibi ölçü birimlerini koru`,

  legal: `
HUKUK SÖZLÜĞÜ — Bu terimleri standart biçimde yaz:
- Dava, davacı, davalı, mahkeme, bilirkişi, hâkim, savcı, avukat
- Hukuki terimleri tam ve doğru yaz; kısaltma ve hata kabul edilemez
- Madde, fıkra, bent numaralarını koru (örn: "madde 5 fıkra 2")
- Kanun adlarını tam yaz (TMK, TBK, TCK, HMK, CMK gibi kısaltmaları koru)`
}

export function getVocabBlock(preset: VocabPreset): string {
  return VOCAB_BLOCKS[preset] ?? ''
}

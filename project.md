# Project: Türkçe Sesli Dikte Uygulaması (Wispr Flow Türkçe Muadili)

## Vizyon

Türk kullanıcılar için optimize edilmiş, sistem geneli çalışan sesli dikte uygulaması. Kullanıcı bir kısayol tuşuna basılı tutar, konuşur, bırakır — konuşması temizlenmiş, doğru noktalanmış Türkçe metin olarak aktif uygulamaya yazılır.

## Hedef Kitle

- Birincil: Türk yazılımcılar, içerik üreticiler, yazarlar, akademisyenler
- İkincil: KVKK önemseyen Türk kurumsal kullanıcılar
- Pazar boşluğu: Wispr Flow Türkçe'de jenerik kalıyor (argo, kod-switching, Türkçe dolgu kelimeleri zayıf)

## Diferansiyasyon

1. **Türkçe-spesifik AI temizleme**: "şey, yaa, ee, hani, abi" gibi dolgu kelimelerini akıllıca çıkarma
2. **Kod-switching desteği**: "Meeting'e geldim, deadline yarın" gibi karışık cümleleri doğru handle etme
3. **Türkçe noktalama**: Soru eki ayrımı (mı/mi/mu/mü), virgül kuralları
4. **Sektörel sözlükler**: Hukuk, sağlık, e-ticaret, yazılım jargonu (sonraki sürüm)
5. **KVKK uyumlu opsiyon**: Türkiye'de hostlu (kurumsal satış için, sonraki sürüm)
6. **TL fiyatlama**: Wispr $15/ay yerine ₺99-149/ay erişilebilir tier

## Teknoloji Stack

### Desktop Uygulama

- **Electron** — cross-platform (macOS + Windows tek kod)
- **TypeScript** — type safety
- **React + Vite** — UI (settings, onboarding, history paneli)
- **Tailwind CSS** — hızlı styling

### Native Entegrasyonlar

- `uiohook-napi` — global hotkey dinleme
- `node-record-lpcm16` veya `mic` — mikrofon audio capture
- `@nut-tree-fork/nut-js` — sistem geneli klavye simülasyonu (text injection)
- `electron-store` — local ayar/geçmiş saklama

### Backend / API

- **Groq Whisper API** — transkripsiyon (ücretsiz tier, Türkçe, çok hızlı)
  - Sonraki: kendi fine-tune Whisper (Common Voice TR + iç data)
- **Alibaba Qwen (DashScope)** — LLM temizleme katmanı
  - Başlangıç model: `qwen-plus` (denge), gerekirse `qwen-max`
  - Sonraki opsiyon: Claude Haiku karşılaştırma için A/B
- **Supabase** — auth, kullanıcı, kullanım kotası (sonraki aşama)
- **Stripe / iyzico** — ödeme (sonraki aşama)

### Geliştirme Araçları

- ESLint + Prettier
- Vitest — unit test
- Playwright — E2E test
- electron-builder — paketleme + imzalama

## MVP Scope (Sürüm 0.1)

### Core Özellikler

- [ ] Sistem tray / menubar ikonu
- [ ] Global hotkey: `Fn` veya `Right Option` basılı tut
- [ ] Mikrofon kaydı (basılı tutulduğu süre)
- [ ] Groq Whisper'a gönder
- [ ] Alibaba Qwen ile Türkçe temizleme
- [ ] Aktif uygulamaya metni yapıştır
- [ ] Basit settings ekranı (hotkey, dil, temizleme açık/kapalı)

### Kapsam Dışı (Sonraki Sürümler)

- Auth / hesap sistemi
- Ödeme / abonelik
- Geçmiş / arama
- Sektörel sözlükler
- On-device transkripsiyon
- Cloud sync

## Mimari

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  ┌────────────────────────────────────┐ │
│  │ Global Hotkey Listener (uiohook)   │ │
│  │ Audio Recorder (mic)               │ │
│  │ ASR Client (Groq Whisper)          │ │
│  │ LLM Client (Alibaba Qwen)          │ │
│  │ Text Injector (nut-js)             │ │
│  │ Tray Icon                          │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  │
                  │ IPC
                  ▼
┌─────────────────────────────────────────┐
│       Electron Renderer (React)         │
│  ┌────────────────────────────────────┐ │
│  │ Settings UI                        │ │
│  │ Onboarding                         │ │
│  │ Recording Indicator (overlay)      │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Akış

1. Kullanıcı `Fn` tuşuna basılı tutar → tray ikonu animasyonu başlar, küçük overlay görünür
2. Mikrofon kaydı başlar (16kHz, mono, WAV)
3. Kullanıcı tuşu bırakır → kayıt durur
4. Audio Groq Whisper'a yüklenir (Türkçe forced)
5. Ham transkript Alibaba Qwen'e gider, Türkçe-özel sistem promptu ile temizlenir
6. Temiz metin aktif uygulamaya `nut-js` ile yapıştırılır
7. Tray ikonu normal hale döner

## Klasör Yapısı

```
text-to-speech/
├── project.md                    # bu dosya
├── README.md
├── package.json
├── tsconfig.json
├── electron.vite.config.ts
├── src/
│   ├── main/                     # Electron main process
│   │   ├── index.ts
│   │   ├── hotkey.ts
│   │   ├── recorder.ts
│   │   ├── asr.ts                # Groq Whisper client
│   │   ├── llm.ts                # Alibaba Qwen client
│   │   ├── injector.ts           # text yapıştırma
│   │   └── tray.ts
│   ├── preload/
│   │   └── index.ts
│   └── renderer/                 # React UI
│       ├── App.tsx
│       ├── pages/
│       │   ├── Settings.tsx
│       │   ├── Onboarding.tsx
│       │   └── Overlay.tsx
│       └── components/
├── resources/
│   └── icons/
└── tests/
```

## Gizli Anahtar Yönetimi

- API anahtarları **asla** kodda hardcode edilmeyecek
- MVP'de: `.env` dosyası (kullanıcı kendi anahtarını girer settings'ten)
- Anahtarlar Electron `safeStorage` ile şifrelenmiş halde local'e yazılır
- Production: backend proxy üzerinden anahtar saklama (kullanıcı bizim anahtarımızı görmez)

## Yol Haritası

### Faz 1 — MVP (2-3 hafta)

- Proje iskeleti
- Global hotkey + audio capture
- Groq + Alibaba Qwen entegrasyonu
- Text injection
- Basit settings

### Faz 2 — Kullanılabilirlik (2-3 hafta)

- Onboarding akışı
- İzin yönetimi (mikrofon, accessibility)
- Hata durumları, retry, offline tespit
- macOS imzalama + notarization
- Windows imzalama

### Faz 3 — Türkçe AI Katmanı (4-6 hafta)

- Türkçe-spesifik prompt mühendisliği
- Common Voice TR + iç data ile Whisper fine-tune denemesi
- Sektörel sözlük altyapısı

### Faz 4 — Ürünleştirme

- Auth (Supabase)
- Abonelik (iyzico)
- Kullanım kotası
- Landing page
- Beta launch

## API Anahtarları (Henüz Yok — Edinilecek)

- [ ] Groq API key — https://console.groq.com (ücretsiz başlangıç, ASR için)
- [x] Alibaba DashScope API key — mevcut (LLM temizleme için)
- [ ] (Sonraki, opsiyonel) Anthropic API key — Claude Haiku A/B için
- [ ] (Sonraki) Supabase project
- [ ] (Sonraki) iyzico merchant

## Riskler & Notlar

- **macOS Accessibility izni**: Kullanıcı manuel onay vermeli, onboarding'de iyi açıklanmalı
- **Windows UAC**: Bazı uygulamalara yapıştırma için yönetici izni gerekebilir
- **Latency**: Hedef konuşma sonu → metin görünümü < 2 saniye
- **Maliyet kontrolü**: Kullanıcı başına aylık API maliyeti takibi şart
- **KVKK**: Ses verisi ASR sağlayıcısına gidiyor (Groq US-based) — kurumsal sürümde Türkiye host gerekir

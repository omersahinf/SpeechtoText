# Sesli Dikte

Turkce odakli sistem geneli sesli dikte uygulamasi MVP'si.

## Kurulum

```bash
npm install
npm run dev
```

## Komutlar

- `npm run dev`: Electron gelistirme modunu baslatir.
- `npm run build`: TypeScript ve Electron/Vite build alir.
- `npm run preview`: Build'i Electron ile onizler.
- `npm run lint`: ESLint calistirir.
- `npm run test`: Vitest testlerini calistirir.
- `npm run package`: electron-builder ile paket uretir.

## Ortam Degiskenleri

`.env.example` dosyasini `.env` olarak kopyalayip anahtarlari gir:

```bash
GROQ_API_KEY=
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma2:2b
```

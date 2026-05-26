# E2E Test İskeleti

Playwright + Electron testleri için yer. Aktif değil çünkü Playwright kurulumu
ayrı bir adım gerektiriyor (`npm i -D @playwright/test playwright`).

## Kurulum (yapılması gereken)

```bash
npm i -D @playwright/test playwright
npx playwright install --with-deps
```

Sonra `playwright.config.ts` ekle:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { trace: 'on-first-retry' }
})
```

## Önerilen ilk senaryolar

1. **`launch.spec.ts`** — `_electron.launch()` ile app aç → settings ekranı görünüyor mu, başlık doğru mu
2. **`settings-persistence.spec.ts`** — API key kaydet → restart → key hala görünür mü
3. **`onboarding.spec.ts`** — Onboarding adımlarını başarıyla tamamla

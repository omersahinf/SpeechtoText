const APP_CONTEXT_MAP: Record<string, string> = {
  // IDE'ler
  'Visual Studio Code': 'IDE',
  Code: 'IDE',
  Xcode: 'IDE',
  'IntelliJ IDEA': 'IDE',
  WebStorm: 'IDE',
  PyCharm: 'IDE',
  'Android Studio': 'IDE',
  Cursor: 'IDE',

  // Terminal
  Terminal: 'terminal',
  iTerm2: 'terminal',
  Warp: 'terminal',
  Hyper: 'terminal',
  Alacritty: 'terminal',

  // Mesajlaşma
  Slack: 'messaging',
  Discord: 'messaging',
  'Microsoft Teams': 'messaging',
  Telegram: 'messaging',
  WhatsApp: 'messaging',

  // Mail
  Mail: 'email',
  Spark: 'email',
  Outlook: 'email',
  Mimestream: 'email',

  // Not alma
  Notes: 'notes',
  Notion: 'notes',
  Obsidian: 'notes',
  Bear: 'notes',
  Craft: 'notes',

  // Tarayıcı
  Safari: 'browser',
  'Google Chrome': 'browser',
  Firefox: 'browser',
  Arc: 'browser',

  // Döküman
  Pages: 'document',
  'Microsoft Word': 'document',
  'Google Docs': 'document',
  'LibreOffice Writer': 'document'
}

const CONTEXT_INSTRUCTIONS: Record<string, string> = {
  IDE: 'Uygulama bir kod editörü. Teknik terimler, değişken/fonksiyon adları ve kod-switching özellikle korunmalı. Küçük harf cümle başı kabul edilebilir. Satır sonlarına nokta ekleme.',
  terminal:
    "Uygulama bir terminal. Komutlar, flag'ler ve teknik çıktılar aynen korunmalı. Büyük harf/noktalama ekleme.",
  messaging:
    'Uygulama mesajlaşma. Rahat, samimi ton kabul edilebilir. Çok kısa mesajlarda nokta gerekmez.',
  email:
    'Uygulama e-posta. Resmi dil kullan. Cümle sonu noktalama ekle. Selamlama/kapanış kalıplarını koru.',
  notes:
    'Uygulama not defteri. Kişisel notlarda ton serbest. Madde işaretli listeler mümkünse korunmalı.',
  browser: 'Uygulama tarayıcı. URL ve arama terimlerini değiştirme. Genel metin olarak işle.',
  document:
    'Uygulama döküman editörü. Resmi Türkçe kullan. Noktalama ve büyük/küçük harf standartlarına uyu.'
}

export function getAppContextInstruction(appName: string | null | undefined): string {
  if (!appName) return ''

  const category = APP_CONTEXT_MAP[appName]
  if (!category) return ''

  const instruction = CONTEXT_INSTRUCTIONS[category]
  return instruction ? `\nUYGULAMA BAĞLAMI (${appName} — ${category}): ${instruction}` : ''
}

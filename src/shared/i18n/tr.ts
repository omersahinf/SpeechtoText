import type { Translations } from './types'

export const tr: Translations = {
  appName: 'Sesli Dikte',
  settings: {
    title: 'Ayarlar',
    tabs: {
      general: 'Genel',
      keyboard: 'Klavye',
      ai: 'AI',
      microphone: 'Mikrofon',
      permissions: 'Gizlilik ve İzinler',
      snippets: 'Snippets',
      history: 'Geçmiş',
      about: 'Hakkında'
    },
    general: {
      title: 'Genel Ayarlar',
      subtitle: 'API bağlantı ayarları',
      groqApiKey: 'Groq API Key',
      groqApiKeyGet: 'Anahtar al →',
      dashscopeApiKey: 'DashScope API Key',
      dashscopeApiKeyGet: 'Anahtar al →',
      dashscopeBaseUrl: 'DashScope Base URL',
      clipboardMethod: 'Clipboard yöntemi',
      overlayEnabled: 'Overlay göster',
      overlayEnabledDesc: 'Kayıt sırasında yüzen pencere',
      autoApply: 'Otomatik yapıştır',
      autoApplyDesc: "Kapalıyken metin clipboard'a kopyalanır",
      uiLanguage: 'Arayüz dili'
    },
    keyboard: {
      title: 'Klavye Ayarları',
      subtitle: 'Kısayol tuşu ve dikte modu',
      hotkey: 'Hotkey',
      mode: 'Dikte modu',
      pushToTalk: 'Push-to-talk',
      pushToTalkDesc: 'Basılı tut → konuş → bırak',
      toggle: 'Toggle',
      toggleDesc: 'Bas → konuş → tekrar bas'
    },
    ai: {
      title: 'AI Ayarları',
      subtitle: 'Metin temizleme davranışı',
      llmEnabled: 'LLM temizleme',
      llmEnabledDesc: 'Kapalıyken ham transkript yapıştırılır',
      model: 'Temizleme modeli',
      cleaningMode: 'Temizleme modu',
      temperature: 'Temperature',
      temperatureMin: 'Kesin',
      temperatureMax: 'Yaratıcı',
      testButton: '✦ AI Ayarlarını Test Et',
      testing: 'Test ediliyor...',
      vocabPreset: 'Sektörel Sözlük',
      vocabPresetDesc: 'Sektöre özel terimler ve kısaltmalar doğru yazılır',
      vocabPresetNone: 'Genel (yok)',
      vocabPresetSoftware: 'Yazılım / Tech',
      vocabPresetMedical: 'Sağlık / Tıp',
      vocabPresetLegal: 'Hukuk',
      appContext: 'Uygulama bağlamı',
      appContextDesc: 'Aktif uygulamaya göre ton ayarla (Slack → samimi, IDE → teknik)',
      customPrompt: 'Ek Kural (Custom Prompt)',
      customPromptPlaceholder: 'Örn: Şirket adımı her zaman "FooBar" olarak yaz.',
      customPromptDesc: 'Her dikteye eklenen kişisel temizleme kuralın',
      customVocabTitle: 'Özel Sözlük',
      customVocabDesc: 'Belirli terimlerin her zaman istediğin gibi yazılmasını sağla',
      customVocabTerm: 'Terim',
      customVocabReplacement: 'Yazılacak şekli',
      customVocabAdd: 'Ekle',
      customVocabEmpty: 'Henüz özel terim yok'
    },
    microphone: {
      title: 'Mikrofon',
      subtitle: 'Kayıt cihazı seçimi',
      device: 'Kayıt cihazı',
      deviceDefault: 'Sistem varsayılanı',
      refresh: 'Yenile',
      autoRefresh: 'Cihaz takıp çıkarınca liste otomatik yenilenir.'
    },
    permissions: {
      title: 'Gizlilik ve İzinler',
      subtitle: 'Sistem izinleri ve erişilebilirlik ayarları',
      microphone: 'Mikrofon Erişimi',
      microphoneDesc: 'Sesini duyabilmemiz için gerekli.',
      requestMic: 'Mikrofon İzni İste',
      check: 'Kontrol Et',
      openSystemSettings: 'Sistem Ayarlarını Aç',
      openSystemSettingsClose: 'Sistem Ayarlarını Aç (Kapatmak için)',
      accessibility: 'Erişilebilirlik (Accessibility)',
      accessibilityDesc: 'Global kısayol kullanımı ve metin yapıştırma için gerekli.',
      accessibilityGranted:
        '✓ İzin onaylandı. Aktif olması için uygulamayı yeniden başlatman gerekiyor.',
      restart: 'Yeniden Başlat',
      accessibilityUnsupported: 'Bu işletim sisteminde erişilebilirlik iznine gerek yok.'
    },
    snippets: {
      title: 'Snippets',
      subtitle: 'Kısa tetikleyiciyle uzun metin genişletme',
      trigger: 'Tetikleyici',
      expansion: 'Genişletme metni',
      add: 'Ekle',
      empty: 'Henüz snippet yok',
      triggerPlaceholder: 'örn: adresim',
      expansionPlaceholder: 'örn: Atatürk Cad. No:5 Kadıköy/İstanbul'
    },
    history: {
      title: 'Dikte Geçmişi',
      subtitle: 'Son {count} dikte kaydı',
      searchPlaceholder: 'Geçmişte ara…',
      deleteAll: 'Tümünü Sil',
      deleteAllConfirm: 'Tüm geçmiş silinecek. Emin misin?',
      empty: 'Henüz dikte kaydı yok',
      copy: 'Kopyala',
      delete: 'Sil',
      reinject: 'Yapıştır',
      export: 'Dışa Aktar',
      exportJson: 'JSON olarak indir',
      exportMarkdown: 'Markdown olarak indir',
      exportCsv: 'CSV olarak indir',
      rawText: 'ham göster',
      rawLabel: 'ham metin',
      latency: 'ms'
    },
    about: {
      title: 'Hakkında',
      subtitle: 'Uygulama bilgileri',
      version: 'Versiyon',
      platform: 'Platform',
      openLogs: '📂 Logları Aç',
      restartOnboarding: 'Tanıtımı Tekrar Göster',
      github: 'GitHub'
    },
    save: 'Kaydet',
    saving: 'Kaydediliyor...',
    saved: 'Kaydedildi.',
    saveFailed: 'Kaydedilemedi.',
    loadFailed: 'Ayarlar yüklenemedi.'
  },
  errors: {
    apiKeyMissing: 'API anahtarı eksik',
    apiKeyMissingDesc: 'Groq API anahtarını ayarlardan girin.',
    asrFailed: 'Transkripsiyon başarısız',
    asrFailedDesc: 'İnternet bağlantınızı kontrol edin.',
    llmFailed: 'Metin temizleme başarısız',
    llmFailedDesc: 'Ham metin yapıştırıldı.',
    injectionFailed: 'Yapıştırma başarısız',
    injectionFailedDesc: 'Metin clipboard içinde hazır.',
    audioAnalysisFailed: 'Ses analizi başarısız',
    unknownError: 'Bilinmeyen hata',
    openSettings: 'Ayarları Aç'
  },
  overlay: {
    cancelled: 'İptal edildi',
    aiSkipped: 'AI temizleme atlandı',
    clickToPaste: 'Yapıştırmak için tıkla',
    success: '✓'
  },
  tray: {
    settings: 'Ayarları aç',
    recentDictations: 'Son dikte kayıtları',
    noRecentDictations: 'Henüz kayıt yok',
    quit: 'Çıkış'
  }
}

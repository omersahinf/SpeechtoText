import type { Translations } from './types'

export const en: Translations = {
  appName: 'Voice Dictation',
  settings: {
    title: 'Settings',
    tabs: {
      general: 'General',
      keyboard: 'Keyboard',
      ai: 'AI',
      microphone: 'Microphone',
      permissions: 'Privacy & Permissions',
      snippets: 'Snippets',
      history: 'History',
      about: 'About'
    },
    general: {
      title: 'General Settings',
      subtitle: 'API connection settings',
      groqApiKey: 'Groq API Key',
      groqApiKeyGet: 'Get key →',
      ollamaBaseUrl: 'Ollama Base URL',
      ollamaModel: 'Local cleanup model',
      clipboardMethod: 'Clipboard method',
      overlayEnabled: 'Show overlay',
      overlayEnabledDesc: 'Floating window during recording',
      autoApply: 'Auto-paste',
      autoApplyDesc: 'When off, text is copied to clipboard',
      uiLanguage: 'Interface language'
    },
    keyboard: {
      title: 'Keyboard Settings',
      subtitle: 'Shortcut key and dictation mode',
      hotkey: 'Hotkey',
      mode: 'Dictation mode',
      pushToTalk: 'Push-to-talk',
      pushToTalkDesc: 'Hold → speak → release',
      toggle: 'Toggle',
      toggleDesc: 'Press → speak → press again'
    },
    ai: {
      title: 'AI Settings',
      subtitle: 'Text cleanup behavior',
      llmEnabled: 'LLM cleanup',
      llmEnabledDesc: 'When off, raw transcript is pasted',
      model: 'Cleanup model',
      cleaningMode: 'Cleanup mode',
      temperature: 'Temperature',
      temperatureMin: 'Precise',
      temperatureMax: 'Creative',
      testButton: '✦ Test AI Settings',
      testing: 'Testing...',
      vocabPreset: 'Industry Vocabulary',
      vocabPresetDesc: 'Industry-specific terms and abbreviations are written correctly',
      vocabPresetNone: 'General (none)',
      vocabPresetSoftware: 'Software / Tech',
      vocabPresetMedical: 'Healthcare / Medical',
      vocabPresetLegal: 'Legal',
      appContext: 'App context',
      appContextDesc: 'Adjust tone based on active app (Slack → casual, IDE → technical)',
      customPrompt: 'Custom Rule (Custom Prompt)',
      customPromptPlaceholder: 'E.g. Always write company name as "FooBar".',
      customPromptDesc: 'Personal cleanup rule added to every dictation',
      customVocabTitle: 'Custom Vocabulary',
      customVocabDesc: 'Ensure specific terms are always written the way you want',
      customVocabTerm: 'Term',
      customVocabReplacement: 'Write as',
      customVocabAdd: 'Add',
      customVocabEmpty: 'No custom terms yet'
    },
    microphone: {
      title: 'Microphone',
      subtitle: 'Recording device selection',
      device: 'Recording device',
      deviceDefault: 'System default',
      refresh: 'Refresh',
      autoRefresh: 'List refreshes automatically when devices change.'
    },
    permissions: {
      title: 'Privacy & Permissions',
      subtitle: 'System permissions and accessibility settings',
      microphone: 'Microphone Access',
      microphoneDesc: 'Required to hear your voice.',
      requestMic: 'Request Microphone Permission',
      check: 'Check',
      openSystemSettings: 'Open System Settings',
      openSystemSettingsClose: 'Open System Settings (to revoke)',
      accessibility: 'Accessibility',
      accessibilityDesc: 'Required for global shortcut and text injection.',
      accessibilityGranted:
        '✓ Permission granted. You need to restart the app for it to take effect.',
      restart: 'Restart',
      accessibilityUnsupported: 'Accessibility permission is not required on this OS.'
    },
    snippets: {
      title: 'Snippets',
      subtitle: 'Expand short triggers into longer text',
      trigger: 'Trigger',
      expansion: 'Expansion text',
      add: 'Add',
      empty: 'No snippets yet',
      triggerPlaceholder: 'e.g. myaddress',
      expansionPlaceholder: 'e.g. 123 Main St, Anytown, CA 90210'
    },
    history: {
      title: 'Dictation History',
      subtitle: 'Last {count} dictation records',
      searchPlaceholder: 'Search history…',
      deleteAll: 'Delete All',
      deleteAllConfirm: 'All history will be deleted. Are you sure?',
      empty: 'No dictation records yet',
      copy: 'Copy',
      delete: 'Delete',
      reinject: 'Paste',
      export: 'Export',
      exportJson: 'Download as JSON',
      exportMarkdown: 'Download as Markdown',
      exportCsv: 'Download as CSV',
      rawText: 'show raw',
      rawLabel: 'raw text',
      latency: 'ms'
    },
    about: {
      title: 'About',
      subtitle: 'Application information',
      version: 'Version',
      platform: 'Platform',
      openLogs: '📂 Open Logs',
      restartOnboarding: 'Show Introduction Again',
      github: 'GitHub'
    },
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved.',
    saveFailed: 'Could not save.',
    loadFailed: 'Could not load settings.'
  },
  errors: {
    apiKeyMissing: 'API key missing',
    apiKeyMissingDesc: 'Enter your Groq API key in settings.',
    asrFailed: 'Transcription failed',
    asrFailedDesc: 'Check your internet connection.',
    llmFailed: 'Text cleanup failed',
    llmFailedDesc: 'Raw text was pasted.',
    injectionFailed: 'Paste failed',
    injectionFailedDesc: 'Text is ready in clipboard.',
    audioAnalysisFailed: 'Audio analysis failed',
    unknownError: 'Unknown error',
    openSettings: 'Open Settings'
  },
  overlay: {
    cancelled: 'Cancelled',
    aiSkipped: 'AI cleanup skipped',
    clickToPaste: 'Click to paste',
    success: '✓'
  },
  tray: {
    settings: 'Open Settings',
    recentDictations: 'Recent dictations',
    noRecentDictations: 'No records yet',
    quit: 'Quit'
  }
}

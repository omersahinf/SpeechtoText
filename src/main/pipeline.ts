import { clipboard, net } from 'electron'
import { randomUUID } from 'node:crypto'
import type { TranscriptionResult } from './asr'
import type { CleanTranscriptResult } from './llm'
import type { HotkeyManager } from './hotkey'
import type { RecorderBridge } from './recorder-bridge'
import type { AppTray } from './tray'
import type { AppSettings, DictationEntry, LlmMode, VocabPreset } from '@/shared/types'
import {
  analyzePcm16Wav,
  isLikelySilenceHallucination,
  isVoiceCancelCommand,
  shouldSkipTranscriptionForAudio
} from './audio-analysis'
import { logger } from './logger'
import { notifyError, notifyWarn } from './notifier'
import type { OverlayWindowController } from './overlay-window'

interface PipelineDeps {
  hotkey: HotkeyManager
  recorder: RecorderBridge
  asr: {
    transcribe: (audioBuffer: Buffer) => Promise<TranscriptionResult>
  }
  llm: {
    cleanTranscript: (
      rawText: string,
      options?: {
        mode?: LlmMode
        temperature?: number
        customPrompt?: string
        vocabPreset?: VocabPreset
        appContext?: string | null
        useCache?: boolean
      }
    ) => Promise<CleanTranscriptResult>
  }
  injector: {
    injectText: (text: string) => Promise<void>
  }
  tray: AppTray
  overlay?: OverlayWindowController | null
  settings: {
    get: () => AppSettings
  }
  history?: {
    addEntry: (entry: DictationEntry) => void
  }
  getActiveApp?: () => Promise<string | null>
  snippets?: {
    applySnippets: (text: string) => string
  }
  customVocab?: {
    buildPromptFragment: () => string
    applyToText: (text: string) => string
  }
  onSettingsError?: (errorType: 'api-key-missing' | 'network-error' | 'rate-limit') => void
}

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  const status = (error as { status?: unknown }).status
  if (typeof status === 'number') {
    return status
  }

  const code = (error as { code?: unknown }).code
  if (typeof code === 'number') {
    return code
  }

  return null
}

function isConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /network|fetch|enotfound|econnreset|etimedout|eai_again|api connection/i.test(message)
}

function isTimeoutError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /timeout|timed out|zaman aşımı/i.test(message)
}

function describeApiError(error: unknown): {
  title: string
  detail: string
  overlayMessage: string
  settingsError?: 'network-error' | 'rate-limit'
} {
  const status = getErrorStatus(error)

  if (status === 401 || status === 403) {
    return {
      title: 'API anahtarı geçersiz',
      detail: 'Groq API anahtarını kontrol edin.',
      overlayMessage: 'API anahtarı geçersiz'
    }
  }

  if (status === 429) {
    return {
      title: 'Çok fazla istek',
      detail: 'Groq kotası veya hız limiti dolmuş olabilir.',
      overlayMessage: 'Çok fazla istek',
      settingsError: 'rate-limit'
    }
  }

  if (isTimeoutError(error)) {
    return {
      title: 'Transkripsiyon zaman aşımı',
      detail: 'Ağ yavaş olabilir. Kısa bir kayıtla tekrar deneyin.',
      overlayMessage: 'Zaman aşımı',
      settingsError: 'network-error'
    }
  }

  if (isConnectionError(error)) {
    return {
      title: 'İnternet bağlantısı yok',
      detail: 'Bağlantınızı kontrol edip tekrar deneyin.',
      overlayMessage: 'Çevrimdışı',
      settingsError: 'network-error'
    }
  }

  return {
    title: 'Transkripsiyon başarısız',
    detail: 'Tekrar deneyin veya API ayarlarını kontrol edin.',
    overlayMessage: 'Transkripsiyon başarısız'
  }
}

export interface Pipeline {
  handleAudioBuffer: (audioBuffer: Buffer) => Promise<void>
  handleRecorderError: (message: string) => void
  stopRecording: () => void
  cancelRecording: () => void
  dispose: () => void
}

type PipelinePhase = 'idle' | 'recording' | 'processing'

export function createPipeline(deps: PipelineDeps): Pipeline {
  let phase: PipelinePhase = 'idle'
  let recordStartedAt = 0
  let recordStoppedAt = 0

  const reset = (options: { sendOverlayIdle?: boolean } = {}): void => {
    phase = 'idle'
    deps.tray.setRecordingState(false)
    deps.tray.setProcessingState(false)
    if (options.sendOverlayIdle !== false) {
      deps.overlay?.sendState('idle')
    }
    deps.overlay?.sendLevel(0)
  }

  const startRecording = (): void => {
    logger.debug('hotkey: press')
    phase = 'recording'
    recordStartedAt = Date.now()
    deps.tray.setRecordingState(true)
    deps.overlay?.sendState('recording')
    deps.recorder.start(deps.settings.get().microphoneDeviceId)
  }

  const finishRecording = (trigger: 'release' | 'toggle' | 'overlay'): void => {
    logger.debug(`hotkey: ${trigger}`)
    recordStoppedAt = Date.now()
    phase = 'processing'
    deps.tray.setRecordingState(false)
    deps.tray.setProcessingState(true)
    deps.overlay?.sendState('processing')
    deps.overlay?.sendLevel(0)
    deps.recorder.stop()
  }

  const onPress = (): void => {
    const settings = deps.settings.get()

    if (settings.hotkeyMode === 'toggle') {
      if (phase === 'idle') {
        startRecording()
        return
      }

      if (phase === 'recording') {
        finishRecording('toggle')
        return
      }

      logger.debug(`[pipeline] ignoring toggle press while phase=${phase}`)
      return
    }

    if (phase !== 'idle') {
      logger.debug(`[pipeline] ignoring press while phase=${phase}`)
      return
    }

    startRecording()
  }

  const onRelease = (): void => {
    if (deps.settings.get().hotkeyMode === 'toggle') {
      return
    }

    if (phase !== 'recording') {
      return
    }

    finishRecording('release')
  }

  const onCancelRecording = (): void => {
    if (phase !== 'recording') {
      return
    }

    logger.debug('[pipeline] recording canceled from overlay')
    deps.recorder.cancel()
    reset()
  }

  deps.hotkey.on('press', onPress)
  deps.hotkey.on('release', onRelease)

  return {
    async handleAudioBuffer(audioBuffer: Buffer): Promise<void> {
      if (phase !== 'processing') {
        logger.debug(`[pipeline] ignoring audio while phase=${phase}`)
        return
      }

      const totalStartedAt = recordStartedAt
      const recordMs = recordStoppedAt - recordStartedAt
      const processingStartedAt = Date.now()
      let keepOverlayErrorVisible = false
      let keepOverlayMessageVisible = false

      try {
        let audioStats: ReturnType<typeof analyzePcm16Wav>
        try {
          audioStats = analyzePcm16Wav(audioBuffer)
        } catch (error) {
          logger.error('[pipeline] audio analysis failed', error)
          notifyError('Ses analizi başarısız', 'Tekrar deneyin.')
          deps.tray.flashError()
          deps.overlay?.sendState('error', { message: 'Ses analizi başarısız' })
          keepOverlayErrorVisible = true
          return
        }

        if (shouldSkipTranscriptionForAudio(audioStats)) {
          const statsMessage = audioStats
            ? `duration=${Math.round(audioStats.durationMs)}ms rms=${audioStats.rms.toFixed(5)} peak=${audioStats.peak.toFixed(5)}`
            : 'unreadable wav'

          logger.info(`[pipeline] empty recording ignored (${statsMessage})`)
          return
        }

        // --- ASR ---
        let rawText: string
        let asrMs: number

        const settings = deps.settings.get()

        if (!settings.groqApiKey) {
          notifyError('API anahtarı eksik', 'Groq API anahtarını ayarlardan girin.')
          deps.overlay?.sendState('error', { message: 'API anahtarı eksik' })
          deps.onSettingsError?.('api-key-missing')
          keepOverlayErrorVisible = true
          return
        }

        if (!net.isOnline()) {
          notifyError('Çevrimdışı', 'İnternet bağlantısı yok.')
          deps.overlay?.sendState('error', { message: 'Çevrimdışı' })
          deps.onSettingsError?.('network-error')
          keepOverlayErrorVisible = true
          return
        }

        try {
          const asrResult = await deps.asr.transcribe(audioBuffer)
          rawText = asrResult.text
          asrMs = asrResult.latencyMs
        } catch (error) {
          logger.error('[pipeline] ASR failed', error)
          const apiError = describeApiError(error)
          if (apiError.settingsError) {
            deps.onSettingsError?.(apiError.settingsError)
          }
          notifyError(apiError.title, apiError.detail)
          deps.tray.flashError()
          deps.overlay?.sendState('error', { message: apiError.overlayMessage })
          keepOverlayErrorVisible = true
          return
        }

        if (isLikelySilenceHallucination(rawText)) {
          logger.info(`[pipeline] silence hallucination ignored: "${rawText}"`)
          return
        }

        if (isVoiceCancelCommand(rawText)) {
          logger.info(`[pipeline] voice cancel command detected: "${rawText}"`)
          deps.overlay?.showMessage('İptal edildi')
          return
        }

        // --- LLM ---
        const activeApp =
          settings.appContextEnabled && deps.getActiveApp
            ? await deps.getActiveApp().catch(() => null)
            : null

        const customVocabFragment = deps.customVocab?.buildPromptFragment() ?? ''
        const combinedCustomPrompt = [settings.customPrompt, customVocabFragment]
          .filter(Boolean)
          .join('\n')

        const shouldRunLlm = settings.transformMode !== 'raw' && settings.llmEnabled
        const llmResult = !shouldRunLlm
          ? { text: rawText, latencyMs: 0 }
          : !settings.dashscopeApiKey
            ? { text: rawText, latencyMs: 0, fallback: true }
            : await deps.llm.cleanTranscript(rawText, {
                mode: settings.llmMode,
                temperature: settings.llmTemperature,
                customPrompt: combinedCustomPrompt,
                vocabPreset: settings.vocabPreset,
                appContext: activeApp,
                useCache: settings.llmCacheEnabled !== false
              })

        if (shouldRunLlm && !settings.dashscopeApiKey) {
          notifyWarn(
            'AI anahtarı eksik',
            'DashScope API anahtarı olmadığı için ham metin kullanıldı.'
          )
          deps.overlay?.showMessage('AI temizleme atlandı')
        }

        if ('fallback' in llmResult && llmResult.fallback) {
          if (settings.dashscopeApiKey) {
            notifyWarn('Metin temizleme başarısız', 'Ham metin yapıştırıldı.')
            deps.overlay?.showMessage('AI temizleme atlandı')
          }
        }

        // Snippet genişletme: pipeline'dan geçen metin snippet store'da replace edilir
        const vocabText = deps.customVocab
          ? deps.customVocab.applyToText(llmResult.text)
          : llmResult.text
        const cleanText = deps.snippets ? deps.snippets.applySnippets(vocabText) : vocabText
        const injectStartedAt = Date.now()

        // --- Inject ---
        if (!settings.autoApply) {
          clipboard.writeText(cleanText)
          deps.overlay?.showMessage('Yapıştırmak için tıkla')
          keepOverlayMessageVisible = true
          logger.info('[pipeline] autoApply=false; text copied to clipboard')
          deps.history?.addEntry({
            id: randomUUID(),
            timestamp: Date.now(),
            rawText,
            cleanText,
            latencyMs: Date.now() - totalStartedAt,
            app: activeApp ?? undefined,
            fallback: 'fallback' in llmResult ? Boolean(llmResult.fallback) : false
          })
          return
        }

        try {
          await deps.injector.injectText(cleanText)
        } catch (error) {
          logger.error('[pipeline] Injector failed', error)
          clipboard.writeText(cleanText)
          notifyError('Yapıştırma başarısız', 'Metin clipboard içinde hazır.')
          deps.tray.flashError()
          deps.overlay?.sendState('error', { message: 'Clipboard içinde hazır' })
          keepOverlayErrorVisible = true
          return
        }

        deps.overlay?.showMessage('✓')
        keepOverlayMessageVisible = true

        const injectMs = Date.now() - injectStartedAt
        const totalMs = Date.now() - totalStartedAt
        const processingWaitMs = processingStartedAt - recordStoppedAt

        // --- Geçmişe kaydet ---
        deps.history?.addEntry({
          id: randomUUID(),
          timestamp: Date.now(),
          rawText,
          cleanText,
          latencyMs: totalMs,
          app: activeApp ?? undefined,
          fallback: 'fallback' in llmResult ? Boolean(llmResult.fallback) : false
        })

        logger.info(
          `[pipeline] record=${recordMs}ms wait=${processingWaitMs}ms asr=${asrMs}ms llm=${llmResult.latencyMs}ms inject=${injectMs}ms total=${totalMs}ms`
        )
      } catch (error) {
        logger.error('[pipeline] beklenmeyen hata', error)
        notifyError('Bilinmeyen hata', 'Tekrar deneyin.')
        deps.tray.flashError()
        deps.overlay?.sendState('error', { message: 'Beklenmeyen hata' })
        keepOverlayErrorVisible = true
      } finally {
        reset({ sendOverlayIdle: !keepOverlayErrorVisible && !keepOverlayMessageVisible })
      }
    },
    handleRecorderError(message: string): void {
      logger.warn(`[pipeline] recorder failed: ${message}`)
      notifyError('Kayıt başarısız', 'Mikrofona erişilemedi.')
      deps.tray.flashError()
      deps.overlay?.sendState('error', { message: 'Kayıt başarısız' })
      reset({ sendOverlayIdle: false })
    },
    stopRecording(): void {
      if (phase !== 'recording') {
        return
      }

      finishRecording('overlay')
    },
    cancelRecording(): void {
      onCancelRecording()
    },
    dispose(): void {
      deps.hotkey.off('press', onPress)
      deps.hotkey.off('release', onRelease)
      reset()
    }
  }
}

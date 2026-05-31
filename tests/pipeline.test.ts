import { EventEmitter } from 'node:events'
import { describe, expect, it, vi, beforeEach } from 'vitest'

// Electron clipboard mock
vi.mock('electron', () => ({
  clipboard: {
    writeText: vi.fn(),
    readText: vi.fn().mockReturnValue('')
  },
  net: {
    isOnline: vi.fn().mockReturnValue(true)
  }
}))

vi.mock('../src/main/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../src/main/notifier', () => ({
  notifyError: vi.fn(),
  notifyWarn: vi.fn()
}))

import { createPipeline } from '../src/main/pipeline'
import type { AppSettings } from '@/shared/types'

function makeWavBuffer(rmsLevel = 0.05): Buffer {
  // Sample rate 16000 mono pcm16, 1s of audio with speech-like energy
  const sampleRate = 16000
  const samples = new Int16Array(sampleRate)
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = Math.round(rmsLevel * 32767 * (i % 2 === 0 ? 1 : -1))
  }
  const buffer = Buffer.alloc(44 + samples.length * 2)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(36 + samples.length * 2, 4)
  buffer.write('WAVE', 8, 'ascii')
  buffer.write('fmt ', 12, 'ascii')
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36, 'ascii')
  buffer.writeUInt32LE(samples.length * 2, 40)
  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(samples[i] ?? 0, 44 + i * 2)
  }
  return buffer
}

function silentWavBuffer(): Buffer {
  const sampleRate = 16000
  const samples = new Int16Array(sampleRate) // tüm 0
  const buffer = Buffer.alloc(44 + samples.length * 2)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(36 + samples.length * 2, 4)
  buffer.write('WAVE', 8, 'ascii')
  buffer.write('fmt ', 12, 'ascii')
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36, 'ascii')
  buffer.writeUInt32LE(samples.length * 2, 40)
  return buffer
}

const baseSettings: AppSettings = {
  groqApiKey: 'gk',
  dashscopeApiKey: 'dk',
  dashscopeBaseUrl: 'https://example',
  dashscopeModel: 'qwen',
  hotkeyKeyCode: 3640,
  hotkeyMode: 'push-to-talk',
  llmEnabled: true,
  llmMode: 'conservative',
  llmTemperature: 0.1,
  microphoneDeviceId: '',
  useClipboardInjection: true,
  onboardingCompleted: true,
  autoApply: true,
  transformMode: 'polish',
  overlayEnabled: true
}

function makeDeps(
  overrides: {
    asr?: { transcribe: ReturnType<typeof vi.fn> }
    llm?: { cleanTranscript: ReturnType<typeof vi.fn> }
    injector?: { injectText: ReturnType<typeof vi.fn> }
    settings?: Partial<AppSettings>
    customVocab?: {
      buildPromptFragment: ReturnType<typeof vi.fn>
      applyToText: ReturnType<typeof vi.fn>
    }
  } = {}
) {
  const hotkey = new EventEmitter() as EventEmitter & {
    start: () => void
    stop: () => void
    setKey: () => void
    getKey: () => number
  }
  ;(hotkey as unknown as { start: () => void }).start = () => {}
  ;(hotkey as unknown as { stop: () => void }).stop = () => {}
  ;(hotkey as unknown as { setKey: () => void }).setKey = () => {}
  ;(hotkey as unknown as { getKey: () => number }).getKey = () => 0

  const recorder = {
    start: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
    destroy: vi.fn()
  }

  const tray = {
    setRecordingState: vi.fn(),
    setProcessingState: vi.fn(),
    flashError: vi.fn(),
    destroy: vi.fn()
  }

  const overlay = {
    sendState: vi.fn(),
    sendLevel: vi.fn(),
    sendMicInfo: vi.fn(),
    sendSettings: vi.fn(),
    showMessage: vi.fn(),
    destroy: vi.fn(),
    isDestroyed: () => false
  }

  const asr = overrides.asr ?? {
    transcribe: vi.fn().mockResolvedValue({ text: 'merhaba', latencyMs: 10 })
  }
  const llm = overrides.llm ?? {
    cleanTranscript: vi.fn().mockResolvedValue({ text: 'Merhaba.', latencyMs: 5 })
  }
  const injector = overrides.injector ?? {
    injectText: vi.fn().mockResolvedValue(undefined)
  }
  const settings = { ...baseSettings, ...overrides.settings }
  const customVocab = overrides.customVocab ?? {
    buildPromptFragment: vi.fn().mockReturnValue(''),
    applyToText: vi.fn((text: string) => text)
  }

  return {
    deps: {
      hotkey: hotkey as unknown as Parameters<typeof createPipeline>[0]['hotkey'],
      recorder: recorder as unknown as Parameters<typeof createPipeline>[0]['recorder'],
      asr,
      llm,
      injector,
      tray: tray as unknown as Parameters<typeof createPipeline>[0]['tray'],
      overlay: overlay as unknown as Parameters<typeof createPipeline>[0]['overlay'],
      settings: { get: () => settings },
      customVocab
    },
    hotkey,
    asr,
    llm,
    injector,
    overlay,
    tray,
    recorder,
    customVocab
  }
}

async function transitionToProcessing(
  pipeline: ReturnType<typeof createPipeline>,
  hotkey: EventEmitter
) {
  hotkey.emit('press')
  hotkey.emit('release')
  // pipeline iç durumu artık "processing"
  void pipeline
}

describe('pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('happy path: ASR + LLM + inject', async () => {
    const { deps, hotkey, asr, llm, injector } = makeDeps()
    const pipeline = createPipeline(deps)

    await transitionToProcessing(pipeline, hotkey)
    await pipeline.handleAudioBuffer(makeWavBuffer())

    expect(asr.transcribe).toHaveBeenCalledTimes(1)
    expect(llm.cleanTranscript).toHaveBeenCalledWith(
      'merhaba',
      expect.objectContaining({
        mode: 'conservative',
        temperature: 0.1
      })
    )
    expect(injector.injectText).toHaveBeenCalledWith('Merhaba.')
  })

  it('skips inject for silent recording', async () => {
    const { deps, hotkey, asr, injector } = makeDeps()
    const pipeline = createPipeline(deps)

    await transitionToProcessing(pipeline, hotkey)
    await pipeline.handleAudioBuffer(silentWavBuffer())

    expect(asr.transcribe).not.toHaveBeenCalled()
    expect(injector.injectText).not.toHaveBeenCalled()
  })

  it('falls back to raw transcript when LLM fails (returns fallback)', async () => {
    const llm = {
      cleanTranscript: vi.fn().mockResolvedValue({ text: 'merhaba', latencyMs: 0, fallback: true })
    }
    const { deps, hotkey, injector, overlay } = makeDeps({ llm })
    const pipeline = createPipeline(deps)

    await transitionToProcessing(pipeline, hotkey)
    await pipeline.handleAudioBuffer(makeWavBuffer())

    expect(injector.injectText).toHaveBeenCalledWith('merhaba')
    expect(overlay.showMessage).toHaveBeenCalledWith('AI temizleme atlandı')
  })

  it('shows error overlay when ASR throws', async () => {
    const asr = { transcribe: vi.fn().mockRejectedValue(new Error('network')) }
    const { deps, hotkey, injector, overlay, tray } = makeDeps({ asr })
    const pipeline = createPipeline(deps)

    await transitionToProcessing(pipeline, hotkey)
    await pipeline.handleAudioBuffer(makeWavBuffer())

    expect(injector.injectText).not.toHaveBeenCalled()
    expect(tray.flashError).toHaveBeenCalled()
    expect(overlay.sendState).toHaveBeenCalledWith('error', { message: 'Çevrimdışı' })
  })

  it('skips LLM with a warning when DashScope key is missing', async () => {
    const { deps, hotkey, llm, injector, overlay } = makeDeps({
      settings: { dashscopeApiKey: '' }
    })
    const pipeline = createPipeline(deps)

    await transitionToProcessing(pipeline, hotkey)
    await pipeline.handleAudioBuffer(makeWavBuffer())

    expect(llm.cleanTranscript).not.toHaveBeenCalled()
    expect(injector.injectText).toHaveBeenCalledWith('merhaba')
    expect(overlay.showMessage).toHaveBeenCalledWith('AI temizleme atlandı')
  })

  it('applies custom vocab after LLM cleanup', async () => {
    const llm = {
      cleanTranscript: vi.fn().mockResolvedValue({ text: 'Klaud ile yaz.', latencyMs: 5 })
    }
    const customVocab = {
      buildPromptFragment: vi.fn().mockReturnValue('\nÖZEL TERİMLER'),
      applyToText: vi.fn().mockReturnValue('Claude ile yaz.')
    }
    const { deps, hotkey, injector } = makeDeps({ llm, customVocab })
    const pipeline = createPipeline(deps)

    await transitionToProcessing(pipeline, hotkey)
    await pipeline.handleAudioBuffer(makeWavBuffer())

    expect(customVocab.applyToText).toHaveBeenCalledWith('Klaud ile yaz.')
    expect(injector.injectText).toHaveBeenCalledWith('Claude ile yaz.')
  })

  it('errors when groqApiKey missing', async () => {
    const { deps, hotkey, asr, overlay } = makeDeps({ settings: { groqApiKey: '' } })
    const pipeline = createPipeline(deps)

    await transitionToProcessing(pipeline, hotkey)
    await pipeline.handleAudioBuffer(makeWavBuffer())

    expect(asr.transcribe).not.toHaveBeenCalled()
    expect(overlay.sendState).toHaveBeenCalledWith('error', { message: 'API anahtarı eksik' })
  })

  it('respects autoApply=false by copying to clipboard instead of injecting', async () => {
    const { deps, hotkey, injector, overlay } = makeDeps({ settings: { autoApply: false } })
    const pipeline = createPipeline(deps)

    await transitionToProcessing(pipeline, hotkey)
    await pipeline.handleAudioBuffer(makeWavBuffer())

    expect(injector.injectText).not.toHaveBeenCalled()
    expect(overlay.showMessage).toHaveBeenCalledWith('Yapıştırmak için tıkla')
  })

  it('skips LLM entirely when transformMode=raw', async () => {
    const { deps, hotkey, llm, injector } = makeDeps({ settings: { transformMode: 'raw' } })
    const pipeline = createPipeline(deps)

    await transitionToProcessing(pipeline, hotkey)
    await pipeline.handleAudioBuffer(makeWavBuffer())

    expect(llm.cleanTranscript).not.toHaveBeenCalled()
    expect(injector.injectText).toHaveBeenCalledWith('merhaba')
  })
})

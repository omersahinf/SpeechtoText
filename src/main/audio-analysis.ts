export interface WavAudioStats {
  sampleCount: number
  sampleRate: number
  durationMs: number
  rms: number
  peak: number
}

const MIN_TRANSCRIBE_DURATION_MS = 300
const MIN_SPEECH_RMS = 0.003
const MIN_SPEECH_PEAK = 0.015

function readAscii(view: DataView, offset: number, length: number): string {
  let value = ''

  for (let i = 0; i < length; i += 1) {
    value += String.fromCharCode(view.getUint8(offset + i))
  }

  return value
}

export function analyzePcm16Wav(audioBuffer: Buffer): WavAudioStats | null {
  if (audioBuffer.byteLength < 44) {
    return null
  }

  const view = new DataView(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.byteLength)

  if (readAscii(view, 0, 4) !== 'RIFF' || readAscii(view, 8, 4) !== 'WAVE') {
    return null
  }

  let offset = 12
  let sampleRate = 0
  let bitsPerSample = 0
  let dataOffset = -1
  let dataSize = 0

  while (offset + 8 <= view.byteLength) {
    const chunkId = readAscii(view, offset, 4)
    const chunkSize = view.getUint32(offset + 4, true)
    const chunkDataOffset = offset + 8

    if (chunkDataOffset + chunkSize > view.byteLength) {
      return null
    }

    if (chunkId === 'fmt ') {
      const audioFormat = view.getUint16(chunkDataOffset, true)
      const channels = view.getUint16(chunkDataOffset + 2, true)
      sampleRate = view.getUint32(chunkDataOffset + 4, true)
      bitsPerSample = view.getUint16(chunkDataOffset + 14, true)

      if (audioFormat !== 1 || channels !== 1 || bitsPerSample !== 16) {
        return null
      }
    }

    if (chunkId === 'data') {
      dataOffset = chunkDataOffset
      dataSize = chunkSize
      break
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2)
  }

  if (sampleRate <= 0 || bitsPerSample !== 16 || dataOffset < 0) {
    return null
  }

  const sampleCount = Math.floor(dataSize / 2)
  let sumSquares = 0
  let peak = 0

  for (let i = 0; i < sampleCount; i += 1) {
    const sample = view.getInt16(dataOffset + i * 2, true) / 32768
    const abs = Math.abs(sample)
    sumSquares += sample * sample
    peak = Math.max(peak, abs)
  }

  return {
    sampleCount,
    sampleRate,
    durationMs: sampleRate > 0 ? (sampleCount / sampleRate) * 1000 : 0,
    rms: sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0,
    peak
  }
}

export function shouldSkipTranscriptionForAudio(stats: WavAudioStats | null): boolean {
  if (!stats) {
    return false
  }

  if (stats.sampleCount === 0 || stats.durationMs < MIN_TRANSCRIBE_DURATION_MS) {
    return true
  }

  return stats.rms < MIN_SPEECH_RMS && stats.peak < MIN_SPEECH_PEAK
}

const CANCEL_PATTERNS = [/^iptal\s+et$/i, /^iptal$/i, /^vazgeç$/i, /^sil\s+bunu$/i, /^bunu\s+sil$/i]

export function isVoiceCancelCommand(text: string): boolean {
  const normalized = text.trim().toLocaleLowerCase('tr')
  return CANCEL_PATTERNS.some((p) => p.test(normalized))
}

export function isLikelySilenceHallucination(text: string): boolean {
  const normalized = text
    .toLocaleLowerCase('tr')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return true
  }

  const ascii = normalized
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')

  const knownHallucinations = new Set([
    'altyazi',
    'altyazilar',
    'altyazi m k',
    'altyazi mk',
    'alt yazi',
    'abone olmayi unutmayin',
    'yorumlarinizi bekliyorum',
    'tekrar gorusmek uzere',
    'izlediginiz icin tesekkurler',
    'beni izlediginiz icin tesekkur ederim'
  ])

  return knownHallucinations.has(ascii)
}

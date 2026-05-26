export const TARGET_SAMPLE_RATE = 16000

export function mergeChunks(recordedChunks: Float32Array[]): Float32Array {
  const totalLength = recordedChunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const merged = new Float32Array(totalLength)
  let offset = 0

  for (const chunk of recordedChunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }

  return merged
}

export function downsampleBuffer(buffer: Float32Array, sourceSampleRate: number): Float32Array {
  if (sourceSampleRate === TARGET_SAMPLE_RATE) {
    return buffer
  }

  if (sourceSampleRate < TARGET_SAMPLE_RATE) {
    throw new Error(`Input sample rate ${sourceSampleRate} is lower than ${TARGET_SAMPLE_RATE}`)
  }

  const ratio = sourceSampleRate / TARGET_SAMPLE_RATE
  const outputLength = Math.floor(buffer.length / ratio)
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio)
    const end = Math.min(Math.floor((i + 1) * ratio), buffer.length)
    let sum = 0
    let count = 0

    for (let j = start; j < end; j += 1) {
      sum += buffer[j] ?? 0
      count += 1
    }

    output[i] = count > 0 ? sum / count : 0
  }

  return output
}

export function encodeWav(samples: Float32Array, sampleRate = TARGET_SAMPLE_RATE): ArrayBuffer {
  const bytesPerSample = 2
  const blockAlign = bytesPerSample
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  const view = new DataView(buffer)

  const writeString = (offset: number, value: string): void => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * bytesPerSample, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, samples.length * bytesPerSample, true)

  let offset = 44
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample))
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
    offset += bytesPerSample
  }

  return buffer
}

export function calculateRms(samples: Float32Array): number {
  let sum = 0

  for (const sample of samples) {
    sum += sample * sample
  }

  return Math.sqrt(sum / Math.max(1, samples.length))
}

import { createReadStream } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Groq from 'groq-sdk'
import { withRetry, withTimeout } from './util/retry'

export interface TranscribeOptions {
  language?: string
}

export interface TranscriptionResult {
  text: string
  latencyMs: number
}

const DEFAULT_MODEL = 'whisper-large-v3'
const DEFAULT_LANGUAGE = 'tr'
const REQUEST_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 500

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing')
  }

  return new Groq({
    apiKey,
    timeout: REQUEST_TIMEOUT_MS
  })
}

async function transcribeOnce(client: Groq, audioPath: string, language: string): Promise<string> {
  const result = await client.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: process.env.GROQ_ASR_MODEL ?? DEFAULT_MODEL,
    language
  })

  return result.text.trim()
}

export async function transcribe(
  audioBuffer: Buffer,
  options: TranscribeOptions = {}
): Promise<TranscriptionResult> {
  const startedAt = Date.now()
  const language = options.language ?? DEFAULT_LANGUAGE
  const client = getGroqClient()
  const tempDir = await mkdtemp(join(tmpdir(), 'sesli-dikte-asr-'))
  const audioPath = join(tempDir, `audio-${Date.now()}.wav`)

  try {
    await writeFile(audioPath, audioBuffer)

    const text = await withRetry(
      () => withTimeout(transcribeOnce(client, audioPath, language), REQUEST_TIMEOUT_MS, 'asr'),
      {
        maxAttempts: MAX_ATTEMPTS,
        baseDelayMs: BASE_RETRY_DELAY_MS,
        label: 'asr'
      }
    )

    return { text, latencyMs: Date.now() - startedAt }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {
      // best-effort cleanup; orphaned temp files are harmless
    })
  }
}

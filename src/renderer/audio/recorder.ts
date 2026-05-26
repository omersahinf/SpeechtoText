import { calculateRms, downsampleBuffer, encodeWav, mergeChunks } from './wav'

let audioContext: AudioContext | null = null
let sourceNode: MediaStreamAudioSourceNode | null = null
let processorNode: ScriptProcessorNode | null = null
let mediaStream: MediaStream | null = null
let chunks: Float32Array[] = []
let inputSampleRate = 48000
let isRecording = false
let lastLevelSentAt = 0

function sendLevel(samples: Float32Array): void {
  const now = performance.now()

  if (now - lastLevelSentAt < 33) {
    return
  }

  lastLevelSentAt = now
  window.api.audio.sendRecordingLevel(Math.min(1, calculateRms(samples) * 12))
}

async function sendMicInfo(deviceId: string, stream: MediaStream): Promise<void> {
  const track = stream.getAudioTracks()[0]
  const settingsDeviceId = track?.getSettings().deviceId
  const trackLabel = track?.label
  let label = trackLabel || ''

  if (!label && navigator.mediaDevices?.enumerateDevices) {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const activeDevice = devices.find(
      (device) =>
        device.kind === 'audioinput' &&
        (device.deviceId === deviceId || device.deviceId === settingsDeviceId)
    )
    label = activeDevice?.label ?? ''
  }

  window.api.audio.sendMicInfo({
    label: label || 'Varsayılan mikrofon',
    auto: !deviceId
  })
}

export async function startRecording(deviceId = ''): Promise<void> {
  if (isRecording) {
    return
  }

  chunks = []
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    }
  })
  void sendMicInfo(deviceId, mediaStream).catch(() => {
    window.api.audio.sendMicInfo({
      label: 'Varsayılan mikrofon',
      auto: !deviceId
    })
  })

  audioContext = new AudioContext()
  inputSampleRate = audioContext.sampleRate
  sourceNode = audioContext.createMediaStreamSource(mediaStream)
  processorNode = audioContext.createScriptProcessor(1024, 1, 1)

  processorNode.onaudioprocess = (event): void => {
    if (!isRecording) {
      return
    }

    const input = event.inputBuffer.getChannelData(0)
    sendLevel(input)
    chunks.push(new Float32Array(input))

    const output = event.outputBuffer.getChannelData(0)
    output.fill(0)
  }

  sourceNode.connect(processorNode)
  processorNode.connect(audioContext.destination)
  isRecording = true
}

export async function stopRecording(): Promise<ArrayBuffer> {
  if (!isRecording) {
    return encodeWav(new Float32Array())
  }

  isRecording = false

  processorNode?.disconnect()
  sourceNode?.disconnect()
  mediaStream?.getTracks().forEach((track) => track.stop())

  if (audioContext && audioContext.state !== 'closed') {
    await audioContext.close()
  }

  processorNode = null
  sourceNode = null
  mediaStream = null
  audioContext = null

  const merged = mergeChunks(chunks)
  chunks = []

  return encodeWav(downsampleBuffer(merged, inputSampleRate))
}

export async function cancelRecording(): Promise<void> {
  if (!isRecording) {
    return
  }

  isRecording = false

  processorNode?.disconnect()
  sourceNode?.disconnect()
  mediaStream?.getTracks().forEach((track) => track.stop())

  if (audioContext && audioContext.state !== 'closed') {
    await audioContext.close()
  }

  processorNode = null
  sourceNode = null
  mediaStream = null
  audioContext = null
  chunks = []
  window.api.audio.sendRecordingLevel(0)
}

export function installAudioRecorderBridge(): void {
  let pendingStart: Promise<void> | null = null

  window.api.audio.onStartRecording((deviceId) => {
    pendingStart = startRecording(deviceId)
      .catch((error: unknown) => {
        window.api.audio.sendRecordingError(String(error))
      })
      .finally(() => {
        pendingStart = null
      })
  })

  window.api.audio.onStopRecording(() => {
    void Promise.resolve(pendingStart)
      .then(() => stopRecording())
      .then((buffer) => window.api.audio.sendRecordingComplete(buffer))
      .catch((error: unknown) => window.api.audio.sendRecordingError(String(error)))
  })

  window.api.audio.onCancelRecording(() => {
    void Promise.resolve(pendingStart)
      .then(() => cancelRecording())
      .catch((error: unknown) => window.api.audio.sendRecordingError(String(error)))
  })
}

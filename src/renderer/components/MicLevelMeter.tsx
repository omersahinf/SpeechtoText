import { useEffect, useRef, useState, type ReactElement } from 'react'

interface MicLevelMeterProps {
  isActive: boolean
  deviceId?: string
}

export function MicLevelMeter({ isActive, deviceId }: MicLevelMeterProps): ReactElement {
  const [level, setLevel] = useState(0)
  const [hasSignal, setHasSignal] = useState(false)
  const animationRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!isActive) {
      setLevel(0)
      setHasSignal(false)
      return
    }

    let isMounted = true

    async function startAnalyser(): Promise<void> {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        const ctx = new AudioContext()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.5
        source.connect(analyser)

        streamRef.current = stream
        contextRef.current = ctx
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const tick = (): void => {
          if (!isMounted) {
            return
          }

          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] ?? 0
          }
          const avg = sum / dataArray.length
          const normalized = Math.min(1, avg / 128)

          setLevel(normalized)
          setHasSignal(normalized > 0.05)
          animationRef.current = requestAnimationFrame(tick)
        }

        tick()
      } catch (error) {
        console.error('[MicLevelMeter] Failed to start analyser', error)
      }
    }

    void startAnalyser()

    return () => {
      isMounted = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (contextRef.current && contextRef.current.state !== 'closed') {
        void contextRef.current.close()
      }
    }
  }, [isActive, deviceId])

  const barCount = 20
  const bars = Array.from({ length: barCount }, (_, i) => {
    const threshold = i / barCount
    const isLit = level > threshold
    return isLit
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 h-8">
        {bars.map((isLit, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm transition-all duration-75 ${
              isLit
                ? i < barCount * 0.6
                  ? 'bg-sd-accent'
                  : i < barCount * 0.85
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
                : 'bg-neutral-800'
            }`}
            style={{
              height: isLit ? `${Math.max(20, level * 100)}%` : '20%',
              minHeight: '4px'
            }}
          />
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        {!isActive
          ? 'Mikrofon durdu'
          : hasSignal
            ? '✓ Konuşmanı duyuyorum'
            : 'Konuşmayı bekliyor...'}
      </p>
    </div>
  )
}

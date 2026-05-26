import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react'

interface VoiceLineProps {
  level: number
}

function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = (): void => setReducedMotion(query.matches)

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

export function VoiceLine({ level }: VoiceLineProps): ReactElement {
  const reducedMotion = useReducedMotion()
  const [time, setTime] = useState(0)
  const bars = useMemo(() => Array.from({ length: 20 }, (_, index) => index), [])
  const clampedLevel = Math.max(0, Math.min(1, level))

  useEffect(() => {
    if (reducedMotion) {
      return
    }

    let frame = 0
    const loop = (nextTime: number): void => {
      setTime(nextTime / 1000)
      frame = window.requestAnimationFrame(loop)
    }

    frame = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(frame)
  }, [reducedMotion])

  if (reducedMotion) {
    return (
      <div className="voice-line voice-line--reduced" aria-label="Kayıt yapılıyor">
        <span className="voice-line__dot" />
        <span className="voice-line__dot" />
        <span className="voice-line__dot" />
      </div>
    )
  }

  return (
    <div className="voice-line" aria-hidden="true">
      {bars.map((index) => {
        const phase = index * 0.58
        const baseline = 3.5 + Math.sin(time * 3.2 + phase) * 0.5
        const response = clampedLevel * (6 + ((Math.sin(time * 8 + phase) + 1) / 2) * 5)
        const height = Math.max(3, Math.min(14, baseline + response))

        return (
          <span
            key={index}
            className="voice-line__bar"
            style={{ '--bar-height': height + 'px' } as CSSProperties}
          />
        )
      })}
    </div>
  )
}

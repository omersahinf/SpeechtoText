import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react'

interface WaveProps {
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

export function Wave({ level }: WaveProps): ReactElement {
  const reducedMotion = useReducedMotion()
  const [time, setTime] = useState(0)
  const bars = useMemo(() => Array.from({ length: 22 }, (_, index) => index), [])
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
        const envelope = Math.sin((index / (bars.length - 1)) * Math.PI) * 0.8 + 0.2
        const phase = time * 7.4 + index * 0.55
        const baseline = 2 + Math.abs(Math.sin(phase)) * 4
        const response = clampedLevel * (5 + Math.abs(Math.cos(phase * 1.35)) * 8)
        const height = Math.max(2, Math.min(14, (baseline + response) * envelope))

        return (
          <span
            key={index}
            className="voice-line__bar"
            style={{ '--bar-height': `${height}px` } as CSSProperties}
          />
        )
      })}
    </div>
  )
}

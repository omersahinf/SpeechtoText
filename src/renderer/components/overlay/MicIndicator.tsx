import type { ReactElement } from 'react'
import type { OverlayMicInfo } from '@/shared/types'

interface MicIndicatorProps {
  info: OverlayMicInfo | null
}

export function MicIndicator({ info }: MicIndicatorProps): ReactElement | null {
  if (!info) {
    return null
  }

  const label = info.label.replace(/^Default - /, '').replace(/\s*\(Built-in\)/, '')
  const prefix = info.auto ? 'Auto-detect' : 'Mikrofon'

  return (
    <div className="overlay-mic-indicator" role="status">
      {prefix}: {label}
    </div>
  )
}

import type { MouseEventHandler, ReactElement } from 'react'
import type { TransformMode } from '@/shared/types'

interface MenuPanelProps {
  autoApply: boolean
  transformMode: TransformMode
  onAutoApplyChange: (enabled: boolean) => void
  onTransformModeChange: (mode: TransformMode) => void
  onOpenSettings: () => void
  onMouseEnter?: MouseEventHandler<HTMLDivElement>
  onMouseLeave?: MouseEventHandler<HTMLDivElement>
}

export function MenuPanel({
  autoApply,
  transformMode,
  onAutoApplyChange,
  onTransformModeChange,
  onOpenSettings,
  onMouseEnter,
  onMouseLeave
}: MenuPanelProps): ReactElement {
  return (
    <div
      className="overlay-menu"
      role="menu"
      aria-label="Dikte ayarları"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="overlay-menu-row">
        <span className="overlay-menu-label">Dikteden sonra otomatik uygula</span>
        <button
          type="button"
          className={`overlay-toggle ${autoApply ? 'overlay-toggle--on' : ''}`}
          aria-pressed={autoApply}
          aria-label="Dikteden sonra otomatik uygula"
          onClick={() => onAutoApplyChange(!autoApply)}
        />
      </div>

      <div className="overlay-segment" aria-label="Transform modu">
        <button
          type="button"
          aria-pressed={transformMode === 'polish'}
          onClick={() => onTransformModeChange('polish')}
        >
          Polish
        </button>
        <button
          type="button"
          aria-pressed={transformMode === 'raw'}
          onClick={() => onTransformModeChange('raw')}
        >
          Ham metin
        </button>
      </div>

      <button type="button" className="overlay-link" onClick={onOpenSettings}>
        Ayarları aç
      </button>
    </div>
  )
}

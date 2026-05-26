import type { MouseEventHandler, ReactElement } from 'react'

interface IdlePillProps {
  message?: string
  onClick: () => void
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>
}

function MicIcon(): ReactElement {
  return (
    <svg className="overlay-svg-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="2.5" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.75 7.5a4.25 4.25 0 0 0 8.5 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M8 12v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IdlePill({
  message,
  onClick,
  onMouseEnter,
  onMouseLeave
}: IdlePillProps): ReactElement {
  if (message) {
    return (
      <button
        type="button"
        className="overlay-pill overlay-pill--idle overlay-pill--message"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label="Dikte menüsü"
      >
        <span className="overlay-icon" aria-hidden="true">
          <MicIcon />
        </span>
        <span className="overlay-pill__label">{message}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className="overlay-pill overlay-pill--idle"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label="Dikte menüsü"
    >
      <span className="overlay-idle-core" aria-hidden="true" />
    </button>
  )
}

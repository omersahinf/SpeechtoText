import type { ReactElement } from 'react'

export function Dot(): ReactElement {
  return (
    <div className="overlay-dot-viz" aria-label="Kayıt yapılıyor">
      <span className="overlay-dot-viz__wrap" aria-hidden="true">
        <span className="overlay-dot-viz__core" />
        <span className="overlay-dot-viz__ring" />
        <span className="overlay-dot-viz__ring overlay-dot-viz__ring--late" />
      </span>
      <span className="overlay-dot-viz__label">dinleniyor</span>
    </div>
  )
}

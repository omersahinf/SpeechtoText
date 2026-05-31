import type { ReactElement } from 'react'

export function Blob(): ReactElement {
  return (
    <div className="overlay-blob" aria-label="Kayıt yapılıyor">
      <span className="overlay-blob__main" aria-hidden="true" />
      <span className="overlay-blob__ghost" aria-hidden="true" />
    </div>
  )
}

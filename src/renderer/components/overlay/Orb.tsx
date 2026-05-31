import type { ReactElement } from 'react'

export function Orb(): ReactElement {
  return (
    <div className="overlay-orb" aria-label="Kayıt yapılıyor">
      <span className="overlay-orb__halo" aria-hidden="true" />
      <span className="overlay-orb__core" aria-hidden="true" />
    </div>
  )
}

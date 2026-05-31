import type { ReactElement } from 'react'

interface BrandMarkProps {
  size?: number
  className?: string
}

export function BrandMark({ size = 28, className }: BrandMarkProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="1.5" y="1.5" width="25" height="25" rx="7.5" fill="url(#sd-brand-grad)" />
      <path
        d="M9 13q5-5 10 0"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M11.5 14.5q2.5-2.5 5 0"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect x="12.5" y="14" width="3" height="6.5" rx="1.5" fill="rgba(255,255,255,0.96)" />
      <path
        d="M11 19q3 3 6 0"
        stroke="rgba(255,255,255,0.96)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="sd-brand-grad" x1="2" y1="2" x2="26" y2="26">
          <stop stopColor="var(--sd-accent-hero, #6366f1)" />
          <stop offset="1" stopColor="var(--sd-accent-deep, #4338ca)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sd: {
          bg: 'var(--sd-bg)',
          deep: 'var(--sd-bg-deep)',
          surface: 'var(--sd-surface)',
          solid: 'var(--sd-surface-solid)',
          muted: 'var(--sd-surface-2)',
          hover: 'var(--sd-surface-3)',
          border: 'var(--sd-border)',
          text: 'var(--sd-text)',
          dim: 'var(--sd-text-dim)',
          faint: 'var(--sd-text-faint)',
          accent: 'var(--sd-accent-hero)',
          accentSoft: 'var(--sd-accent-soft)',
          accentDeep: 'var(--sd-accent-deep)'
        }
      },
      borderRadius: {
        sdSm: 'var(--sd-radius-sm)',
        sdMd: 'var(--sd-radius-md)',
        sdLg: 'var(--sd-radius-lg)',
        sdXl: 'var(--sd-radius-xl)',
        sdPill: 'var(--sd-radius-pill)'
      },
      fontFamily: {
        sd: 'var(--sd-font)'
      },
      boxShadow: {
        sdSoft: 'var(--sd-shadow-soft)',
        sdHard: 'var(--sd-shadow-hard)',
        sdGlow: '0 4px 14px rgba(var(--sd-accent-glow-rgb), 0.32)'
      }
    }
  },
  plugins: []
}

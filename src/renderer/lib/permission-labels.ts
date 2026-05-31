export interface PermissionLabel {
  text: string
  color: string
}

export function getPermissionLabel(status: string): PermissionLabel {
  if (status === 'granted') {
    return { text: '✓ Hazır', color: 'text-sd-accent' }
  }
  if (status === 'unsupported') {
    return { text: '— Gerekli değil', color: 'text-neutral-500' }
  }
  if (status === 'not-determined') {
    return { text: '● Bekliyor', color: 'text-yellow-400' }
  }
  return { text: '✕ Eksik', color: 'text-red-400' }
}

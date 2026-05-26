import { shell, systemPreferences } from 'electron'
import type { PermissionSnapshot } from '@/shared/types'
import { logger } from './logger'

const ACCESSIBILITY_POLL_MS = 2000

function getMicrophoneStatus(): PermissionSnapshot['microphone'] {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    return systemPreferences.getMediaAccessStatus('microphone') as PermissionSnapshot['microphone']
  }

  return 'unknown'
}

function getAccessibilityStatus(): PermissionSnapshot['accessibility'] {
  if (process.platform !== 'darwin') {
    return 'unsupported'
  }

  return systemPreferences.isTrustedAccessibilityClient(false) ? 'granted' : 'denied'
}

export function checkPermissions(): PermissionSnapshot {
  return {
    platform: process.platform,
    microphone: getMicrophoneStatus(),
    accessibility: getAccessibilityStatus()
  }
}

export async function requestMicrophonePermission(): Promise<PermissionSnapshot> {
  if (process.platform === 'darwin') {
    await systemPreferences.askForMediaAccess('microphone')
  }

  return checkPermissions()
}

export async function openAccessibilitySettings(): Promise<void> {
  if (process.platform === 'darwin') {
    await shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'
    )
  }
}

export async function openMicrophoneSettings(): Promise<void> {
  if (process.platform === 'darwin') {
    await shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone'
    )
  }
}

/**
 * Polls Accessibility permission status every 2 seconds.
 * Calls `onGranted` once when the permission transitions from denied → granted.
 * Polling stops automatically after grant. Returns a cleanup function for early stop.
 */
export function watchAccessibilityPermission(onGranted: () => void): () => void {
  if (process.platform !== 'darwin') {
    return () => {}
  }

  let lastStatus = systemPreferences.isTrustedAccessibilityClient(false)
  let stopped = false
  logger.debug(`[permissions] watching accessibility, initial=${lastStatus}`)

  const stop = (reason: string): void => {
    if (stopped) {
      return
    }
    stopped = true
    clearInterval(timer)
    logger.debug(`[permissions] stopped watching accessibility (${reason})`)
  }

  const timer = setInterval(() => {
    if (stopped) {
      return
    }

    const currentStatus = systemPreferences.isTrustedAccessibilityClient(false)

    if (currentStatus && !lastStatus) {
      logger.info('[permissions] accessibility permission granted')
      try {
        onGranted()
      } finally {
        stop('granted')
      }
      return
    }

    lastStatus = currentStatus
  }, ACCESSIBILITY_POLL_MS)

  return () => stop('manual')
}

import { Notification } from 'electron'
import { logger } from './logger'

type NotifyLevel = 'info' | 'warn' | 'error'

const RATE_LIMIT_MS = 30_000
const recentNotifications = new Map<string, number>()

function getRateLimitKey(level: NotifyLevel, title: string): string {
  return `${level}:${title}`
}

function isRateLimited(key: string): boolean {
  const lastShown = recentNotifications.get(key)
  if (!lastShown) {
    return false
  }

  return Date.now() - lastShown < RATE_LIMIT_MS
}

export function notify(level: NotifyLevel, title: string, body: string): void {
  const key = getRateLimitKey(level, title)

  if (isRateLimited(key)) {
    logger.debug(`[notifier] rate-limited: ${title}`)
    return
  }

  recentNotifications.set(key, Date.now())
  logger.info(`[notifier] ${level}: ${title} — ${body}`)

  if (!Notification.isSupported()) {
    logger.warn(`[notifier] notifications not supported on this platform`)
    return
  }

  new Notification({ title, body }).show()
}

export function notifyError(title: string, body: string): void {
  notify('error', title, body)
}

export function notifyWarn(title: string, body: string): void {
  notify('warn', title, body)
}

export function notifyInfo(title: string, body: string): void {
  notify('info', title, body)
}

import log from 'electron-log'
import { app, shell } from 'electron'
import { join } from 'node:path'

// Safely detect if running in packaged mode
function isPackaged(): boolean {
  try {
    return app?.isPackaged ?? false
  } catch {
    return false
  }
}

function getLogLevel(): 'info' | 'debug' {
  return isPackaged() ? 'info' : 'debug'
}

// Configure electron-log
log.transports.file.level = getLogLevel()
log.transports.console.level = 'debug'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB rotation

// Prevent PII — override default format to strip potential PII
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}'

export const logger = {
  debug: (...args: unknown[]): void => log.debug(...args),
  info: (...args: unknown[]): void => log.info(...args),
  warn: (...args: unknown[]): void => log.warn(...args),
  error: (...args: unknown[]): void => log.error(...args)
}

export function getLogPath(): string {
  return log.transports.file.getFile().path
}

export function getLogDir(): string {
  try {
    return join(app.getPath('logs'))
  } catch {
    return ''
  }
}

export async function openLogFile(): Promise<void> {
  const logPath = getLogPath()
  await shell.openPath(logPath)
}

export async function openLogDir(): Promise<void> {
  const logDir = getLogDir()
  if (logDir) {
    await shell.openPath(logDir)
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function send(level: LogLevel, ...args: unknown[]): void {
  // Renderer'da IPC mevcutsa main'e ilet
  if (typeof window !== 'undefined' && window.api && 'log' in window.api) {
    const message = args
      .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ')
    ;(window.api as unknown as { log: (level: LogLevel, msg: string) => void }).log(level, message)
  }

  // Her zaman console'a da yaz (DevTools)
  switch (level) {
    case 'debug':
      console.debug(...args)
      break
    case 'info':
      console.info(...args)
      break
    case 'warn':
      console.warn(...args)
      break
    case 'error':
      console.error(...args)
      break
  }
}

export const rendererLogger = {
  debug: (...args: unknown[]): void => send('debug', ...args),
  info: (...args: unknown[]): void => send('info', ...args),
  warn: (...args: unknown[]): void => send('warn', ...args),
  error: (...args: unknown[]): void => send('error', ...args)
}

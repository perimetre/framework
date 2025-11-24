/**
 * Simple console-based logger for the example
 * In production, you would use a proper logging library like Winston
 */

type LogLevel = 'debug' | 'error' | 'info' | 'warn';

/**
 *
 */
function log(level: LogLevel, message: string, ...args: unknown[]) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  console[level === 'debug' ? 'log' : level](prefix, message, ...args);
}

export const logger = {
  /**
   *
   */
  info: (message: string, ...args: unknown[]) => {
    log('info', message, ...args);
  },
  /**
   *
   */
  warn: (message: string, ...args: unknown[]) => {
    log('warn', message, ...args);
  },
  /**
   *
   */
  error: (message: string, ...args: unknown[]) => {
    log('error', message, ...args);
  },
  /**
   *
   */
  debug: (message: string, ...args: unknown[]) => {
    log('debug', message, ...args);
  }
};

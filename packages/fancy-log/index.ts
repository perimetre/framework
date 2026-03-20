import pc from 'picocolors';

const MAX_LABEL_LENGTH = 5;

const LEVELS = {
  debug: { color: pc.gray, label: 'DEBUG', method: 'debug' as const },
  error: { color: pc.red, label: 'ERROR', method: 'error' as const },
  info: { color: pc.cyan, label: 'INFO', method: 'info' as const },
  warn: { color: pc.yellow, label: 'WARN', method: 'warn' as const }
};

/** Formats a colored prefix: `2024-01-15T10:30:00.000Z  INFO`. */
const formatPrefix = (lvl: keyof typeof LEVELS) => {
  const config = LEVELS[lvl];
  return `${pc.dim(new Date().toISOString())} ${config.color(pc.bold(config.label.padStart(MAX_LABEL_LENGTH)))}`;
};

/**
 * Prints a colored debug message to stdout.
 * @example
 * ```ts
 * import { debug } from '@perimetre/fancy-log';
 * debug('Query executed', { duration: 42 });
 * ```
 */
export const debug = (message: string, ...args: unknown[]) => {
  console[LEVELS.debug.method](formatPrefix('debug'), message, ...args);
};

/**
 * Prints a colored info message to stdout.
 * @example
 * ```ts
 * import { info } from '@perimetre/fancy-log';
 * info('Server started on port 3000');
 * ```
 */
export const info = (message: string, ...args: unknown[]) => {
  console[LEVELS.info.method](formatPrefix('info'), message, ...args);
};

/**
 * Prints a colored warning message to stderr.
 * @example
 * ```ts
 * import { warn } from '@perimetre/fancy-log';
 * warn('Missing environment variable');
 * ```
 */
export const warn = (message: string, ...args: unknown[]) => {
  console[LEVELS.warn.method](formatPrefix('warn'), message, ...args);
};

/**
 * Prints a colored error message to stderr.
 * @example
 * ```ts
 * import { error } from '@perimetre/fancy-log';
 * error('Database connection failed', err);
 * ```
 */
export const error = (message: string, ...args: unknown[]) => {
  console[LEVELS.error.method](formatPrefix('error'), message, ...args);
};

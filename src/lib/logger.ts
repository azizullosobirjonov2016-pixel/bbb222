/**
 * Centralized logging utility. This is the one place console access is
 * allowed directly — everything else should log through `logger`.
 */
/* eslint-disable no-console */

const isDev = import.meta.env.DEV;

/**
 * Debug level - only in development
 */
function debug(message: string, data?: unknown): void {
  if (!isDev) return;
  console.debug(`🔵 [DEBUG] ${message}`, data);
}

/**
 * Info level - general information
 */
function info(message: string, data?: unknown): void {
  console.info(`🟢 [INFO] ${message}`, data);
}

/**
 * Warn level - warning messages
 */
function warn(message: string, data?: unknown): void {
  console.warn(`🟡 [WARN] ${message}`, data);
}

/**
 * Error level - critical errors
 * Should also report to error tracking service (e.g., Sentry) in production
 */
function error(message: string, error?: unknown): void {
  console.error(`🔴 [ERROR] ${message}`, error);

  // TODO: Send to Sentry or other error tracking service
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, {
  //     message,
  //     tags: { source: 'app' },
  //   });
  // }
}

export const logger = {
  debug,
  info,
  warn,
  error,
};

/**
 * Type guard functions for runtime type checking
 * Prevents unsafe type casting and provides better type safety
 */

// Error guards live in ./errors — re-exported here so both modules agree
// on a single implementation instead of maintaining duplicate copies.
export { isErrorWithMessage, isSupabaseError } from './errors';

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if value is an object (but not array or null)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T = unknown>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

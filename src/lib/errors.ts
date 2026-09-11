/**
 * Global error handling utilities
 */
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Convert any error type to a user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return "Noma'lum xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
}

/**
 * Log error to console and potentially to error tracking service
 */
export function logError(context: string, error: unknown): void {
  logger.error(`[${context}] ${getErrorMessage(error)}`, error);
}

/**
 * Type guard for error objects with message property
 */
export function isErrorWithMessage(
  error: unknown,
): error is { message: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Type guard for Supabase error objects
 */
export function isSupabaseError(
  error: unknown,
): error is {
  code?: string;
  message?: string;
  details?: string;
  status?: number;
} {
  return error !== null && typeof error === 'object';
}

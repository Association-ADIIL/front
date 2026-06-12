/**
 * Typed error definitions for the application
 * Replaces usage of `any` in catch blocks
 */

/**
 * Base API error with structured information
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Fix prototype chain for proper instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Check if error is an unauthorized error (401/403)
   */
  isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Check if error is a not found error (404)
   */
  isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * Check if error is a validation error (400)
   */
  isValidationError(): boolean {
    return this.status === 400;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Error class for network/connection errors
 */
export class NetworkError extends Error {
  constructor(message = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Error class for validation errors (client-side)
 */
export class ValidationError extends Error {
  public readonly field?: string;
  public readonly errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string> = {}, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.errors = errors;
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if an error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Type guard to check if an error is a standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extract error message from unknown error type
 * This is the safe way to get an error message without using `any`
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Une erreur inattendue est survenue';
}

/**
 * Check if error indicates an unauthorized state
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.isUnauthorized();
  }
  if (isError(error)) {
    const message = error.message.toLowerCase();
    return message.includes('401') || message.includes('403') || message.includes('unauthorized');
  }
  return false;
}

/**
 * Check if error message contains a specific text
 */
export function errorContains(error: unknown, text: string): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes(text.toLowerCase());
}

/**
 * Payment-specific error codes
 */
export const PaymentErrorCodes = {
  CAPACITY_EXCEEDED: 'capacity_exceeded',
  PAYMENT_FAILED: 'payment_failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
} as const;

export type PaymentErrorCode = typeof PaymentErrorCodes[keyof typeof PaymentErrorCodes];

/**
 * Check if error is a payment capacity error
 */
export function isCapacityExceededError(error: unknown): boolean {
  return errorContains(error, 'capacity exceeded') || errorContains(error, 'refunded');
}

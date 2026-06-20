/**
 * Centralized logger utility
 * Replaces console.log/error throughout the application
 * Only logs in development mode to avoid exposing sensitive information in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = import.meta.env.DEV;

/**
 * Sanitize error objects to remove sensitive information
 */
const sanitizeError = (error: unknown): string => {
  if (error instanceof Error) {
    // Don't expose stack traces in production
    return isDevelopment ? `${error.message}\n${error.stack}` : error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An error occurred';
};

/**
 * Sanitize context to remove sensitive keys
 */
const sanitizeContext = (context: LogContext): LogContext => {
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'key', 'credential'];
  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Format log message with timestamp and level
 */
const formatMessage = (level: LogLevel, message: string, context?: LogContext): string => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(sanitizeContext(context))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

/**
 * Logger object with methods for different log levels
 */
export const logger = {
  /**
   * Debug level - only in development
   */
  debug: (message: string, context?: LogContext): void => {
    if (isDevelopment) {
      console.debug(formatMessage('debug', message, context));
    }
  },

  /**
   * Info level - only in development
   */
  info: (message: string, context?: LogContext): void => {
    if (isDevelopment) {
      console.info(formatMessage('info', message, context));
    }
  },

  /**
   * Warning level - only in development
   */
  warn: (message: string, context?: LogContext): void => {
    if (isDevelopment) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  /**
   * Error level - logs in all environments but sanitizes in production
   * In production, you might want to send these to a logging service
   */
  error: (message: string, error?: unknown, context?: LogContext): void => {
    const sanitizedError = error ? sanitizeError(error) : '';
    const fullMessage = sanitizedError ? `${message}: ${sanitizedError}` : message;

    if (isDevelopment) {
      console.error(formatMessage('error', fullMessage, context));
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    } else {
      // In production, log minimal info
      // TODO: Send to external logging service (e.g., Sentry)
      console.error(formatMessage('error', message, context));
    }
  },

  /**
   * Log API errors with request context
   */
  apiError: (endpoint: string, status: number, error?: unknown): void => {
    logger.error('API request failed', error, { endpoint, status });
  },

  /**
   * Log authentication events
   */
  auth: (event: 'login' | 'logout' | 'register' | 'refresh' | 'login_google', success: boolean): void => {
    if (isDevelopment) {
      logger.info(`Auth event: ${event}`, { success });
    }
  },
};

export default logger;

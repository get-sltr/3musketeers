import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception and send it to Sentry
 * @param error - The error object to capture
 * @param context - Additional context to attach to the error
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional_info', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a message and send it to Sentry
 * @param message - The message to capture
 * @param level - The severity level ('info', 'warning', 'error', 'fatal')
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' | 'fatal' = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry
 * @param user - User information
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
} | null) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for better error tracking
 * @param breadcrumb - Breadcrumb information
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: 'info' | 'warning' | 'error' | 'debug';
  data?: Record<string, any>;
}) {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Start a new span for performance monitoring
 * @param name - Span name
 * @param op - Operation type
 */
export function startSpan<T>(
  name: string,
  op: string,
  callback: () => T
): T {
  return Sentry.startSpan({ name, op }, callback);
}

/**
 * Set tags for filtering errors in Sentry
 * @param tags - Key-value pairs of tags
 */
export function setTags(tags: Record<string, string | number | boolean>) {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Wrap an async function with error handling
 * @param fn - The function to wrap
 * @param errorMessage - Custom error message
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorMessage) {
        captureMessage(errorMessage, 'error');
      }
      captureException(error as Error);
      throw error;
    }
  }) as T;
}

/**
 * Application error definitions and centralized crash dispatch.
 * Follows blueprint §5.4: lightweight crash reporting forwarder.
 */

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export class AppError extends Error {
  readonly code: string;
  readonly statusCode?: number;
  readonly details?: unknown;
  readonly severity: ErrorSeverity;

  constructor(
    message: string,
    options?: {
      code?: string;
      statusCode?: number;
      details?: unknown;
      severity?: ErrorSeverity;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options?.code ?? 'APP_ERROR';
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    this.severity = options?.severity ?? 'error';

    if (options?.cause) {
      this.cause = options.cause;
    }

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }

  static fromUnknown(error: unknown, fallbackMessage = 'An unexpected error occurred'): AppError {
    if (error instanceof AppError) {
      return error;
    }
    if (error instanceof Error) {
      return new AppError(error.message, { cause: error });
    }
    return new AppError(fallbackMessage, { details: error });
  }
}

/**
 * Forwards error to crash reporting service (Crashlytics / Sentry) or logs in dev.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const normalized = AppError.fromUnknown(error);

  if (__DEV__) {
    console.error('[CaptureError]', {
      name: normalized.name,
      message: normalized.message,
      code: normalized.code,
      statusCode: normalized.statusCode,
      context,
      stack: normalized.stack,
    });
  }

  // Hook for hosted reporting service (e.g. Sentry / Crashlytics) when configured
}

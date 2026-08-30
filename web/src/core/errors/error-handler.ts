import { err, type Result } from './result'

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode?: number
  public readonly details?: unknown

  constructor(message: string, code = 'APP_ERROR', statusCode = 500, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function captureError(error: unknown, context?: string): AppError {
  if (error instanceof AppError) {
    return error
  }
  const message = error instanceof Error ? error.message : String(error)
  const appErr = new AppError(message, 'UNHANDLED_ERROR', 500, { context, raw: error })
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[AppError captured in ${context || 'global'}]:`, error)
  }
  return appErr
}

export async function withAsyncErrorCatch<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<Result<T, AppError>> {
  try {
    const data = await fn()
    return { ok: true, data }
  } catch (e) {
    return err(captureError(e, context))
  }
}

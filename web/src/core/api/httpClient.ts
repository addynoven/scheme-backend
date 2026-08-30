import { err, ok, type Result, AppError } from '../errors'
import { breadcrumbs } from '../errors/breadcrumbs'

interface RequestOptions extends RequestInit {
  timeoutMs?: number
}

export async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<Result<T, AppError>> {
  const { timeoutMs = 15000, ...fetchOpts } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  breadcrumbs.add('network', `${options.method || 'GET'} ${url}`)

  try {
    const res = await fetch(url, {
      ...fetchOpts,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      let errorBody: any
      try {
        errorBody = await res.json()
      } catch {
        errorBody = await res.text()
      }
      const message =
        typeof errorBody === 'object' && errorBody?.detail
          ? typeof errorBody.detail === 'string'
            ? errorBody.detail
            : JSON.stringify(errorBody.detail)
          : res.statusText || 'Network request failed'

      return err(new AppError(message, `HTTP_${res.status}`, res.status, errorBody))
    }

    const data = (await res.json()) as T
    return ok(data)
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      return err(new AppError('Request timed out', 'TIMEOUT_ERROR', 408))
    }
    return err(new AppError(error.message || 'Network error', 'NETWORK_ERROR', 500, error))
  }
}

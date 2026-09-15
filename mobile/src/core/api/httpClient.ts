import { config } from '../config/config';
import { AppError } from '../errors/error-handler';
import { err, ok, type Result } from '../errors/result';
import { secureStorage } from '../storage/secureStorage';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  readonly body?: unknown;
  readonly params?: Record<string, string | number | boolean | undefined>;
  readonly timeoutMs?: number;
  readonly skipAuth?: boolean;
}

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;

  constructor(baseUrl: string = config.apiUrl, defaultTimeoutMs: number = config.requestTimeoutMs) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<Result<T, AppError>> {
    const {
      params,
      body,
      headers: customHeaders = {},
      timeoutMs = this.defaultTimeoutMs,
      skipAuth = false,
      ...restOptions
    } = options;

    // Build URL with query params
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Prepare headers
    const requestId = generateRequestId();
    const headers = new Headers(customHeaders);
    headers.set('X-Request-ID', requestId);
    headers.set('Accept', 'application/json');

    if (body !== undefined && !(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (!skipAuth) {
      const tokenResult = await secureStorage.get('auth_token');
      if (tokenResult.ok && tokenResult.data) {
        headers.set('Authorization', `Bearer ${tokenResult.data}`);
      }
    }

    // Setup Timeout AbortController
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[API Request] ${restOptions.method || 'GET'} ${url.toString()}`);
      const response = await fetch(url.toString(), {
        ...restOptions,
        headers,
        body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);
      console.log(`[API Response] ${response.status} ${url.toString()}`);

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }

        const errorMessage =
          typeof errorData === 'object' && errorData !== null && 'detail' in errorData
            ? String((errorData as { detail: unknown }).detail)
            : `HTTP ${response.status}: ${response.statusText}`;

        return err(
          new AppError(errorMessage, {
            statusCode: response.status,
            code: `HTTP_${response.status}`,
            details: { requestId, errorData },
          })
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return ok(undefined as T);
      }

      const data = (await response.json()) as T;
      return ok(data);
    } catch (error) {
      clearTimeout(timer);
      console.log(`[API Error] ${url.toString()}:`, error);

      if (error instanceof Error && error.name === 'AbortError') {
        return err(
          new AppError(`Request timed out after ${timeoutMs}ms`, {
            code: 'TIMEOUT_ERROR',
            details: { requestId, timeoutMs },
            cause: error,
          })
        );
      }

      return err(
        new AppError('Network request failed', {
          code: 'NETWORK_ERROR',
          details: { requestId },
          cause: error,
        })
      );
    }
  }

  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<Result<T, AppError>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<Result<T, AppError>> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<Result<T, AppError>> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<Result<T, AppError>> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  delete<T>(path: string, options?: Omit<RequestOptions, 'method'>): Promise<Result<T, AppError>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();

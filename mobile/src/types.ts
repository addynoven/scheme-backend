/**
 * Global Application Type Declarations
 * Follows Lean Core architecture blueprint specifications.
 */

export interface UserSession {
  readonly id: string;
  readonly phoneNumber?: string;
  readonly name?: string;
  readonly token: string;
  readonly refreshToken?: string;
  readonly isAuthenticated: boolean;
}

export interface ApiMetadata {
  readonly requestId: string;
  readonly timestamp: string;
}

export interface ApiResponse<T> {
  readonly data: T;
  readonly meta?: ApiMetadata;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
}

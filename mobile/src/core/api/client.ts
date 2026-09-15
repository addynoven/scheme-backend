import { httpClient, type HttpClient } from './httpClient';

/**
 * Base API Client interface and singleton export.
 */
export const apiClient: HttpClient = httpClient;

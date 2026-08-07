import { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  status: number | null;
  retryable: boolean;
}

/**
 * Normalize any thrown value into a safe, user-presentable ApiError.
 * Never leaks server internals or stack traces to the UI (OWASP A05/A09).
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null;
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return { code: 'TIMEOUT', message: 'Request timed out. Please try again.', status, retryable: true };
    }
    if (!error.response) {
      return { code: 'NETWORK', message: 'No connection. Check your network and retry.', status: null, retryable: true };
    }
    if (status === 401) {
      return { code: 'UNAUTHORIZED', message: 'Your session expired. Please log in again.', status, retryable: false };
    }
    if (status === 429) {
      return { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait and try again.', status, retryable: true };
    }
    if (status !== null && status >= 500) {
      return { code: 'SERVER', message: 'Something went wrong on our side. Please retry.', status, retryable: true };
    }
    return { code: 'REQUEST', message: 'Request failed. Please check your input.', status, retryable: false };
  }
  return { code: 'UNKNOWN', message: 'Unexpected error. Please try again.', status: null, retryable: true };
}

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
 *
 * Specific handling for:
 *  - 503 Service Unavailable (backend starting up / downstream down)
 *  - Network errors (no response — device offline / DNS failure)
 *  - Timeouts (ECONNABORTED)
 *  - 401 Unauthorized (session expired)
 *  - 429 Rate limited
 *  - 5xx server errors
 *  - 4xx request errors
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null;

    // Log the full request context so 404s / unexpected failures can be
    // diagnosed from Metro logs (method + URL + status + server body).
    if (__DEV__) {
      const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
      console.warn(
        `[API] ${error.config?.method?.toUpperCase() ?? '?'} ${url} → ${status ?? 'no-response'}`,
        typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : error.response?.data,
      );
    }


    // ── Timeout ────────────────────────────────────────────────────
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
        status,
        retryable: true,
      };
    }

    // ── No response (network / DNS / connection refused) ──────────
    if (!error.response) {
      return {
        code: 'NETWORK',
        message: 'Cannot reach the server. Check your internet connection and try again.',
        status: null,
        retryable: true,
      };
    }

    // ── 503 Service Unavailable ────────────────────────────────────
    if (status === 503) {
      return {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Backend service is starting up. Please try again in a moment.',
        status,
        retryable: true,
      };
    }

    // ── 401 Unauthorized ───────────────────────────────────────────
    if (status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Your session expired. Please log in again.',
        status,
        retryable: false,
      };
    }

    // ── 429 Rate Limited ───────────────────────────────────────────
    if (status === 429) {
      return {
        code: 'RATE_LIMITED',
        message: 'Too many attempts. Please wait and try again.',
        status,
        retryable: true,
      };
    }

    // ── 5xx Server errors (excluding 503 handled above) ────────────
    if (status !== null && status >= 500) {
      return {
        code: 'SERVER',
        message: 'Something went wrong on our side. Please retry.',
        status,
        retryable: true,
      };
    }

    // ── 4xx Request errors ─────────────────────────────────────────
    // Try to extract a server-provided message for validation errors.
    const serverMsg = (error.response?.data as { message?: string; error?: string })?.message
      ?? (error.response?.data as { error?: string })?.error;
    if (serverMsg) {
      return {
        code: 'REQUEST',
        message: serverMsg,
        status,
        retryable: false,
      };
    }
    return {
      code: 'REQUEST',
      message: 'Request failed. Please check your input.',
      status,
      retryable: false,
    };
  }

  // ── Plain Error (e.g., from mock API or manual throw) ──────────────
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN',
      message: error.message,
      status: null,
      retryable: true,
    };
  }

  return {
    code: 'UNKNOWN',
    message: 'Unexpected error. Please try again.',
    status: null,
    retryable: true,
  };
}

/** Returns true if the error is a 503 or network error (backend unreachable). */
export function isBackendDown(error: unknown): boolean {
  const apiError = toApiError(error);
  return apiError.code === 'SERVICE_UNAVAILABLE' || apiError.code === 'NETWORK';
}

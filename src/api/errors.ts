import { AxiosError } from 'axios';

import { SessionExpiredError } from '@/api/client';

export interface ApiError {
  code: string;
  message: string;
  status: number | null;
  retryable: boolean;
  /** Backend correlation id (trace_id / X-Trace-Id) — include in support reports. */
  traceId?: string;
  /** Seconds to wait before retrying (Retry-After header / body hint on 429). */
  retryAfterSeconds?: number;
  /** 422 per-field validation messages, keyed by field name. */
  fieldErrors?: Record<string, string>;
}

/** Backend sends trace_id in the error body and/or X-Trace-Id/X-Request-Id headers. */
function traceIdFrom(error: AxiosError): string | undefined {
  const data = error.response?.data as Record<string, unknown> | undefined;
  const fromBody = data?.trace_id ?? data?.traceId ?? data?.request_id ?? data?.requestId;
  if (typeof fromBody === 'string' && fromBody) return fromBody;
  const headers = error.response?.headers as Record<string, string> | undefined;
  const fromHeader = headers?.['x-trace-id'] ?? headers?.['x-request-id'] ?? headers?.['x-correlation-id'];
  return typeof fromHeader === 'string' && fromHeader ? fromHeader : undefined;
}

/** Retry-After: integer seconds or an HTTP-date. */
function retryAfterFrom(error: AxiosError): number | undefined {
  const headers = error.response?.headers as Record<string, string> | undefined;
  const raw = headers?.['retry-after'];
  if (!raw) return undefined;
  const secs = Number(raw);
  if (Number.isFinite(secs)) return Math.max(0, secs);
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  return undefined;
}

/** Normalize a 422 `errors` payload — {field: msg}, {field: [msgs]} or
 *  [{field, message}] — into a flat field→message map. */
function fieldErrorsFrom(data: unknown): Record<string, string> | undefined {
  const errors = (data as Record<string, unknown> | undefined)?.errors
    ?? (data as Record<string, unknown> | undefined)?.field_errors;
  if (!errors) return undefined;
  const out: Record<string, string> = {};
  if (Array.isArray(errors)) {
    for (const e of errors) {
      const field = (e as Record<string, unknown>)?.field ?? (e as Record<string, unknown>)?.name;
      const msg = (e as Record<string, unknown>)?.message ?? (e as Record<string, unknown>)?.error;
      if (typeof field === 'string' && typeof msg === 'string') out[field] = msg;
    }
  } else if (typeof errors === 'object') {
    for (const [k, v] of Object.entries(errors as Record<string, unknown>)) {
      out[k] = Array.isArray(v) ? String(v[0] ?? '') : String(v);
    }
  }
  return Object.keys(out).length ? out : undefined;
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
  // Refresh token missing/rejected — session is over, not retryable.
  if (error instanceof SessionExpiredError) {
    return {
      code: 'UNAUTHORIZED',
      message: 'Your session expired. Please log in again.',
      status: 401,
      retryable: false,
    };
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null;
    const traceId = traceIdFrom(error);
    const data = error.response?.data as Record<string, unknown> | undefined;
    const serverMsg = (typeof data?.message === 'string' ? data.message : undefined)
      ?? (typeof data?.error === 'string' ? data.error : undefined);

    // Log the full request context so 404s / unexpected failures can be
    // diagnosed from Metro logs (method + URL + status + server body).
    if (__DEV__) {
      const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
      console.warn(
        `[API] ${error.config?.method?.toUpperCase() ?? '?'} ${url} → ${status ?? 'no-response'}`,
        traceId ? `trace=${traceId}` : undefined,
        typeof data === 'object' ? JSON.stringify(data) : data,
      );
    }


    // ── Timeout ────────────────────────────────────────────────────
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
        status,
        retryable: true,
        traceId,
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
        traceId,
      };
    }

    // ── 401 Unauthorized ───────────────────────────────────────────
    if (status === 401) {
      // 401 from an auth attempt (login/register/OTP) means bad credentials,
      // NOT an expired session — show a credential error instead.
      const url = error.config?.url ?? '';
      const isAuthAttempt = ['/auth/login', '/auth/register', '/auth/verify-otp'].some((p) => url.endsWith(p));
      if (isAuthAttempt) {
        return {
          code: 'INVALID_CREDENTIALS',
          message: serverMsg
            ?? (url.endsWith('/auth/login')
              ? 'Invalid email/phone or password. Please try again.'
              : 'Authentication failed. Please check your details and try again.'),
          status,
          retryable: false,
          traceId,
        };
      }
      return {
        code: 'UNAUTHORIZED',
        message: 'Your session expired. Please log in again.',
        status,
        retryable: false,
        traceId,
      };
    }

    // ── 429 Rate Limited ───────────────────────────────────────────
    if (status === 429) {
      const retryAfterSeconds = retryAfterFrom(error)
        ?? (typeof data?.retry_after === 'number' ? data.retry_after : undefined)
        ?? (typeof data?.retryAfter === 'number' ? data.retryAfter : undefined);
      return {
        code: 'RATE_LIMITED',
        message: 'Too many attempts. Please wait and try again.',
        status,
        retryable: true,
        traceId,
        retryAfterSeconds,
      };
    }

    // ── 413 Payload Too Large (>20 MB per backend contract) ────────
    if (status === 413) {
      return {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'The captured image is too large to upload. Please retake it in good light and try again.',
        status,
        retryable: false,
        traceId,
      };
    }

    // ── 422 Unprocessable — per-field validation errors ────────────
    if (status === 422) {
      return {
        code: 'VALIDATION',
        message: serverMsg ?? 'Please check the highlighted fields and try again.',
        status,
        retryable: false,
        traceId,
        fieldErrors: fieldErrorsFrom(data),
      };
    }

    // ── 5xx Server errors (excluding 503 handled above) ────────────
    if (status !== null && status >= 500) {
      return {
        code: 'SERVER',
        message: 'Something went wrong on our side. Please retry.',
        status,
        retryable: true,
        traceId,
      };
    }

    // ── 404 Not Found ──────────────────────────────────────────────
    // Common cause: registrationId expired/invalid, or endpoint path wrong.
    if (status === 404) {
      return {
        code: 'NOT_FOUND',
        message: serverMsg
          ?? 'The requested resource was not found. This may happen if your registration session expired — please start again.',
        status,
        retryable: false,
        traceId,
      };
    }

    // ── 409 Conflict ───────────────────────────────────────────────
    // Common cause: email/phone already registered with another account.
    if (status === 409) {
      return {
        code: 'CONFLICT',
        message: serverMsg
          ?? 'An account with these details already exists. Please log in or use different details.',
        status,
        retryable: false,
        traceId,
      };
    }

    // ── 4xx Request errors ─────────────────────────────────────────
    if (serverMsg) {
      return {
        code: 'REQUEST',
        message: serverMsg,
        status,
        retryable: false,
        traceId,
      };
    }
    return {
      code: 'REQUEST',
      message: 'Request failed. Please check your input.',
      status,
      retryable: false,
      traceId,
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

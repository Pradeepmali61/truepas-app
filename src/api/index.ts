import { realApi } from '@/api/endpoints';
import { isBackendDown } from '@/api/errors';
import { mockApi } from '@/api/mock';

/**
 * Single source of truth used by every hook/screen in the app.
 *
 * - The REAL backend (`endpoints.ts`) is the default — the backend is live
 *   and every build (preview/production) must talk to it. The base URL is
 *   baked in via `EXPO_PUBLIC_API_URL` (client.ts has a hardcoded fallback).
 * - Mock mode is strictly opt-in: set `EXPO_PUBLIC_USE_MOCK_API=true` to
 *   serve data from JSON fixtures in `src/api/data/` (no backend needed).
 *
 * Fallback mode (`EXPO_PUBLIC_FALLBACK_TO_MOCK=true`):
 *   If the real API returns 503 or a network error, the call is retried
 *   against `mockApi` so UI development can continue even when the
 *   backend is down. Default is strict real-only mode.
 */
const useMockApi = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';
const fallbackToMock = process.env.EXPO_PUBLIC_FALLBACK_TO_MOCK === 'true';

/**
 * Wraps a real API call so that on 503 / network error it falls back
 * to the equivalent mock function (when fallback is enabled).
 */
function withFallback<K extends keyof typeof realApi>(key: K) {
  const realFn = realApi[key] as (...args: any[]) => Promise<any>;
  const mockFn = mockApi[key] as (...args: any[]) => Promise<any>;

  if (!fallbackToMock) {
    return realFn;
  }

  return async (...args: any[]) => {
    try {
      return await realFn(...args);
    } catch (error) {
      if (isBackendDown(error)) {
        // Backend unreachable — fall back to mock data
        return mockFn(...args);
      }
      throw error;
    }
  };
}

/** The API object used by every hook/screen. */
export const api = useMockApi
  ? mockApi
  : (Object.keys(realApi).reduce((acc, key) => {
      (acc as any)[key] = withFallback(key as keyof typeof realApi);
      return acc;
    }, {} as typeof realApi));

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { secureStorage } from '@/services/secureStorage';

/**
 * Shared Axios infrastructure for the Truepas REST API.
 *
 * Two clients are exported:
 *  - `apiClient`       → customer-app-bff (EXPO_PUBLIC_API_URL)
 *  - `livenessClient`  → liveness-service  (EXPO_PUBLIC_LIVENESS_URL)
 *
 * Both share the same in-memory access token, Bearer header injection,
 * and single-flight 401 refresh with request replay (OWASP A02/A07).
 */

const BFF_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.dev.truepas.com/cb';
const LIVENESS_BASE_URL = process.env.EXPO_PUBLIC_LIVENESS_URL ?? 'https://api.dev.truepas.com/ls';

/** In-memory access token holder; set by the auth slice, cleared on logout. */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ── Token refresh (shared, single-flight) ─────────────────────────────
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await secureStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN');
  }
  const response = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${BFF_BASE_URL}/auth/refresh`,
    { refreshToken },
    { timeout: 15_000 }
  );
  await secureStorage.setRefreshToken(response.data.refreshToken);
  setAccessToken(response.data.accessToken);
  return response.data.accessToken;
}

/** Returns a fresh access token, deduplicating concurrent refresh calls. */
export function getOrRefreshAccessToken(): Promise<string> {
  refreshPromise = refreshPromise ?? refreshAccessToken();
  return refreshPromise.finally(() => { refreshPromise = null; });
}

// ── Factory: create an Axios instance with shared interceptors ────────
function createClient(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach Bearer token to every request
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  // 401 → refresh token (single-flight) → replay original request
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
      if (error.response?.status === 401 && original && !original._retried) {
        original._retried = true;
        try {
          const token = await getOrRefreshAccessToken();
          original.headers.Authorization = `Bearer ${token}`;
          return instance(original);
        } catch (refreshError) {
          setAccessToken(null);
          await secureStorage.clearRefreshToken();
          throw refreshError;
        }
      }
      throw error;
    }
  );

  return instance;
}

// ── Exported clients ──────────────────────────────────────────────────
export const apiClient = createClient(BFF_BASE_URL);
export const livenessClient = createClient(LIVENESS_BASE_URL);

/** Base URLs (used by health checks and error messages). */
export const BFF_URL = BFF_BASE_URL;
export const LIVENESS_URL = LIVENESS_BASE_URL;

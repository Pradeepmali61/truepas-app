import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { secureStorage } from '@/services/secureStorage';
import type { AuthResponse } from '@/types/domain';

/**
 * Shared Axios infrastructure for the Truepas REST API.
 *
 * The app calls only the BFF (customer-app-bff) at /cb/*.
 * Internal services (liveness, face, etc.) are reached through
 * the BFF — the app never calls them directly.
 *
 * Shared infrastructure:
 *  - In-memory access token (set by auth slice, cleared on logout)
 *  - In-memory registration token (set after phone OTP, cleared after account-details)
 *  - Bearer header injection
 *  - Single-flight 401 refresh with request replay (OWASP A02/A07)
 */

const BFF_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.dev.truepas.com/cb';

/** In-memory access token holder; set by the auth slice, cleared on logout. */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ── Registration token (in-memory only, not persisted) ─────────────────
// Set after phone OTP verification; used as Bearer for the account-details
// call only; cleared immediately after that call succeeds.
let registrationToken: string | null = null;

export function setRegistrationToken(token: string | null): void {
  registrationToken = token;
}

export function getRegistrationToken(): string | null {
  return registrationToken;
}

export function clearRegistrationToken(): void {
  registrationToken = null;
}

// ── Token refresh (shared, single-flight) ─────────────────────────────
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await secureStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN');
  }
  const response = await axios.post<AuthResponse>(
    `${BFF_BASE_URL}/auth/refresh`,
    { refreshToken },
    { timeout: 15_000 }
  );
  // Handle both camelCase and snake_case token fields from backend
  const newRefreshToken = response.data.refreshToken ?? (response.data as any).refresh_token;
  const newAccessToken = response.data.accessToken ?? (response.data as any).access_token;
  if (newRefreshToken) {
    await secureStorage.setRefreshToken(newRefreshToken);
  }
  setAccessToken(newAccessToken);
  return newAccessToken;
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

  // Attach Bearer token to every request (unless overridden per-request)
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Don't override if a per-request Authorization header was already set
    // (e.g., registrationToken for account-details)
    if (accessToken && !config.headers.Authorization) {
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

// ── Exported client ────────────────────────────────────────────────────
export const apiClient = createClient(BFF_BASE_URL);

/** Base URL (used by health checks and error messages). */
export const BFF_URL = BFF_BASE_URL;

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { secureStorage } from '@/services/secureStorage';

/**
 * Single Axios instance for the Truepas REST API.
 * - 15s timeout, JSON only
 * - Bearer token from in-memory holder (never persisted — OWASP A02/A07)
 * - Single-flight 401 refresh with request replay
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.truepas.example';

/** In-memory access token holder; set by the auth slice, cleared on logout. */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await secureStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN');
  }
  const response = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${BASE_URL}/auth/refresh`,
    { refreshToken },
    { timeout: 15_000 }
  );
  await secureStorage.setRefreshToken(response.data.refreshToken);
  setAccessToken(response.data.accessToken);
  return response.data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const token = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch (refreshError) {
        refreshPromise = null;
        setAccessToken(null);
        await secureStorage.clearRefreshToken();
        throw refreshError;
      }
    }
    throw error;
  }
);

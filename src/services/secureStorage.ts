import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Hardware-backed secure storage (iOS Keychain / Android Keystore).
 * Only non-extractable secrets live here — never in AsyncStorage (OWASP A02).
 *
 * expo-secure-store has no web implementation (its web module is empty), so
 * on web we fall back to localStorage — otherwise the refresh token is never
 * persisted and every session dies with NO_REFRESH_TOKEN on token expiry.
 */
const REFRESH_TOKEN_KEY = 'truepas.refreshToken';
const isWeb = Platform.OS === 'web';

export const secureStorage = {
  async getRefreshToken(): Promise<string | null> {
    if (isWeb) {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    if (isWeb) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async clearRefreshToken(): Promise<void> {
    if (isWeb) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

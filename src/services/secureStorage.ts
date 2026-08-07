import * as SecureStore from 'expo-secure-store';

/**
 * Hardware-backed secure storage (iOS Keychain / Android Keystore).
 * Only non-extractable secrets live here — never in AsyncStorage (OWASP A02).
 */
const REFRESH_TOKEN_KEY = 'truepas.refreshToken';

export const secureStorage = {
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async clearRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

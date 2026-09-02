import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { setAccessToken } from '@/api/client';
import { secureStorage } from '@/services/secureStorage';
import type { User } from '@/types/domain';

interface AuthState {
  status: 'unauthenticated' | 'authenticated';
  user: User | null;
  faceEnrolled: boolean;
  biometricConsent: boolean;
}

const initialState: AuthState = {
  status: 'unauthenticated',
  user: null,
  faceEnrolled: false,
  biometricConsent: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<{ user: User; accessToken: string; refreshToken?: string }>) {
      state.status = 'authenticated';
      state.user = action.payload.user;
      state.faceEnrolled = action.payload.user.faceEnrolled;
      state.biometricConsent = action.payload.user.biometricConsentAt !== null;
      setAccessToken(action.payload.accessToken);
      // Persist refresh token to secure storage if provided
      if (action.payload.refreshToken) {
        secureStorage.setRefreshToken(action.payload.refreshToken).catch(() => {
          // Best-effort; session still works with access token
        });
      }
    },
    biometricConsentGiven(state) {
      state.biometricConsent = true;
    },
    faceEnrollmentCompleted(state) {
      state.faceEnrolled = true;
      if (state.user) {
        state.user.faceEnrolled = true;
      }
    },
    sessionEnded() {
      setAccessToken(null);
      // Clear refresh token from secure storage (best-effort)
      secureStorage.clearRefreshToken().catch(() => {});
      return initialState;
    },
  },
});

export const { sessionStarted, biometricConsentGiven, faceEnrollmentCompleted, sessionEnded } =
  authSlice.actions;
export const authReducer = authSlice.reducer;

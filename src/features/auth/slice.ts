import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { clearRegistrationToken, setAccessToken } from '@/api/client';
import { accountDetailsStore } from '@/services/accountDetailsStore';
import { pinStore } from '@/services/pinStore';
import { clearScanResult } from '@/services/scanStore';
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
        secureStorage.setRefreshToken(action.payload.refreshToken).catch((e) => {
          // Best-effort; session still works with access token — but log it,
          // a silent failure here surfaces later as NO_REFRESH_TOKEN errors.
          console.warn('[auth] failed to persist refresh token:', e);
        });
      }
    },
    /** Merge a server-returned User into the session (PUT /user/me response)
     *  so every screen reading state.auth.user sees fresh data immediately —
     *  without it, edits only surfaced on the next app boot. */
    profileUpdated(state, action: PayloadAction<User>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
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
      clearRegistrationToken();
      // Clear refresh token from secure storage (best-effort)
      secureStorage.clearRefreshToken().catch(() => {});
      // In-memory stashes hold session-scoped secrets/data (verified PIN,
      // captured scan images, resend payload) — drop them so a different
      // login on the same session can't inherit them.
      pinStore.clear();
      accountDetailsStore.clear();
      clearScanResult();
      return initialState;
    },
  },
});

export const { sessionStarted, profileUpdated, biometricConsentGiven, faceEnrollmentCompleted, sessionEnded } =
  authSlice.actions;
export const authReducer = authSlice.reducer;

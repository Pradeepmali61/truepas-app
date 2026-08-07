import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { setAccessToken } from '@/api/client';
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
    sessionStarted(state, action: PayloadAction<{ user: User; accessToken: string }>) {
      state.status = 'authenticated';
      state.user = action.payload.user;
      state.faceEnrolled = action.payload.user.faceEnrolled;
      state.biometricConsent = action.payload.user.biometricConsentAt !== null;
      setAccessToken(action.payload.accessToken);
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
      return initialState;
    },
  },
});

export const { sessionStarted, biometricConsentGiven, faceEnrollmentCompleted, sessionEnded } =
  authSlice.actions;
export const authReducer = authSlice.reducer;

import { apiClient, getRegistrationToken, setRegistrationToken } from '@/api/client';
import type {
    AccountDetailsRequest,
    AccountDetailsResponse,
    ActivityLogItem,
    AddDocumentRequest,
    AddFamilyMemberRequest,
    AuthResponse,
    BiometricConsentRequest,
    Booking,
    ChangePasswordRequest,
    ChangePinRequest,
    DeleteAccountRequest,
    FaceEnrollRequest,
    FaceResponse,
    FaceUpdateRequest,
    FamilyMember,
    ForgotPasswordRequest,
    IdentityDocument,
    IdentitySummary,
    IssuedDoc,
    LivenessChallengeResponse,
    LivenessEvidenceRequest,
    LivenessEvidenceResponse,
    LivenessFinalizeResponse,
    LoginRequest,
    LogoutRequest,
    Notification,
    OkResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    UpdateProfileRequest,
    User,
    VerificationSession,
    VerificationSessionRequest,
    VerifyDocumentRequest,
    VerifyDocumentResponse,
    VerifyOtpRequest,
    VerifyOtpResponse
} from '@/types/domain';

/**
 * Real REST API layer — same function signatures as `mockApi` so screens/hooks
 * never need to change when we switch from mock JSON fixtures to the live
 * backend.
 *
 * All calls go through the BFF (customer-app-bff) at /cb/*.
 * The app must never call internal services directly.
 */
export const realApi = {
  // ── Reads ────────────────────────────────────────────────────────────
  getUser: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/user/me');
    return data;
  },
  getIdentitySummary: async (): Promise<IdentitySummary> => {
    const { data } = await apiClient.get<IdentitySummary>('/identity/summary');
    return data;
  },
  getDocuments: async (personId?: string): Promise<IdentityDocument[]> => {
    const { data } = await apiClient.get<IdentityDocument[]>(
      '/documents',
      personId ? { params: { personId } } : undefined,
    );
    return data;
  },
  getDocument: async (id: string): Promise<IdentityDocument | null> => {
    const { data } = await apiClient.get<IdentityDocument>(`/documents/${id}`);
    return data;
  },
  getIssuedDocuments: async (): Promise<IssuedDoc[]> => {
    const { data } = await apiClient.get<IssuedDoc[]>('/documents/issued');
    return data;
  },
  getFamily: async (): Promise<FamilyMember[]> => {
    const { data } = await apiClient.get<FamilyMember[]>('/family');
    return data;
  },
  getFamilyMember: async (id: string): Promise<FamilyMember | null> => {
    const { data } = await apiClient.get<FamilyMember>(`/family/${id}`);
    return data;
  },
  getFamilyActivity: async (id: string): Promise<ActivityLogItem[]> => {
    const { data } = await apiClient.get<ActivityLogItem[]>(`/family/${id}/activity`);
    return data;
  },
  getBookings: async (): Promise<Booking[]> => {
    const { data } = await apiClient.get<Booking[]>('/bookings');
    return data;
  },
  getBooking: async (id: string): Promise<Booking | null> => {
    const { data } = await apiClient.get<Booking>(`/bookings/${id}`);
    return data;
  },
  getNotifications: async (params?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>('/notifications', {
      params: {
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
        unread_only: params?.unreadOnly ?? false,
      },
    });
    return data;
  },

  // ── Auth ─────────────────────────────────────────────────────────────
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    // Handle both camelCase and snake_case token fields from backend
    return {
      user: data.user,
      accessToken: data.accessToken ?? (data as any).access_token,
      refreshToken: data.refreshToken ?? (data as any).refresh_token,
    };
  },
  register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
    console.log('[API] POST /auth/register', JSON.stringify(payload));
    const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload);
    console.log('[API] /auth/register response:', JSON.stringify(data));
    return data;
  },
  verifyOtp: async (payload: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    // Send both camelCase and snake_case registration_id — backend may expect either.
    const requestPayload: Record<string, unknown> = { ...payload };
    if (payload.registrationId) {
      requestPayload.registration_id = payload.registrationId;
    }
    // For email verification during registration, send the registration token as Bearer
    // so the backend can link this to the ongoing registration session.
    const registrationToken = getRegistrationToken();
    const config = registrationToken
      ? { headers: { Authorization: `Bearer ${registrationToken}` } }
      : undefined;
    console.log('[API] POST /auth/verify-otp', JSON.stringify({ ...requestPayload, otp: '***' }), registrationToken ? 'with registration token' : 'no registration token');
    const { data } = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', requestPayload, config);
    console.log('[API] /auth/verify-otp response:', JSON.stringify({ ...data, registrationToken: data.registrationToken ? '***' : undefined }));
    // Handle both camelCase and snake_case from backend
    return {
      ...data,
      registrationToken: data.registrationToken ?? (data as any).registration_token,
      accessToken: data.accessToken ?? (data as any).access_token,
      refreshToken: data.refreshToken ?? (data as any).refresh_token,
    };
  },
  completeAccountDetails: async (payload: AccountDetailsRequest): Promise<AccountDetailsResponse> => {
    const registrationToken = getRegistrationToken();
    console.log('[API] POST /auth/account-details', JSON.stringify({ ...payload, password: '***', confirmPassword: '***', pin: '***' }), registrationToken ? 'with registration token' : 'NO REGISTRATION TOKEN');
    const { data } = await apiClient.post<AccountDetailsResponse>(
      '/auth/account-details',
      payload,
      registrationToken ? { headers: { Authorization: `Bearer ${registrationToken}` } } : undefined,
    );
    console.log('[API] /auth/account-details response:', JSON.stringify({ ...data, registrationToken: data.registrationToken ? '***' : undefined }));
    // If backend returns a new registration token for the email step, update it.
    const newToken = data.registrationToken ?? (data as any).registration_token;
    if (newToken) {
      console.log('[API] Account-details returned new registration token for email step');
      setRegistrationToken(newToken);
    }
    return data;
  },
  forgotPassword: async (payload: ForgotPasswordRequest): Promise<OkResponse> => {
    const { data } = await apiClient.post<OkResponse>('/auth/forgot-password', payload);
    return data;
  },
  resetPassword: async (payload: ResetPasswordRequest): Promise<OkResponse> => {
    const { data } = await apiClient.post<OkResponse>('/auth/reset-password', payload);
    return data;
  },
  changePassword: async (payload: ChangePasswordRequest): Promise<OkResponse> => {
    const { data } = await apiClient.post<OkResponse>('/auth/change-password', payload);
    return data;
  },
  changePin: async (payload: ChangePinRequest): Promise<OkResponse> => {
    const { data } = await apiClient.post<OkResponse>('/auth/change-pin', payload);
    return data;
  },
  verifyPin: async (pin: string): Promise<OkResponse> => {
    const { data } = await apiClient.post<OkResponse>('/auth/verify-pin', { pin });
    return data;
  },
  logout: async (payload: LogoutRequest): Promise<OkResponse> => {
    const { data } = await apiClient.post<OkResponse>('/auth/logout', payload);
    return data;
  },
  deleteAccount: async (payload: DeleteAccountRequest): Promise<OkResponse> => {
    const { data } = await apiClient.delete<OkResponse>('/user/me', { data: payload });
    return data;
  },

  // ── Profile ──────────────────────────────────────────────────────────
  updateProfile: async (payload: UpdateProfileRequest): Promise<User> => {
    const { data } = await apiClient.put<User>('/user/me', payload);
    return data;
  },
  biometricConsent: async (payload: BiometricConsentRequest): Promise<OkResponse> => {
    const { data } = await apiClient.post<OkResponse>('/user/me/biometric-consent', payload);
    return data;
  },

  // ── Family ───────────────────────────────────────────────────────────
  addFamilyMember: async (payload: AddFamilyMemberRequest): Promise<FamilyMember> => {
    const { data } = await apiClient.post<FamilyMember>('/family', payload);
    return data;
  },
  removeFamilyMember: async (id: string): Promise<OkResponse> => {
    const { data } = await apiClient.delete<OkResponse>(`/family/${id}`);
    return data;
  },

  // ── Documents ────────────────────────────────────────────────────────
  addDocument: async (payload: AddDocumentRequest): Promise<IdentityDocument> => {
    const { data } = await apiClient.post<IdentityDocument>('/documents', payload);
    return data;
  },
  removeDocument: async (id: string): Promise<OkResponse> => {
    const { data } = await apiClient.delete<OkResponse>(`/documents/${id}`);
    return data;
  },

  // ── Document verification sessions ───────────────────────────────────
  createVerificationSession: async (documentId: string, payload: VerificationSessionRequest): Promise<VerificationSession> => {
    const { data } = await apiClient.post<VerificationSession>(
      `/documents/${documentId}/verification-sessions`,
      payload,
    );
    return data;
  },
  /** POST /document-verification-sessions/{sessionId}/verify
   *  Per guide §6.3: SYNCHRONOUS result — no polling needed.
   *  Images sent as base64 in the body (NOT as object keys). */
  startVerificationWithImages: async (
    sessionId: string,
    payload: VerifyDocumentRequest,
    config?: { timeout?: number },
  ): Promise<VerifyDocumentResponse> => {
    const { data } = await apiClient.post<VerifyDocumentResponse>(
      `/document-verification-sessions/${sessionId}/verify`,
      payload,
      config,
    );
    return data;
  },
  /** Legacy: start verification without images (not per guide — kept for compatibility) */
  startVerification: async (sessionId: string): Promise<OkResponse> => {
    const { data } = await apiClient.post<OkResponse>(`/document-verification-sessions/${sessionId}/verify`);
    return data;
  },
  /** GET /document-verification-sessions/{sessionId} — recovery poll only
   *  Per guide §6.7: use only to recover from crash/app-kill, not as a wait loop */
  pollVerification: async (sessionId: string): Promise<VerificationSession> => {
    const { data } = await apiClient.get<VerificationSession>(`/document-verification-sessions/${sessionId}`);
    return data;
  },

  // ── Liveness (via BFF /cb/liveness/*) ────────────────────────────────
  createLivenessChallenge: async (personId?: string): Promise<LivenessChallengeResponse> => {
    const { data } = await apiClient.post<LivenessChallengeResponse>(
      '/liveness/v2/challenge',
      personId ? { personId } : undefined,
    );
    return data;
  },
  submitLivenessEvidence: async (
    sessionId: string,
    payload: LivenessEvidenceRequest,
    sessionToken: string,
  ): Promise<LivenessEvidenceResponse> => {
    // Per KYC guide §4.2: Evidence carries NO image — only step metadata.
    // Send as JSON, not multipart.
    const { data } = await apiClient.post<LivenessEvidenceResponse>(
      `/liveness/v2/challenge/${sessionId}/evidence`,
      {
        challenge: payload.challenge,
        step_index: payload.step_index,
        client_ts_ms: payload.client_ts_ms,
        duration_ms: payload.duration_ms,
      },
      {
        headers: {
          'X-Session-Token': sessionToken,
        },
      },
    );
    return data;
  },
  finalizeLiveness: async (
    sessionId: string,
    frameBase64: string,
    sessionToken: string,
  ): Promise<LivenessFinalizeResponse> => {
    const formData = new FormData();
    formData.append('frame', {
      uri: `data:image/jpeg;base64,${frameBase64}`,
      type: 'image/jpeg',
      name: 'finalize.jpg',
    } as any);

    const { data } = await apiClient.post<LivenessFinalizeResponse>(
      `/liveness/v2/challenge/${sessionId}/finalize`,
      formData,
      {
        headers: {
          'X-Session-Token': sessionToken,
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return data;
  },

  // ── Face enrollment / update (via BFF /cb/face/*) ────────────────────
  enrollFace: async (payload: FaceEnrollRequest): Promise<FaceResponse> => {
    const { data } = await apiClient.post<FaceResponse>('/face/enroll', payload);
    return data;
  },
  updateFace: async (payload: FaceUpdateRequest): Promise<FaceResponse> => {
    const { data } = await apiClient.put<FaceResponse>('/face', payload);
    return data;
  },
};

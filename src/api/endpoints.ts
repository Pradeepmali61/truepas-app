import { apiClient } from '@/api/client';
import type {
    AccountDetailsRequest,
    ActivityLogItem,
    AddDocumentRequest,
    AddFamilyMemberRequest,
    AuthResponse,
    Booking,
    ChangePasswordRequest,
    ChangePinRequest,
    FamilyMember,
    ForgotPasswordRequest,
    IdentityDocument,
    IdentitySummary,
    IssuedDoc,
    LoginRequest,
    OkResponse,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    User,
    VerifyOtpRequest
} from '@/types/domain';

/**
 * Real REST API layer — same function signatures as `mockApi` so screens/hooks
 * never need to change when we switch from mock JSON fixtures to the live
 * backend. Update the paths below to match the backend team's actual routes.
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
  getDocuments: async (): Promise<IdentityDocument[]> => {
    const { data } = await apiClient.get<IdentityDocument[]>('/documents');
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

  // ── Auth ─────────────────────────────────────────────────────────────
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },
  register: async (payload: RegisterRequest): Promise<OkResponse> => {
    const { data } = await apiClient.post<OkResponse>('/auth/register', payload);
    return data;
  },
  verifyOtp: async (payload: VerifyOtpRequest): Promise<OkResponse> => {
    const { data } = await apiClient.post<OkResponse>('/auth/verify-otp', payload);
    return data;
  },
  completeAccountDetails: async (payload: AccountDetailsRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/account-details', payload);
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
  deleteAccount: async (): Promise<OkResponse> => {
    const { data } = await apiClient.delete<OkResponse>('/user/me');
    return data;
  },

  // ── Profile ──────────────────────────────────────────────────────────
  updateProfile: async (payload: UpdateProfileRequest): Promise<User> => {
    const { data } = await apiClient.put<User>('/user/me', payload);
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
};

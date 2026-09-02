export type VerificationStatus = 'verified' | 'pending' | 'missing' | 'failed';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  faceEnrolled: boolean;
  biometricConsentAt: string | null;
}

export interface IdentitySummary {
  status: 'incomplete' | 'verified';
  face: VerificationStatus;
  document: VerificationStatus;
  selfieMatch: VerificationStatus;
  activity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  title: string;
  timestamp: string;
  tone: 'success' | 'warning' | 'error';
}

export type DocumentType =
  | 'passport'
  | 'drivingLicense'
  | 'idCard'
  | 'greenCard'
  | 'birthCertificate'
  | 'usVisa';

export interface IdentityDocument {
  id: string;
  type: DocumentType;
  label: string;
  number: string;
  status: VerificationStatus;
  matchScore: number | null;
  addedAt: string;
  expiresAt: string | null;
}

export type FamilyAgeBand = '0-4' | '5-17' | '18+';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age: number;
  ageBand: FamilyAgeBand;
  verification: string;
  turning18Soon: boolean;
}

export interface Booking {
  id: string;
  venue: string;
  location: string;
  type: string;
  image: string;
  checkIn: string;
  checkOut: string;
  status: 'completed' | 'failed' | 'upcoming';
  guests: number;
  amount: number;
  checkedInMembers?: string[];
}

export interface IssuedDoc {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
  icon: 'drivingLicense' | 'passport' | 'greenCard' | 'birthCertificate' | 'usVisa';
  number: string;
  status: 'Active' | 'Expired';
}

export interface ActivityLogItem {
  id: string;
  title: string;
  date: string;
}

// ── Write operation payloads & responses ──────────────────────────────
// These shapes define the API contract shared with the backend team.

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  countryCode: string;
}

export interface VerifyOtpRequest {
  phone?: string;
  otp: string;
}

export interface AccountDetailsRequest {
  fullName: string;
  dateOfBirth: string;
  pin: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePinRequest {
  currentPin: string;
  newPin: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface AddFamilyMemberRequest {
  name: string;
  dateOfBirth: string;
  relationship: string;
}

export interface AddDocumentRequest {
  type: DocumentType;
  label: string;
  number: string;
  expiresAt: string | null;
}

export interface OkResponse {
  ok: boolean;
  message?: string;
}

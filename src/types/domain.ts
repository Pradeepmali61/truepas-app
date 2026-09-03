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
  source?: 'uploaded' | 'verified';
  personId?: string;
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
  faceEnrolled: boolean;
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

export interface RegisterResponse {
  ok: boolean;
  message: string;
  registrationId: string;
  nextStep: 'verifyPhone';
}

export type OtpPurpose = 'phone' | 'email' | 'password_reset';

export interface VerifyOtpRequest {
  phone?: string;
  countryCode?: string;
  email?: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpResponse {
  ok: boolean;
  message: string;
  /** Present only when purpose === 'phone' (registration flow). */
  registrationToken?: string;
  /** Present only when purpose === 'email' (registration or reset). */
  nextStep?: 'accountDetails' | 'verifyEmail' | 'reset';
  /** Present when purpose === 'email' during registration (real API returns full AuthResponse). */
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

export interface AccountDetailsRequest {
  fullName: string;
  dateOfBirth: string;
  pin: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AccountDetailsResponse {
  ok: boolean;
  message: string;
  nextStep: 'verifyEmail';
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
  dateOfBirth?: string;
  address?: string;
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
  personId?: string;
}

export interface DeleteAccountRequest {
  confirmation: string;
  pin: string;
}

export interface BiometricConsentRequest {
  accepted: boolean;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface OkResponse {
  ok: boolean;
  message?: string;
}

// ── Notifications ──────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  type?: string;
}

// ── Liveness / Face (all via BFF /cb/liveness/* and /cb/face/*) ────────

export type LivenessChallenge = 'blink' | 'turn_left' | 'turn_right';

export interface LivenessChallengeResponse {
  success: boolean;
  session_id: string;
  session_token: string;
  challenge_sequence: LivenessChallenge[];
  expires_in_seconds: number;
  step_time_limits: { min_ms: number; max_ms: number };
  ui_copy: Record<LivenessChallenge, string>;
}

export interface LivenessEvidenceRequest {
  challenge: LivenessChallenge;
  step_index: number;
  client_ts_ms: number;
  duration_ms: number;
  frame: string; // base64 JPEG
}

export interface LivenessEvidenceResponse {
  success: boolean;
  step_accepted: boolean;
  next_challenge?: LivenessChallenge;
  next_instruction?: string;
  status: 'in_progress' | 'failed' | 'passed';
}

export interface LivenessFinalizeResponse {
  success: boolean;
  status: 'passed' | 'failed';
  session_id: string;
  antispoof_score: number;
  message: string;
}

export interface FaceEnrollRequest {
  livenessSessionId: string;
  sessionToken: string;
  personId?: string;
}

export interface FaceUpdateRequest {
  livenessSessionId: string;
  sessionToken: string;
  personId?: string;
}

export interface FaceResponse {
  ok: boolean;
  faceEnrolled: boolean;
  faceId?: string;
}

// ── Document verification sessions ─────────────────────────────────────

export interface VerificationSessionRequest {
  requestId?: string;
  frontObjectKey?: string;
  backObjectKey?: string;
  selfieObjectKey?: string;
  livenessSessionId?: string;
}

export type VerificationSessionStatus = 'created' | 'completed';
export type VerificationOutcome = 'approved' | 'rejected' | 'review';

export interface VerificationSession {
  id: string;
  status: VerificationSessionStatus;
  outcome?: VerificationOutcome;
  reasonCode?: string | null;
  documentId: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
}

/** Body for POST /document-verification-sessions/{sessionId}/verify
 *  Per REACT_NATIVE_KYC_INTEGRATION_GUIDE.md §6.3:
 *  - frontImageBase64 is required
 *  - selfieImageBase64 for face match (omit for birthCertificate)
 *  - backImageBase64 optional
 */
export interface VerifyDocumentRequest {
  frontImageBase64: string;
  backImageBase64?: string;
  selfieImageBase64?: string;
}

/** Response from /verify — synchronous result with outcome + document */
export interface VerifyDocumentResponse extends VerificationSession {
  document?: IdentityDocument;
  matchScore?: number | null;
}

// ── Health check ──────────────────────────────────────────────────────

export interface HealthStatus {
  healthy: boolean;
  service?: string;
  version?: string;
}

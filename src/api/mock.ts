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
    LivenessChallenge,
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
    VerifyOtpRequest,
    VerifyOtpResponse
} from '@/types/domain';

import bookingsData from './data/bookings.json';
import documentsData from './data/documents.json';
import familyActivityData from './data/family-activity.json';
import familyData from './data/family.json';
import identitySummaryData from './data/identitySummary.json';
import issuedDocumentsData from './data/issued-documents.json';
import userData from './data/user.json';

/**
 * Mock API layer — mirrors the REST contract with realistic latency.
 * Data is sourced from JSON fixtures in `src/api/data/` (not hardcoded here),
 * so it maps 1:1 onto the real backend JSON response shape.
 *
 * Write operations mutate an in-memory copy of the fixtures so the whole
 * app flow (add/edit/delete) works end-to-end without a backend. On app
 * restart, state resets to the original JSON fixtures.
 *
 * The function signatures here define the API contract — `endpoints.ts`
 * implements the same signatures against the real backend.
 */
const LATENCY_MS = 450;

function respond<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), LATENCY_MS));
}

function fail(message: string): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), LATENCY_MS));
}

let uid = 100;
const nextId = (prefix: string) => `${prefix}${uid++}`;

// ── In-memory state (initialized from JSON fixtures) ──────────────────
let user: User = { ...(userData as User) };
let userPassword = 'password123';
let userPin = '1234';
let biometricConsentAccepted = false;

const identitySummary: IdentitySummary = identitySummaryData as IdentitySummary;
let documents: IdentityDocument[] = [...(documentsData as IdentityDocument[])];
let family: FamilyMember[] = (familyData as FamilyMember[]).map((f) => ({
  ...f,
  faceEnrolled: false,
}));
const bookings: Booking[] = bookingsData as Booking[];
const issuedDocuments: IssuedDoc[] = issuedDocumentsData as IssuedDoc[];
const familyActivity: ActivityLogItem[] = familyActivityData as ActivityLogItem[];
const notifications: Notification[] = [
  { id: 'n1', title: 'Welcome to Truepas', body: 'Your account is set up.', read: false, createdAt: new Date().toISOString(), type: 'system' },
];

export const mockUser: User = user;

function authResponse(): AuthResponse {
  return {
    user,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };
}

function ageFromDob(dob: string): number {
  const match = dob.match(/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/);
  if (!match) return 0;
  const [, month, day, year] = match;
  const birth = new Date(Number(year), Number(month) - 1, Number(day));
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export const mockApi = {
  // ── Reads ────────────────────────────────────────────────────────────
  getUser: () => respond(user),
  getIdentitySummary: () => respond(identitySummary),
  getDocuments: (_personId?: string) => respond(documents),
  getDocument: (id: string) => respond(documents.find((d) => d.id === id) ?? null),
  getIssuedDocuments: () => respond(issuedDocuments),
  getFamily: () => respond(family),
  getFamilyMember: (id: string) => respond(family.find((f) => f.id === id) ?? null),
  getFamilyActivity: (_id: string) => respond(familyActivity),
  getBookings: () => respond(bookings),
  getBooking: (id: string) => respond(bookings.find((b) => b.id === id) ?? null),
  getNotifications: (_params?: { limit?: number; offset?: number; unreadOnly?: boolean }) => respond(notifications),

  // ── Auth ─────────────────────────────────────────────────────────────
  login: (payload: LoginRequest): Promise<AuthResponse> => {
    if (!payload.identifier || !payload.password) {
      return fail('Invalid credentials');
    }
    return respond(authResponse());
  },
  register: (payload: RegisterRequest): Promise<RegisterResponse> => {
    user = { ...user, phone: `${payload.countryCode} ${payload.phone}` };
    return respond({
      ok: true,
      message: 'Verification code sent',
      registrationId: nextId('reg'),
      nextStep: 'verifyPhone',
    });
  },
  verifyOtp: (payload: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    if (payload.otp.length !== 6 && payload.otp.length !== 4) {
      return fail('Invalid OTP');
    }
    if (payload.purpose === 'phone') {
      return respond({
        ok: true,
        message: 'Phone verified',
        registrationToken: 'mock-registration-token',
        nextStep: 'accountDetails',
      });
    }
    if (payload.purpose === 'email') {
      // Email verification during registration returns full AuthResponse fields
      const auth = authResponse();
      return respond({
        ok: true,
        message: 'Email verified',
        nextStep: 'verifyEmail',
        user: auth.user,
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
      });
    }
    // password_reset
    return respond({
      ok: true,
      message: 'OTP verified',
      nextStep: 'reset',
    });
  },
  completeAccountDetails: (payload: AccountDetailsRequest): Promise<AccountDetailsResponse> => {
    user = {
      ...user,
      fullName: payload.fullName,
      email: payload.email,
      faceEnrolled: false,
      biometricConsentAt: null,
    };
    userPassword = payload.password;
    userPin = payload.pin;
    return respond({
      ok: true,
      message: 'Email verification code sent',
      nextStep: 'verifyEmail',
    });
  },
  forgotPassword: (_payload: ForgotPasswordRequest): Promise<OkResponse> => {
    return respond({ ok: true, message: 'If the account exists, a verification code was sent' });
  },
  resetPassword: (payload: ResetPasswordRequest): Promise<OkResponse> => {
    userPassword = payload.newPassword;
    return respond({ ok: true, message: 'Password reset' });
  },
  changePassword: (payload: ChangePasswordRequest): Promise<OkResponse> => {
    if (payload.currentPassword !== userPassword) {
      return fail('Current password is incorrect');
    }
    userPassword = payload.newPassword;
    return respond({ ok: true, message: 'Password changed' });
  },
  changePin: (payload: ChangePinRequest): Promise<OkResponse> => {
    if (payload.currentPin !== userPin) {
      return fail('Current PIN is incorrect');
    }
    userPin = payload.newPin;
    return respond({ ok: true, message: 'PIN changed' });
  },
  verifyPin: (pin: string): Promise<OkResponse> => {
    if (pin !== userPin) {
      return fail('Incorrect PIN');
    }
    return respond({ ok: true });
  },
  logout: (_payload: LogoutRequest): Promise<OkResponse> => {
    return respond({ ok: true });
  },
  deleteAccount: (payload: DeleteAccountRequest): Promise<OkResponse> => {
    if (payload.confirmation !== 'DELETE') {
      return fail('Confirmation text does not match');
    }
    if (payload.pin !== userPin) {
      return fail('Incorrect PIN');
    }
    return respond({ ok: true, message: 'Account deleted' });
  },

  // ── Profile ──────────────────────────────────────────────────────────
  updateProfile: (payload: UpdateProfileRequest): Promise<User> => {
    user = { ...user, ...payload };
    return respond(user);
  },
  biometricConsent: (payload: BiometricConsentRequest): Promise<OkResponse> => {
    biometricConsentAccepted = payload.accepted;
    user = {
      ...user,
      biometricConsentAt: payload.accepted ? new Date().toISOString() : null,
    };
    return respond({ ok: true, message: payload.accepted ? 'Consent recorded' : 'Consent withdrawn' });
  },

  // ── Family ───────────────────────────────────────────────────────────
  addFamilyMember: (payload: AddFamilyMemberRequest): Promise<FamilyMember> => {
    const age = ageFromDob(payload.dateOfBirth);
    const ageBand = age >= 18 ? '18+' : age >= 5 ? '5-17' : '0-4';
    const member: FamilyMember = {
      id: nextId('f'),
      name: payload.name,
      relationship: payload.relationship,
      age,
      ageBand: ageBand as FamilyMember['ageBand'],
      verification: ageBand === '0-4' ? 'Doc Verified' : 'Face + Doc Verified',
      turning18Soon: age === 17,
      faceEnrolled: false,
    };
    family = [...family, member];
    return respond(member);
  },
  removeFamilyMember: (id: string): Promise<OkResponse> => {
    family = family.filter((f) => f.id !== id);
    return respond({ ok: true, message: 'Member removed' });
  },

  // ── Documents ────────────────────────────────────────────────────────
  addDocument: (payload: AddDocumentRequest): Promise<IdentityDocument> => {
    const doc: IdentityDocument = {
      id: nextId('d'),
      type: payload.type,
      label: payload.label,
      number: payload.number,
      status: 'pending',
      matchScore: null,
      addedAt: new Date().toISOString().slice(0, 10),
      expiresAt: payload.expiresAt,
      source: 'uploaded',
      personId: payload.personId,
    };
    documents = [...documents, doc];
    return respond(doc);
  },
  removeDocument: (id: string): Promise<OkResponse> => {
    documents = documents.filter((d) => d.id !== id);
    return respond({ ok: true, message: 'Document removed' });
  },

  // ── Document verification sessions ───────────────────────────────────
  createVerificationSession: (documentId: string, _payload: VerificationSessionRequest): Promise<VerificationSession> => {
    return respond({
      id: nextId('vs'),
      status: 'created',
      documentId,
      createdAt: new Date().toISOString(),
    });
  },
  startVerification: (sessionId: string): Promise<OkResponse> => {
    return respond({ ok: true, message: `Verification started for ${sessionId}` });
  },
  pollVerification: (sessionId: string): Promise<VerificationSession> => {
    // Simulate completion after a short delay
    return respond({
      id: sessionId,
      status: 'completed',
      outcome: 'approved',
      documentId: 'mock-doc',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  },

  // ── Liveness (mock — simulates server-provided challenge sequence) ───
  createLivenessChallenge: (_personId?: string): Promise<LivenessChallengeResponse> => {
    const sequence: LivenessChallenge[] = ['turn_left', 'blink', 'turn_right'];
    return respond({
      success: true,
      session_id: nextId('lx'),
      session_token: 'mock-session-token',
      challenge_sequence: sequence,
      expires_in_seconds: 300,
      step_time_limits: { min_ms: 300, max_ms: 10000 },
      ui_copy: {
        blink: 'Blink your eyes',
        turn_left: 'Turn your head slowly to the left',
        turn_right: 'Turn your head slowly to the right',
      },
    });
  },
  submitLivenessEvidence: (
    _sessionId: string,
    payload: LivenessEvidenceRequest,
    _sessionToken: string,
  ): Promise<LivenessEvidenceResponse> => {
    return respond({
      success: true,
      step_accepted: true,
      next_challenge: payload.challenge === 'turn_left' ? 'blink' : payload.challenge === 'blink' ? 'turn_right' : undefined,
      next_instruction: payload.challenge === 'turn_left' ? 'Blink your eyes' : payload.challenge === 'blink' ? 'Turn your head slowly to the right' : undefined,
      status: 'in_progress',
    });
  },
  finalizeLiveness: (sessionId: string, _frameBase64: string, _sessionToken: string): Promise<LivenessFinalizeResponse> => {
    return respond({
      success: true,
      status: 'passed',
      session_id: sessionId,
      antispoof_score: 0.92,
      message: 'Liveness verified.',
    });
  },

  // ── Face enrollment / update ─────────────────────────────────────────
  enrollFace: (payload: FaceEnrollRequest): Promise<FaceResponse> => {
    user = { ...user, faceEnrolled: true };
    // If this is for a family member, mark them as face enrolled
    if (payload.personId) {
      family = family.map((f) =>
        f.id === payload.personId ? { ...f, faceEnrolled: true } : f,
      );
    }
    return respond({ ok: true, faceEnrolled: true, faceId: nextId('face') });
  },
  updateFace: (_payload: FaceUpdateRequest): Promise<FaceResponse> => {
    return respond({ ok: true, faceEnrolled: true, faceId: nextId('face') });
  },
};

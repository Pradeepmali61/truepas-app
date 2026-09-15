/**
 * Contract-accurate mock payloads for the static API reference screens.
 * Shapes mirror docs/CUSTOMER_APP_FRONTEND_INTEGRATION.md v1.2.0.
 */

export const USER = {
  id: "7fc63db0-62ad-4ca3-89c6-c903dbafe309",
  fullName: "Ada Example",
  email: "ada@example.com",
  phone: "+14155550123",
  faceEnrolled: true,
  biometricConsentAt: "2026-09-02T08:12:00Z",
};

export const IDENTITY_SUMMARY = {
  status: "incomplete",
  face: "verified",
  document: "missing",
  selfieMatch: "missing",
  activity: [] as unknown[],
};

export const DOCUMENTS = [
  {
    id: "doc-passport-01",
    type: "passport",
    label: "US Passport",
    number: "•••••6789",
    status: "verified",
    matchScore: 0.95,
    addedAt: "2026-09-02T08:00:00Z",
    expiresAt: "2030-01-01",
    source: "uploaded",
    personId: "person-ada",
    extractedName: "EXAMPLE ADA",
    extractedDob: "1990-01-02",
    extractedDocumentNumber: "•••••6789",
    dateOfExpiry: "2030-01-01",
    nationality: "USA",
    issuingState: "California",
    portraitImageUrl: null,
    documentImageUrl: null,
  },
  {
    id: "doc-dl-02",
    type: "drivingLicense",
    label: "Driver's License",
    number: "•••••4120",
    status: "pending",
    matchScore: null,
    addedAt: "2026-09-05T14:30:00Z",
    expiresAt: "2029-06-15",
    source: "uploaded",
    personId: "person-ada",
  },
];

export const VERIFICATION_SESSION = {
  id: "dvs-session-01",
  status: "completed",
  outcome: "approved",
  reasonCode: null,
  providerReference: "RGL-9F2A-4417",
  extractedName: "EXAMPLE ADA",
  extractedDob: "1990-01-02",
  extractedDocumentNumber: "•••••6789",
  dateOfExpiry: "2030-01-01",
  nationality: "USA",
  issuingState: "California",
  matchScore: 0.95,
  document: DOCUMENTS[0],
};

export const FAMILY = [
  {
    id: "person-child-01",
    name: "Maya Example",
    relationship: "Child",
    age: 10,
    ageBand: "5-17",
    verification: "pending_document",
    turning18Soon: false,
    faceCaptureMode: "liveness",
    allowedCameras: ["front"],
    faceEnrolled: false,
  },
  {
    id: "person-child-02",
    name: "Noah Example",
    relationship: "Child",
    age: 3,
    ageBand: "0-4",
    verification: "verified",
    turning18Soon: false,
    faceCaptureMode: "photo",
    allowedCameras: ["front", "back"],
    faceEnrolled: true,
  },
];

export const LIVENESS_CHALLENGE = {
  success: true,
  session_id: "lx-session",
  session_token: "<opaque token>",
  challenge_sequence: ["turn_left", "blink"],
  expires_in_seconds: 300,
  step_time_limits: { min_ms: 300, max_ms: 10000 },
  ui_copy: {
    blink: "Blink your eyes",
    turn_left: "Turn your head slowly to the left",
    turn_right: "Turn your head slowly to the right",
  },
};

export const BOOKINGS = [
  {
    id: "booking-01",
    venue: "Example Hotel",
    location: "Orlando, FL",
    type: "hotel",
    image: null,
    checkIn: "2026-09-01",
    checkOut: "2026-09-03",
    status: "completed",
    guests: 2,
    amount: 499.0,
    checkedInMembers: ["person-ada"],
  },
  {
    id: "booking-02",
    venue: "Sunset Arena",
    location: "Tampa, FL",
    type: "event",
    image: null,
    checkIn: "2026-10-12",
    checkOut: "2026-10-12",
    status: "upcoming",
    guests: 4,
    amount: 216.0,
    checkedInMembers: [] as string[],
  },
];

export const NOTIFICATIONS = [
  {
    id: "notif-01",
    title: "Face verification complete",
    body: "Your identity is ready for contactless check-in.",
    read: false,
    createdAt: "2026-09-02T08:15:00Z",
    type: "identity",
  },
  {
    id: "notif-02",
    title: "Document under review",
    body: "Your US Passport is being verified. We'll let you know when it finishes.",
    read: false,
    createdAt: "2026-09-05T14:31:00Z",
    type: "document",
  },
  {
    id: "notif-03",
    title: "Welcome to Truepas",
    body: "Complete your profile to unlock faster check-in.",
    read: true,
    createdAt: "2026-09-01T09:00:00Z",
    type: "account",
  },
];

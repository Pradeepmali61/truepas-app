import type {
  Booking,
  FamilyMember,
  IdentityDocument,
  IdentitySummary,
  User,
} from '@/types/domain';

/**
 * Mock API layer — mirrors the future REST contract with realistic latency.
 * Swap each function body for an `apiClient` call when the backend is ready.
 */
const LATENCY_MS = 450;

function respond<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), LATENCY_MS));
}

export const mockUser: User = {
  id: 'u1',
  fullName: 'Sarah Kim',
  email: 'sarah.kim@example.com',
  phone: '+1 555 010 2938',
  faceEnrolled: true,
  biometricConsentAt: '2026-07-01T10:00:00Z',
};

const identitySummary: IdentitySummary = {
  status: 'verified',
  face: 'verified',
  document: 'verified',
  selfieMatch: 'verified',
  activity: [
    { id: 'a1', title: 'Passport verified — match score 98%', timestamp: 'Today, 9:14 AM', tone: 'success' },
    { id: 'a2', title: 'Selfie matched with document portrait', timestamp: 'Today, 9:12 AM', tone: 'success' },
    { id: 'a3', title: 'Face enrolled successfully', timestamp: 'Jul 1, 10:04 AM', tone: 'success' },
  ],
};

const documents: IdentityDocument[] = [
  {
    id: 'd1',
    type: 'passport',
    label: 'Passport',
    number: 'P•••••4821',
    status: 'verified',
    matchScore: 98,
    addedAt: '2026-07-01',
    expiresAt: '2032-05-14',
  },
  {
    id: 'd2',
    type: 'drivingLicense',
    label: 'Driving License',
    number: 'DL•••••9034',
    status: 'pending',
    matchScore: null,
    addedAt: '2026-08-01',
    expiresAt: '2029-11-02',
  },
];

const family: FamilyMember[] = [
  {
    id: 'f1',
    name: 'Max Kim',
    relationship: 'Son',
    age: 17,
    ageBand: '5-17',
    verification: 'Face + Doc Verified',
    turning18Soon: true,
  },
  {
    id: 'f2',
    name: 'Lily Kim',
    relationship: 'Daughter',
    age: 3,
    ageBand: '0-4',
    verification: 'Doc Verified',
    turning18Soon: false,
  },
];

const bookings: Booking[] = [
  {
    id: 'b1',
    venue: 'Hayat Hotel',
    location: 'Goa, India',
    type: 'Hotel',
    image: 'hayat hotel',
    checkIn: 'Jul 21',
    checkOut: 'Jul 24',
    status: 'completed',
    guests: 2,
    amount: 14200,
  },
  {
    id: 'b2',
    venue: 'Theme Park',
    location: 'Mumbai, India',
    type: 'Theme Park',
    image: 'theme park',
    checkIn: 'Jun 02',
    checkOut: 'Jun 04',
    status: 'completed',
    guests: 1,
    amount: 5400,
  },
];

export const mockApi = {
  getUser: () => respond(mockUser),
  getIdentitySummary: () => respond(identitySummary),
  getDocuments: () => respond(documents),
  getDocument: (id: string) => respond(documents.find((d) => d.id === id) ?? null),
  getFamily: () => respond(family),
  getFamilyMember: (id: string) => respond(family.find((f) => f.id === id) ?? null),
  getBookings: () => respond(bookings),
  getBooking: (id: string) => respond(bookings.find((b) => b.id === id) ?? null),
};

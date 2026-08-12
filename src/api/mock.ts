import type {
    ActivityLogItem,
    Booking,
    FamilyMember,
    IdentityDocument,
    IdentitySummary,
    IssuedDoc,
    User
} from '@/types/domain';

import bookingsData from './data/bookings.json';
import documentsData from './data/documents.json';
import familyActivityData from './data/family-activity.json';
import familyData from './data/family.json';
import identitySummaryData from './data/identitySummary.json';
import issuedDocumentsData from './data/issued-documents.json';
import userData from './data/user.json';

/**
 * Mock API layer — mirrors the future REST contract with realistic latency.
 * Data is sourced from JSON fixtures in `src/api/data/` (not hardcoded here),
 * so it maps 1:1 onto the real backend JSON response shape. Swap each
 * function body for an `apiClient` call (see `src/api/endpoints.ts`) once
 * the backend endpoint is ready — done automatically via `src/api/index.ts`.
 */
const LATENCY_MS = 450;

function respond<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), LATENCY_MS));
}

export const mockUser: User = userData as User;

const identitySummary: IdentitySummary = identitySummaryData as IdentitySummary;

const documents: IdentityDocument[] = documentsData as IdentityDocument[];

const family: FamilyMember[] = familyData as FamilyMember[];

const bookings: Booking[] = bookingsData as Booking[];

const issuedDocuments: IssuedDoc[] = issuedDocumentsData as IssuedDoc[];

const familyActivity: ActivityLogItem[] = familyActivityData as ActivityLogItem[];

export const mockApi = {
  getUser: () => respond(mockUser),
  getIdentitySummary: () => respond(identitySummary),
  getDocuments: () => respond(documents),
  getDocument: (id: string) => respond(documents.find((d) => d.id === id) ?? null),
  getIssuedDocuments: () => respond(issuedDocuments),
  getFamily: () => respond(family),
  getFamilyMember: (id: string) => respond(family.find((f) => f.id === id) ?? null),
  getFamilyActivity: (_id: string) => respond(familyActivity),
  getBookings: () => respond(bookings),
  getBooking: (id: string) => respond(bookings.find((b) => b.id === id) ?? null),
};

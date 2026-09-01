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

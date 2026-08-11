import { apiClient } from '@/api/client';
import type {
  Booking,
  FamilyMember,
  IdentityDocument,
  IdentitySummary,
  User,
} from '@/types/domain';

/**
 * Real REST API layer — same function signatures as `mockApi` so screens/hooks
 * never need to change when we switch from mock JSON fixtures to the live
 * backend. Update the paths below to match the backend team's actual routes.
 */
export const realApi = {
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
  getFamily: async (): Promise<FamilyMember[]> => {
    const { data } = await apiClient.get<FamilyMember[]>('/family');
    return data;
  },
  getFamilyMember: async (id: string): Promise<FamilyMember | null> => {
    const { data } = await apiClient.get<FamilyMember>(`/family/${id}`);
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
};

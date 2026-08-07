import { useQuery } from '@tanstack/react-query';

import { mockApi } from '@/api/mock';

export const historyKeys = {
  all: ['bookings'] as const,
  detail: (id: string) => ['bookings', id] as const,
};

export function useBookings() {
  return useQuery({ queryKey: historyKeys.all, queryFn: mockApi.getBookings });
}

export function useBooking(id: string) {
  return useQuery({ queryKey: historyKeys.detail(id), queryFn: () => mockApi.getBooking(id) });
}

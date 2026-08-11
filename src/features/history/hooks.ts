import { useQuery } from '@tanstack/react-query';

import { api } from '@/api';

export const historyKeys = {
  all: ['bookings'] as const,
  detail: (id: string) => ['bookings', id] as const,
};

export function useBookings() {
  return useQuery({ queryKey: historyKeys.all, queryFn: api.getBookings });
}

export function useBooking(id: string) {
  return useQuery({ queryKey: historyKeys.detail(id), queryFn: () => api.getBooking(id) });
}

import { useQuery } from '@tanstack/react-query';

import { mockApi } from '@/api/mock';

export const documentKeys = {
  all: ['documents'] as const,
  detail: (id: string) => ['documents', id] as const,
};

export function useDocuments() {
  return useQuery({ queryKey: documentKeys.all, queryFn: mockApi.getDocuments });
}

export function useDocument(id: string) {
  return useQuery({ queryKey: documentKeys.detail(id), queryFn: () => mockApi.getDocument(id) });
}

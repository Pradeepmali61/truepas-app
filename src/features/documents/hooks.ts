import { useQuery } from '@tanstack/react-query';

import { api } from '@/api';

export const documentKeys = {
  all: ['documents'] as const,
  detail: (id: string) => ['documents', id] as const,
};

export function useDocuments() {
  return useQuery({ queryKey: documentKeys.all, queryFn: api.getDocuments });
}

export function useDocument(id: string) {
  return useQuery({ queryKey: documentKeys.detail(id), queryFn: () => api.getDocument(id) });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import type { AddDocumentRequest } from '@/types/domain';

export const documentKeys = {
  all: ['documents'] as const,
  detail: (id: string) => ['documents', id] as const,
  issued: ['documents', 'issued'] as const,
  member: (personId: string) => ['documents', 'member', personId] as const,
};

export function useDocuments(personId?: string) {
  return useQuery({
    queryKey: personId ? documentKeys.member(personId) : documentKeys.all,
    queryFn: () => api.getDocuments(personId),
  });
}

export function useDocument(id: string) {
  return useQuery({ queryKey: documentKeys.detail(id), queryFn: () => api.getDocument(id) });
}

export function useIssuedDocuments() {
  return useQuery({ queryKey: documentKeys.issued, queryFn: api.getIssuedDocuments });
}

export function useAddDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddDocumentRequest) => api.addDocument(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useRemoveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

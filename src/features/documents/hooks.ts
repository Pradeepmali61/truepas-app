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
    // Always refetch when the screen mounts — ensures newly added documents
    // show up even if cache invalidation timing is off.
    refetchOnMount: true,
    select: (data) => {
      console.log('[useDocuments] personId=', personId, '| docs returned=', data?.length, '| ids=', data?.map(d => d.id).join(','));
      return data;
    },
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
    onSuccess: (data, variables) => {
      // Invalidate all document queries (covers both self and member lists)
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      // Also explicitly invalidate the member-specific query if personId was set
      if (variables.personId) {
        queryClient.invalidateQueries({ queryKey: documentKeys.member(variables.personId) });
      }
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

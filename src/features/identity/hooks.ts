import { useQuery } from '@tanstack/react-query';

import { api } from '@/api';

export const identityKeys = {
  all: ['identity'] as const,
  summary: ['identity', 'summary'] as const,
};

/** GET /cb/identity/summary — verification status for the identity dashboard. */
export function useIdentitySummary() {
  return useQuery({
    queryKey: identityKeys.summary,
    queryFn: () => api.getIdentitySummary(),
    refetchOnMount: true,
  });
}

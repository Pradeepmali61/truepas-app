import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import { ageFromDob } from '@/utils/age';
import type { AddFamilyMemberRequest, FamilyAgeBand, FamilyMember } from '@/types/domain';

export { ADULT_AGE, ageFromDob } from '@/utils/age';

export const familyKeys = {
  all: ['family'] as const,
  detail: (id: string) => ['family', id] as const,
  activity: (id: string) => ['family', id, 'activity'] as const,
};

export function useFamily() {
  return useQuery({ queryKey: familyKeys.all, queryFn: api.getFamily });
}

export function useFamilyMember(id?: string) {
  return useQuery({
    queryKey: familyKeys.detail(id ?? ''),
    queryFn: () => api.getFamilyMember(id!),
    enabled: !!id,
  });
}

export function useFamilyActivity(id?: string) {
  return useQuery({
    queryKey: familyKeys.activity(id ?? ''),
    queryFn: () => api.getFamilyActivity(id!),
    enabled: !!id,
  });
}

export function useAddFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddFamilyMemberRequest) => api.addFamilyMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}

export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeFamilyMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}

/** Backend age rules: 0-4 photo enrollment · 5-9 liveness (front or back camera) · 10+ liveness (front only). */
export function ageBandFromAge(age: number): FamilyAgeBand {
  if (age >= 10) return '10+';
  if (age >= 5) return '5-9';
  return '0-4';
}

/** Member already on the account with the same name + DOB (age when the
 *  backend omits dateOfBirth) — the backend rejects re-adding them. */
export function findMatchingMember(
  list: FamilyMember[] | undefined,
  name: string,
  dob: string,
): FamilyMember | null {
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  const day = dob.split('T')[0];
  const age = ageFromDob(dob);
  return (
    (list ?? []).find(
      (m) =>
        norm(m.name) === norm(name) &&
        (m.dateOfBirth ? m.dateOfBirth.split('T')[0] === day : m.age === age),
    ) ?? null
  );
}

/** Backend "already exists" rejection on POST /family. */
export function isDuplicateMemberError(err: any): boolean {
  const status = err?.response?.status;
  const msg = String(err?.response?.data?.message ?? '');
  return status === 409 || /already exists/i.test(msg);
}

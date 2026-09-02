import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import type { AddFamilyMemberRequest, FamilyAgeBand } from '@/types/domain';

export const familyKeys = {
  all: ['family'] as const,
  detail: (id: string) => ['family', id] as const,
  activity: (id: string) => ['family', id, 'activity'] as const,
};

export function useFamily() {
  return useQuery({ queryKey: familyKeys.all, queryFn: api.getFamily });
}

export function useFamilyMember(id: string) {
  return useQuery({ queryKey: familyKeys.detail(id), queryFn: () => api.getFamilyMember(id) });
}

export function useFamilyActivity(id: string) {
  return useQuery({ queryKey: familyKeys.activity(id), queryFn: () => api.getFamilyActivity(id) });
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

/** PRD age rules: 0-4 doc only · 5-17 doc + selfie + face · 18+ rejected. */
export function ageBandFromAge(age: number): FamilyAgeBand {
  if (age >= 18) return '18+';
  if (age >= 5) return '5-17';
  return '0-4';
}

export function ageFromDob(dob: string): number {
  const match = dob.match(/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/);
  if (!match) return NaN;
  const [, month, day, year] = match;
  const birth = new Date(Number(year), Number(month) - 1, Number(day));
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

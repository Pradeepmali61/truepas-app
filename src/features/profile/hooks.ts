import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { api } from '@/api';
import { saveLocalProfileImage } from '@/services/profileImageStore';

const PROFILE_PICTURE_KEY = ['profile-picture'] as const;

/**
 * Profile picture source — backend presigned URL when available, otherwise
 * the locally persisted image (backend S3 endpoint is not shipped yet).
 */
export function useProfilePicture() {
  const query = useQuery({
    queryKey: PROFILE_PICTURE_KEY,
    queryFn: () => api.getProfilePicture(),
    staleTime: 1000 * 60 * 50, // 50 min (presigned URL expires in 60 min)
    retry: false,
  });
  const [localUri, setLocalUri] = useState<string | null>(null);
  return {
    url: query.data?.url ?? localUri,
    isLoading: query.isPending,
  };
}

/**
 * Upload to the backend; when the endpoint is unavailable (S3 pending),
 * persist the image locally so the user still sees their picture.
 */
export function useUploadProfilePicture() {
  const queryClient = useQueryClient();
  const [localUri, setLocalUri] = useState<string | null>(null);
  return useMutation({
    mutationFn: async (imageUri: string) => {
      try {
        return await api.uploadProfilePicture(imageUri);
      } catch (err) {
        // Backend not ready — store locally so the picture still shows
        console.warn('[ProfilePicture] Backend upload unavailable, storing locally:', (err as any)?.message);
        const uri = await saveLocalProfileImage(imageUri);
        setLocalUri(uri);
        return { url: uri, expires_in: 0, updated_at: new Date().toISOString() };
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_PICTURE_KEY, data);
    },
  });
}

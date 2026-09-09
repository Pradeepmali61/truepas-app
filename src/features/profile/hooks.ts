import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { getLocalProfileImage, saveLocalProfileImage } from '@/services/profileImageStore';

const PROFILE_PICTURE_KEY = ['profile-picture'] as const;

/**
 * Profile picture source — backend presigned URL when available, otherwise
 * the locally persisted image (backend S3 endpoint is not shipped yet).
 *
 * The local file is ALWAYS loaded as a fallback so the picture survives
 * logout/login (the React Query cache is cleared on logout and the backend
 * endpoint 404s until it ships).
 */
export function useProfilePicture() {
  const query = useQuery({
    queryKey: PROFILE_PICTURE_KEY,
    queryFn: () => api.getProfilePicture(),
    staleTime: 1000 * 60 * 50, // 50 min (presigned URL expires in 60 min)
    retry: false,
  });
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    getLocalProfileImage()
      .then(setLocalUri)
      .catch(() => {});
  }, []);

  // Cache-bust ONLY local file URIs: saveLocalProfileImage overwrites the
  // same path on every upload, so React Native's Image cache would show the
  // stale picture. Backend presigned URLs are left untouched — appending a
  // query param would invalidate the S3 signature.
  const rawUrl = query.data?.url ?? localUri;
  const url = rawUrl && rawUrl.startsWith('file://')
    ? `${rawUrl}?t=${encodeURIComponent(query.data?.updated_at ?? '0')}`
    : rawUrl;

  return {
    url,
    isLoading: query.isPending,
  };
}

/**
 * Upload to the backend; when the endpoint is unavailable (S3 pending),
 * persist the image locally so the user still sees their picture.
 */
export function useUploadProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageUri: string) => {
      try {
        return await api.uploadProfilePicture(imageUri);
      } catch (err) {
        // Backend not ready — store locally so the picture still shows
        console.warn('[ProfilePicture] Backend upload unavailable, storing locally:', (err as any)?.message);
        const uri = await saveLocalProfileImage(imageUri);
        return { url: uri, expires_in: 0, updated_at: new Date().toISOString() };
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_PICTURE_KEY, data);
    },
  });
}

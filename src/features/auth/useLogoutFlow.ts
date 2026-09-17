import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useLogout } from '@/features/auth/mutations';
import { sessionEnded } from '@/features/auth/slice';
import { clearAllDocumentImages } from '@/services/documentImageStore';
import { clearAllProfileImages } from '@/services/profileImageStore';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch } from '@/store';

/**
 * Full logout — server revoke (best-effort) + guaranteed local teardown:
 * React Query cache, Redux session, tokens (in-memory + secure store),
 * session-scoped in-memory stashes (cleared inside sessionEnded), and the
 * filesystem caches (captured document images, profile/member pictures).
 *
 * The server call never blocks local cleanup — even if /auth/logout fails
 * or no refresh token is readable, the session ends locally.
 * Every logout entry point uses this so the wipe can't drift between screens.
 *
 * `isPending` mirrors the /auth/logout call so buttons can show a spinner.
 */
export function useLogoutFlow() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const serverLogout = useLogout();

  const logout = useCallback(async () => {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        await serverLogout.mutateAsync({ refreshToken });
      }
    } catch {
      // Best-effort — local teardown below runs regardless.
    }
    await Promise.allSettled([clearAllDocumentImages(), clearAllProfileImages()]);
    queryClient.clear();
    dispatch(sessionEnded());
    router.dismissTo('/(auth)/login' as never);
  }, [serverLogout, dispatch, router, queryClient]);

  return { logout, isPending: serverLogout.isPending };
}

import type { AccountDetailsRequest } from '@/types/domain';

/**
 * In-memory stash of the last submitted account-details payload.
 *
 * The email OTP is (re)sent by POST /auth/account-details — the backend has no
 * dedicated resend endpoint. When the user taps "Resend code" on the
 * verify-email screen, we re-submit the stashed payload (the registration
 * token is still held in api/client memory until email verification completes)
 * so the backend sends a fresh email.
 */
let lastPayload: AccountDetailsRequest | null = null;

export const accountDetailsStore = {
  stash(payload: AccountDetailsRequest): void {
    lastPayload = payload;
  },
  get(): AccountDetailsRequest | null {
    return lastPayload;
  },
  clear(): void {
    lastPayload = null;
  },
};

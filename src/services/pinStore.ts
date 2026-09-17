/**
 * In-memory stash of the PIN verified at the confirm-pin gate.
 *
 * change-pin needs the current PIN as `currentPin` in POST /auth/change-pin.
 * Passing it as a route param leaks it into navigation state / deep-link
 * history, so the gate stashes it here instead — cleared after the change
 * succeeds or the change screen unmounts.
 */
let verifiedPin: string | null = null;

export const pinStore = {
  set(pin: string): void {
    verifiedPin = pin;
  },
  get(): string | null {
    return verifiedPin;
  },
  clear(): void {
    verifiedPin = null;
  },
};

/**
 * One-shot in-memory flags that prove a result/gated screen was reached
 * through the real flow — not via a deep link, app relaunch, or replay.
 *
 * A screen that claims a real outcome (account deleted, face updated,
 * onboarding finished) must only render when the step that produced that
 * outcome granted its flag. Flags live in memory only, so a process restart
 * automatically invalidates every pending one.
 */
const flags = new Set<string>();

export const flowGuards = {
  grant(key: string): void {
    flags.add(key);
  },
  /** Pure check — safe to call during render. */
  has(key: string): boolean {
    return flags.has(key);
  },
  /** True once, then removed — a granted path can't be replayed. */
  consume(key: string): boolean {
    const ok = flags.delete(key);
    return ok;
  },
};

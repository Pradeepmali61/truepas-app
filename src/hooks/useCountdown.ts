import { useEffect, useState } from 'react';

/**
 * Deadline-based countdown (survives re-renders and background time drift).
 * Returns remaining seconds and a reset function.
 */
export function useCountdown(initialSeconds: number): {
  seconds: number;
  reset: () => void;
} {
  const [deadline, setDeadline] = useState(() => Date.now() + initialSeconds * 1000);
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return {
    seconds,
    reset: () => setDeadline(Date.now() + initialSeconds * 1000),
  };
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

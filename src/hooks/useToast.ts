import { useContext } from 'react';

import { ToastContext } from '@/components/ui/ToastProvider';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { show: () => {} };
  }
  return ctx;
}

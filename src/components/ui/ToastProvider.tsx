import { createContext, useCallback, useRef, useState } from 'react';
import { View } from 'react-native';

import { ToastData, ToastItem, ToastVariant } from './Toast';

interface ToastContextValue {
  show: (variant: ToastVariant, message: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((variant: ToastVariant, message: string, duration = 3000) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, variant, message, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

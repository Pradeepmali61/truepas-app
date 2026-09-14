import { useToast as useNewToast } from "@/components/composite/Toast";

/**
 * Compatibility toast hook — exposes the legacy `.show(variant, message, duration)`
 * API, delegating to the new token-based ToastProvider's `.toast({title, ...})`.
 */
export function useToast() {
  const ctx = useNewToast();
  return {
    show: (variant: string, message: string, duration?: number) => {
      ctx.toast({
        variant: variant as "default" | "info" | "success" | "warning" | "error",
        title: message,
        duration,
      });
    },
  };
}

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import type {
    AccountDetailsRequest,
    ChangePasswordRequest,
    ChangePinRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    VerifyOtpRequest
} from '@/types/domain';

/** Auth + account write operations (login, register, password/PIN, profile). */

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => api.login(payload),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => api.register(payload),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (payload: VerifyOtpRequest) => api.verifyOtp(payload),
  });
}

export function useCompleteAccountDetails() {
  return useMutation({
    mutationFn: (payload: AccountDetailsRequest) => api.completeAccountDetails(payload),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => api.forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) => api.resetPassword(payload),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => api.changePassword(payload),
  });
}

export function useChangePin() {
  return useMutation({
    mutationFn: (payload: ChangePinRequest) => api.changePin(payload),
  });
}

export function useVerifyPin() {
  return useMutation({
    mutationFn: (pin: string) => api.verifyPin(pin),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => api.deleteAccount(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => api.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

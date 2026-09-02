import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, FloatingInput } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useForgotPassword, useResetPassword, useVerifyOtp } from '@/features/auth/mutations';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const forgotPassword = useForgotPassword();
  const verifyOtp = useVerifyOtp();
  const resetPassword = useResetPassword();

  const handleSendOtp = async () => {
    if (!email) { setError('Enter your email'); return; }
    setError('');
    try {
      await forgotPassword.mutateAsync({ email });
      setStep('otp');
    } catch (err: any) {
      setError(err?.message ?? 'Could not send code. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setError('');
    try {
      await verifyOtp.mutateAsync({ otp });
      setStep('reset');
    } catch (err: any) {
      setError(err?.message ?? 'Invalid OTP. Please try again.');
    }
  };

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) { setError('All fields are required'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    try {
      await resetPassword.mutateAsync({ email, otp, newPassword });
      Alert.alert('Success', 'Your password has been reset successfully.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      setError(err?.message ?? 'Could not reset password. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56 }}>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.ink }}>
          {step === 'email' ? 'Forgot Password' : step === 'otp' ? 'Verify OTP' : 'Reset Password'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, flexGrow: 1 }}>
        {step === 'email' && (
          <>
            <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
              Enter your registered email and we'll send you a verification code.
            </Text>
            <FloatingInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            {error ? <Text style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 12 }}>{error}</Text> : null}
            <Button label="Send Code" onPress={handleSendOtp} loading={forgotPassword.isPending} />
          </>
        )}

        {step === 'otp' && (
          <>
            <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
              We sent a 6-digit code to {email}. Enter it below.
            </Text>
            <FloatingInput label="OTP Code" value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" />
            {error ? <Text style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 12 }}>{error}</Text> : null}
            <Button label="Verify" onPress={handleVerifyOtp} loading={verifyOtp.isPending} />
          </>
        )}

        {step === 'reset' && (
          <>
            <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
              Enter your new password below.
            </Text>
            <FloatingInput label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <FloatingInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            {error ? <Text style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 12 }}>{error}</Text> : null}
            <Button label="Reset Password" onPress={handleReset} loading={resetPassword.isPending} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

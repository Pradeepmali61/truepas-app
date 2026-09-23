import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, Mail, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api';
import { toApiError } from '@/api/errors';
import { TruepasIcon } from '@/components/app/TruepasIcon';
import { Alert, FormField, ScreenHeader, Section } from '@/components/composite';
import {
    CoreButton,
    Input,
    Link,
    NeuBox,
    NeuSegmented,
    Select,
    Typography
} from '@/components/ui';
import { COUNTRIES, DEFAULT_COUNTRY_CODE } from '@/constants/countries';
import { loginSchema } from '@/features/auth/schemas';
import { sessionStarted } from '@/features/auth/slice';
import { useKeyboardScrollPad } from '@/hooks/useKeyboardScrollPad';
import { useAppDispatch } from '@/store';
import { makeStyles, useThemeTokens } from '@/theme';

type IdentifierMode = 'email' | 'phone';

/**
 * Login — POST /auth/login { identifier, password } → AuthResponse.
 * sessionStarted stores tokens + user; the index gate then routes to consent
 * automatically when faceEnrolled is false.
 * Ported 1:1 from UI-design-repo src/app/screens/auth/LoginScreen.tsx — the
 * phone-number normalization, session-expired banner and 429 Retry-After
 * messaging are our real backend contract, kept on top.
 */
export default function LoginScreen() {
  const styles = useStyles();
  const t = useThemeTokens();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const kbd = useKeyboardScrollPad();
  // Set by the session-expired handler in _layout — explains why the user
  // landed here instead of silently dropping them on a bare login form.
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const [mode, setMode] = useState<IdentifierMode>('email');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setIdentifierError(fields.identifier?.[0]);
      setPasswordError(fields.password?.[0]);
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      let value = identifier.trim();
      if (mode === 'phone') {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          setIdentifierError('Enter a valid mobile number');
          return;
        }
        const cc = countryCode.slice(1);
        // A bare national number is ≤10 digits — always prepend the country
        // code. Only treat it as already-international when it's longer AND
        // starts with the cc digits (a 10-digit number can itself start with
        // '91', e.g. 9198765432, and must still get the +91 prefix).
        value = digits.startsWith(cc) && digits.length > 10 ? `+${digits}` : `${countryCode}${digits}`;
      }

      const { user, accessToken, refreshToken } = await api.login({
        identifier: value,
        password,
      });

      if (!accessToken || !refreshToken) {
        setFormError(
          'Login incomplete — tokens missing. Please finish registration or contact support.',
        );
        return;
      }

      dispatch(sessionStarted({ user, accessToken, refreshToken }));
    } catch (error) {
      const apiErr = toApiError(error);
      // Surface the server's Retry-After on 429/lockout so the user knows
      // when the next attempt will work instead of hammering the button.
      setFormError(
        apiErr.retryAfterSeconds
          ? `${apiErr.message} Try again in ${apiErr.retryAfterSeconds}s.`
          : apiErr.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScreenHeader onBack={() => router.back()} />
        <ScrollView
          {...kbd.scrollProps}
          contentContainerStyle={{
            padding: t.spacing[4],
            paddingTop: t.spacing[4],
            gap: t.spacing[6],
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <NeuBox
              variant="raised"
              radius={t.radii.lg}
              depth={4}
              color={t.colors.actionPrimary}
              style={styles.brandIcon}>
              <TruepasIcon size={t.iconSize.sm} color={t.colors.onActionPrimary} />
            </NeuBox>
            <Typography variant="h4">Truepas</Typography>
          </View>

          <View style={styles.heading}>
            <Typography variant="h2" center>
              Welcome back
            </Typography>
            <Typography color="secondary" center>
              Sign in with your email or phone.
            </Typography>
          </View>

          {reason === 'session-expired' ? (
            <Alert variant="warning" title="Session expired">
              For your security, you were signed out. Please sign in again to continue.
            </Alert>
          ) : null}

          <Section>
            <NeuSegmented
              label="Sign in method"
              options={[
                { value: 'email', label: 'Email', icon: Mail },
                { value: 'phone', label: 'Phone', icon: Phone },
              ]}
              value={mode}
              onChange={(m) => {
                setMode(m);
                setIdentifier('');
                setIdentifierError(undefined);
                setFormError(null);
              }}
            />
            <FormField
              label={mode === 'email' ? 'Email' : 'Phone number'}
              error={identifierError}>
              {mode === 'email' ? (
                <Input
                  placeholder="ada@example.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={identifier}
                  onChangeText={(v) => {
                    setIdentifier(v);
                    setIdentifierError(undefined);
                    setFormError(null);
                  }}
                  iconLeft={<Mail size={t.iconSize.md} color={t.colors.actionPrimary} />}
                />
              ) : (
                <View style={styles.phoneRow}>
                  <Select
                    options={COUNTRIES.map((c) => ({
                      value: c.code,
                      label: `${c.flag} ${c.name} (${c.code})`,
                      fieldLabel: `${c.flag} ${c.code}`,
                    }))}
                    value={countryCode}
                    onValueChange={setCountryCode}
                    accessibilityLabel="Country code"
                    style={styles.ccSelect}
                  />
                  <Input
                    placeholder="(555) 555-0123"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="phone-pad"
                    value={identifier}
                    onChangeText={(v) => {
                      setIdentifier(v);
                      setIdentifierError(undefined);
                      setFormError(null);
                    }}
                    state={identifierError ? 'error' : 'default'}
                    containerStyle={styles.phoneInput}
                    iconLeft={<Phone size={t.iconSize.md} color={t.colors.actionPrimary} />}
                  />
                </View>
              )}
            </FormField>
            <FormField label="Password" error={passwordError}>
              <Input
                placeholder="••••••••••"
                secureTextEntry
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setPasswordError(undefined);
                  setFormError(null);
                }}
                iconLeft={<Lock size={t.iconSize.md} color={t.colors.actionPrimary} />}
              />
            </FormField>

            {formError && (
              <Typography variant="caption" color="error" center>
                {formError}
              </Typography>
            )}

            <View style={styles.helperRow}>
              <Link onPress={() => router.push('/(auth)/forgot-password' as never)}>
                Forgot password?
              </Link>
            </View>
          </Section>
        </ScrollView>

        <View
          {...kbd.footerProps}
          style={{
            paddingHorizontal: t.spacing[4],
            paddingTop: t.spacing[6],
            paddingBottom: t.spacing[4] + insets.bottom,
            gap: t.spacing[2],
          }}>
          <CoreButton
            fullWidth
            size="lg"
            loading={loading}
            disabled={!identifier.trim() || !password}
            onPress={() => void submit()}>
            Sign in
          </CoreButton>
          <Typography variant="body-sm" color="muted" center>
            New to Truepas?{' '}
            <Link onPress={() => router.push('/(auth)/register')}>Create account</Link>
          </Typography>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing[2],
  },
  brandIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { alignItems: 'center', gap: t.spacing[1] },
  phoneRow: { flexDirection: 'row', gap: t.spacing[2] },
  ccSelect: { width: 110 },
  phoneInput: { flex: 1 },
  helperRow: { flexDirection: 'row', justifyContent: 'flex-end' },
}));

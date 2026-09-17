import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RegisterCard } from '@/components/truepas';
import { makeStyles } from '@/theme';

/** Register — "Create your account" card composition from the ui-native kit
 *  (components/truepas/auth.tsx). Design target; the phone-first
 *  POST /cb/auth/register flow is not wired to this card. */
export default function RegisterScreen() {
  const styles = useStyles();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <RegisterCard
            style={styles.card}
            onCreateAccount={() => router.push('/(auth)/verify-phone')}
            onSignIn={() => router.push('/(auth)/login')}
            onTerms={() => router.push('/legal/terms' as never)}
            onPrivacy={() => router.push('/legal/privacy-policy' as never)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  body: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing[4] },
  card: { width: '100%', maxWidth: 380 },
}));

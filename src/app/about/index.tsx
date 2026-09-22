import { useRouter } from 'expo-router';
import {
    CircleCheck,
    FileText,
    Lock,
    Mail,
    MapPin,
    QrCode,
    ScanFace,
    Shield,
    Users,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TruepasIcon } from '@/components/app/TruepasIcon';
import { ScreenHeader } from '@/components/composite';
import { Badge, NeuBox, RowIcon, Typography } from '@/components/ui';
import { useThemeTokens } from '@/theme';
import { iconSize } from '@/theme/tokens';

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  const theme = useThemeTokens();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.spacing[3],
        marginBottom: theme.spacing[5],
      }}>
      <RowIcon tone="primary" icon={icon} />
      <View style={{ flex: 1, gap: theme.spacing[0.5] }}>
        <Typography variant="body" style={{ fontWeight: theme.fontWeight.semibold }}>
          {title}
        </Typography>
        <Typography variant="body-sm" color="secondary">
          {desc}
        </Typography>
      </View>
    </View>
  );
}

export default function AboutScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const icon = (I: typeof Shield) => <I size={iconSize.md} color={theme.colors.actionPrimary} />;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="About Truepas" onBack={router.back} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: theme.spacing[4], paddingBottom: theme.spacing[8] }}>
        {/* Logo + tagline */}
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing[4], gap: theme.spacing[2] }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: theme.radii.xl,
              backgroundColor: theme.colors.actionPrimary,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadows.lg,
            }}>
            <TruepasIcon size={iconSize.xl} color={theme.colors.onActionPrimary} />
          </View>
          <Typography variant="h2">Truepas</Typography>
          <Typography variant="body-sm" color="secondary">
            Your identity, verified everywhere.
          </Typography>
          <Badge variant="primary" icon={<CircleCheck size={iconSize.xs} color={theme.colors.actionPrimary} />}>
            Version 1.0.0
          </Badge>
        </View>

        {/* About text */}
        <Typography variant="body-sm" color="secondary" center style={{ marginBottom: theme.spacing[6] }}>
          Truepas is a secure digital identity platform that lets you store, verify, and share your
          identity documents with businesses in seconds — no paper, no queues, no hassle.
        </Typography>

        {/* Features */}
        <Typography variant="h4" style={{ marginBottom: theme.spacing[4] }}>
          What Truepas Offers
        </Typography>
        <Feature
          icon={icon(Shield)}
          title="Bank-Grade Security"
          desc="Your documents are encrypted and stored with the same security standards used by leading banks and financial institutions."
        />
        <Feature
          icon={icon(ScanFace)}
          title="Face Verification"
          desc="Biometric face enrollment ensures that only you can access and share your identity — no one else can impersonate you."
        />
        <Feature
          icon={icon(FileText)}
          title="Document Vault"
          desc="Store passports, driver's licenses, birth certificates, visas, and more — all in one secure, organized place."
        />
        <Feature
          icon={icon(Users)}
          title="Family Sharing"
          desc="Add family members and manage their identity documents from a single account. Perfect for parents and dependents."
        />
        <Feature
          icon={icon(QrCode)}
          title="Instant Check-In"
          desc="Share your verified identity with hotels, cruises, theme parks, and more via QR code — skip the front desk queues."
        />
        <Feature
          icon={icon(Lock)}
          title="You're in Control"
          desc="You decide what to share and with whom. Every sharing action requires your PIN and face verification."
        />

        {/* Mission */}
        <NeuBox
          variant="raised"
          depth={4}
          color={theme.colors.surface}
          style={{ padding: theme.spacing[4], marginBottom: theme.spacing[6] }}>
          <Typography variant="body" style={{ fontWeight: theme.fontWeight.semibold, marginBottom: theme.spacing[2] }}>
            Our Mission
          </Typography>
          <Typography variant="body-sm" color="secondary">
            To eliminate identity fraud and make identity verification effortless for everyone,
            everywhere. We believe your identity should be yours to own, control, and share —
            securely and instantly.
          </Typography>
        </NeuBox>

        {/* Contact */}
        <Typography variant="h4" style={{ marginBottom: theme.spacing[3] }}>
          Get in Touch
        </Typography>
        <View style={{ gap: theme.spacing[2], marginBottom: theme.spacing[6] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
            <Mail size={iconSize.sm} color={theme.colors.actionPrimary} />
            <Typography variant="body-sm">support@truepas.com</Typography>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
            <MapPin size={iconSize.sm} color={theme.colors.actionPrimary} />
            <Typography variant="body-sm">San Francisco, California</Typography>
          </View>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
          <Typography variant="caption" color="muted">
            © 2025 Truepas. All rights reserved.
          </Typography>
          <Typography variant="caption" color="muted">
            Made with care for your privacy.
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

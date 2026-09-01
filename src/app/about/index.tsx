import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14, marginBottom: 20 }}>
      <View style={{
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#F0FAFF',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={icon as never} size={22} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.ink, marginBottom: 3 }}>{title}</Text>
        <Text style={{ fontSize: 13, fontWeight: '400', color: Colors.textMuted, lineHeight: 19 }}>{desc}</Text>
      </View>
    </View>
  );
}

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={22} color={Colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.ink, marginRight: 44 }}>
          About Truepas
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Logo + tagline */}
        <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 24 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: '#08B6FC',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#08B6FC', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
          }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFFFFF' }}>T</Text>
          </View>
          <Text style={{ marginTop: 16, fontSize: 24, fontWeight: '800', color: Colors.ink }}>Truepas</Text>
          <Text style={{ marginTop: 4, fontSize: 14, color: Colors.textMuted }}>Your identity, verified everywhere.</Text>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FAFF', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
            <Icon name="checkCircle" size={14} color="#08B6FC" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.primary }}>Version 1.0.0</Text>
          </View>
        </View>

        {/* About text */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <Text style={{ fontSize: 14, fontWeight: '400', color: Colors.textMuted, lineHeight: 22, textAlign: 'center' }}>
            Truepas is a secure digital identity platform that lets you store, verify, and share your identity documents with businesses in seconds — no paper, no queues, no hassle.
          </Text>
        </View>

        {/* Features */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.ink, marginBottom: 16 }}>What Truepas Offers</Text>

          <Feature
            icon="shield"
            title="Bank-Grade Security"
            desc="Your documents are encrypted and stored with the same security standards used by leading banks and financial institutions."
          />
          <Feature
            icon="scanFace"
            title="Face Verification"
            desc="Biometric face enrollment ensures that only you can access and share your identity — no one else can impersonate you."
          />
          <Feature
            icon="documents"
            title="Document Vault"
            desc="Store passports, driver's licenses, birth certificates, visas, and more — all in one secure, organized place."
          />
          <Feature
            icon="family"
            title="Family Sharing"
            desc="Add family members and manage their identity documents from a single account. Perfect for parents and dependents."
          />
          <Feature
            icon="qr"
            title="Instant Check-In"
            desc="Share your verified identity with hotels, cruises, theme parks, and more via QR code — skip the front desk queues."
          />
          <Feature
            icon="lock"
            title="You're in Control"
            desc="You decide what to share and with whom. Every sharing action requires your PIN and face verification."
          />
        </View>

        {/* Mission */}
        <View style={{ marginHorizontal: 24, marginBottom: 28, padding: 20, backgroundColor: '#F0FAFF', borderRadius: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.ink, marginBottom: 8 }}>Our Mission</Text>
          <Text style={{ fontSize: 13, fontWeight: '400', color: Colors.textMuted, lineHeight: 20 }}>
            To eliminate identity fraud and make identity verification effortless for everyone, everywhere. We believe your identity should be yours to own, control, and share — securely and instantly.
          </Text>
        </View>

        {/* Contact */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.ink, marginBottom: 12 }}>Get in Touch</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <Icon name="email" size={18} color={Colors.primary} />
            <Text style={{ fontSize: 14, color: Colors.ink }}>support@truepas.com</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="location" size={18} color={Colors.primary} />
            <Text style={{ fontSize: 14, color: Colors.ink }}>San Francisco, California</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', paddingTop: 16 }}>
          <Text style={{ fontSize: 12, color: Colors.textMuted }}>© 2025 Truepas. All rights reserved.</Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>Made with care for your privacy.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

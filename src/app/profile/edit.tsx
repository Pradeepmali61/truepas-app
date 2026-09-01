import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAppSelector } from '@/store';

function InfoField({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#F0FAFF',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon as never} size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '400', color: Colors.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.ink, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

function HalfField({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#F0FAFF',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon as never} size={20} color={Colors.primary} />
      </View>
      <View>
        <Text style={{ fontSize: 12, fontWeight: '400', color: Colors.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.ink, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

/** Edit profile — Personal Info with address section. */
export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  const initials = (user?.fullName ?? 'U')
    .split(' ')
    .map((part) => part[0])
    .join('');

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={22} color={Colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.ink, marginRight: 44 }}>
          Personal Info
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
          <View>
            <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: '700', color: Colors.primary }}>{initials}</Text>
            </View>
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: Colors.primary,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: '#FFFFFF',
            }}>
              <Icon name="camera" size={14} color="#FFFFFF" />
            </View>
          </View>
          <Text style={{ marginTop: 12, fontSize: 20, fontWeight: '700', color: Colors.ink }}>{user?.fullName ?? 'User'}</Text>
          <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 }}>
            <Icon name="checkCircle" size={14} color="#059669" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#059669' }}>Verified Account</Text>
          </View>
        </View>

        {/* Basic Information */}
        <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.ink, marginBottom: 4 }}>Basic Information</Text>
          <InfoField icon="user" label="First Name" value={user?.fullName?.split(' ')[0] ?? '—'} />
          <InfoField icon="user" label="Last Name" value={user?.fullName?.split(' ').slice(1).join(' ') || '—'} />
          <InfoField icon="phone" label="Mobile Number" value={user?.phone ?? '—'} />
          <InfoField icon="email" label="Email" value={user?.email ?? '—'} />
          <InfoField icon="cake" label="Date of Birth" value="04/12/1994" />
        </View>

        {/* Address */}
        <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.ink, marginBottom: 4 }}>Address</Text>
          <InfoField icon="location" label="Address" value="Mumbai - Pune Expressway" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <HalfField icon="identity" label="City" value="Navi Mumbai" />
            <HalfField icon="identity" label="State" value="MH" />
          </View>
          <InfoField icon="documents" label="Country" value="IN" />
          <InfoField icon="document" label="ZIP Code" value="400074" />
        </View>

        {/* Support note */}
        <View style={{ marginHorizontal: 16, marginTop: 16, padding: 12, backgroundColor: '#F8FBFF', borderRadius: 12 }}>
          <Text style={{ fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>
            To update any information, please contact our support team
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Icon, Skeleton } from '@/components/ui';
import { Colors, Elevation } from '@/constants/theme';
import { useFamilyActivity, useFamilyMember } from '@/features/family/hooks';

const AVATAR_GRADIENTS = [
  ['#EEF2FF', '#C7D2FE'],
  ['#F0FDF4', '#BBF7D0'],
  ['#FFF7ED', '#FED7AA'],
  ['#FDF2F8', '#FBCFE8'],
  ['#EFF6FF', '#BFDBFE'],
  ['#FAF5FF', '#DDD6FE'],
];

function getAvatarGradient(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

/** Family member detail — verification summary, documents, activity log. */
export default function FamilyMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member, isPending } = useFamilyMember(id);
  const { data: activity } = useFamilyActivity(id ?? '');
  const [menuOpen, setMenuOpen] = useState(false);

  if (isPending) {
    return (
      <ScreenContainer scroll={false}>
        <ScreenHeader title="Family Member" />
        <View className="gap-3 px-5 pt-5">
          <Skeleton height={72} radius={16} />
          <Skeleton height={120} radius={16} />
        </View>
      </ScreenContainer>
    );
  }

  if (!member) {
    return (
      <ScreenContainer scroll={false}>
        <ScreenHeader title="Family Member" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[14px] text-muted">Family member not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .join('');
  const [gradStart, gradEnd] = getAvatarGradient(member.name);
  const faceEnrolled = member.ageBand !== '0-4';

  const menuButton = (
    <Pressable
      onPress={() => setMenuOpen(true)}
      accessibilityRole="button"
      accessibilityLabel="More options"
      style={{
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name="more" size={24} color={Colors.ink} />
    </Pressable>
  );

  return (
    <ScreenContainer>
      <ScreenHeader title={member.name} rightAction={menuButton} />

      {/* Options menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}>
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{
            position: 'absolute',
            top: 64,
            right: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingVertical: 4,
            minWidth: 180,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <Pressable
              onPress={() => { setMenuOpen(false); }}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.ink }}>Edit member</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
            <Pressable
              onPress={() => { setMenuOpen(false); router.push('/document/select-type'); }}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.ink }}>Manage documents</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
            <Pressable
              onPress={() => { setMenuOpen(false); router.back(); }}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#EF4444' }}>Remove member</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      <View className="items-center pt-3 pb-2">
        <LinearGradient
          colors={[gradStart, gradEnd]}
          style={{ alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 32 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#3730A3' }}>
            {initials}
          </Text>
        </LinearGradient>
        <Text style={{ marginTop: 12, fontSize: 24, fontWeight: '700', lineHeight: 29, color: Colors.primary }}>{member.name}</Text>
        <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '400', color: Colors.textMuted }}>
          {member.relationship} · Age {member.age}
        </Text>
        <View style={{
          marginTop: 10,
          height: 32,
          paddingHorizontal: 12,
          borderRadius: 8,
          backgroundColor: '#ECFDF5',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}>
          <Icon name="check" size={14} color="#059669" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#059669' }}>
            {faceEnrolled ? 'Fully Verified' : 'Document Only'}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 12, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.ink, marginBottom: 6 }}>
          Verification
        </Text>
      </View>

      <View style={{
        marginHorizontal: 16,
        height: 84,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        ...Elevation.small,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 32 }}>
          <Text style={{ fontSize: 15, fontWeight: '400', color: Colors.textMuted }}>Face enrollment</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {faceEnrolled ? <Icon name="check" size={14} color="#059669" /> : null}
            <Text style={{ fontSize: 15, fontWeight: '600', color: faceEnrolled ? '#059669' : '#F97316' }}>
              {faceEnrolled ? 'Complete' : 'Pending'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 32, marginTop: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '400', color: Colors.textMuted }}>Documents</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#059669' }}>1 verified</Text>
        </View>
      </View>

      <Text style={{
        marginTop: 16,
        marginHorizontal: 16,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        color: Colors.ink,
      }}>
        DOCUMENTS
      </Text>
      <View style={{
        marginTop: 12,
        marginHorizontal: 16,
        height: 72,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        ...Elevation.small,
      }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#EEF2FF',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon name="idCard" size={24} color={Colors.primary} />
        </View>
        <View style={{ flex: 1, maxWidth: 220 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.ink }} numberOfLines={1}>Identity Card</Text>
          <Text style={{ marginTop: 4, fontSize: 14, fontWeight: '400', color: Colors.textMuted }}>Verified · Expires Apr 2027</Text>
        </View>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: '#ECFDF5',
          paddingHorizontal: 10,
          height: 32,
          borderRadius: 8,
        }}>
          <Icon name="check" size={14} color="#059669" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#059669' }}>Verified</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/document/select-type')}
        accessibilityRole="button"
        accessibilityLabel="Add document"
        style={{
          marginTop: 12,
          marginHorizontal: 16,
          height: 52,
          borderRadius: 14,
          backgroundColor: '#EEF2FF',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
        <Icon name="plus" size={20} color={Colors.primary} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.primary }}>Add document</Text>
      </Pressable>

      <Text style={{
        marginTop: 16,
        marginHorizontal: 16,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        color: Colors.ink,
      }}>
        RECENT ACTIVITY
      </Text>
      {(activity ?? []).slice(0, 2).map((item) => (
        <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingHorizontal: 24, paddingVertical: 8 }}>
          <View style={{ marginTop: 5, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary }} />
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.ink }}>{item.title}</Text>
            <Text style={{ marginTop: 4, fontSize: 14, fontWeight: '400', color: Colors.textMuted }}>{item.date}</Text>
          </View>
        </View>
      ))}

      <Pressable
        onPress={() => {
          Alert.alert(
            'Remove family member?',
            `${member.name} will no longer be available in your family.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => router.back() },
            ],
          );
        }}
        accessibilityRole="button"
        accessibilityLabel="Remove family member"
        style={{
          marginTop: 8,
          marginHorizontal: 16,
          marginBottom: 12,
          height: 48,
          borderRadius: 12,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#FECACA',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Remove family member</Text>
      </Pressable>
    </ScreenContainer>
  );
}

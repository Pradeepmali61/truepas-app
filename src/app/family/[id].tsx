import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useDocuments } from '@/features/documents/hooks';
import { useFamilyMember, useRemoveFamilyMember } from '@/features/family/hooks';

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

/** Family member detail — matching Personal Info screen style. */
export default function FamilyMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member, isPending } = useFamilyMember(id);
  const removeMember = useRemoveFamilyMember();
  const [menuOpen, setMenuOpen] = useState(false);
  // The member's already scanned documents (GET /documents?personId=<id>)
  const { data: memberDocs, isPending: docsPending } = useDocuments(id);

  const handleRemove = () => {
    Alert.alert(
      'Remove family member?',
      `${member?.name ?? 'This member'} will no longer be available in your family.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember.mutateAsync(id);
            } catch {
              // proceed even if mock fails
            }
            router.back();
          },
        },
      ],
    );
  };

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="back" size={22} color={Colors.ink} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.ink, marginRight: 44 }}>
            Family Member
          </Text>
        </View>
        <View style={{ gap: 12, paddingHorizontal: 20, paddingTop: 20 }}>
          <Skeleton height={100} radius={16} />
          <Skeleton height={180} radius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="back" size={22} color={Colors.ink} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.ink, marginRight: 44 }}>
            Family Member
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: Colors.textMuted }}>Family member not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .join('');
  const faceEnrolled = member.ageBand !== '0-4';

  // Open the document scan flow scoped to this family member.
  const openMemberDocuments = () => {
    router.push({
      pathname: '/document/select-type',
      params: { family: '1', personId: id, memberName: member.name, band: member.ageBand },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={22} color={Colors.ink} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.ink }}>
          {member.name}
        </Text>
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="More options"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="settings" size={22} color={Colors.ink} />
        </Pressable>
      </View>

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
              onPress={() => { setMenuOpen(false); router.push('/face-update/pin' as never); }}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.ink }}>Update face</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
            <Pressable
              onPress={() => { setMenuOpen(false); openMemberDocuments(); }}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.ink }}>Manage documents</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
            <Pressable
              onPress={() => { setMenuOpen(false); handleRemove(); }}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#EF4444' }}>Remove member</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
          <View>
            <LinearGradient
              colors={['#08B6FC', '#84dbfe']}
              style={{ alignItems: 'center', justifyContent: 'center', width: 88, height: 88, borderRadius: 44 }}>
              <Text style={{ fontSize: 32, fontWeight: '700', color: '#FFFFFF' }}>
                {initials}
              </Text>
            </LinearGradient>
            <Pressable
              onPress={() => router.push('/face-update/pin' as never)}
              accessibilityRole="button"
              accessibilityLabel="Update face photo"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: Colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}>
              <Icon name="camera" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={{ marginTop: 12, fontSize: 20, fontWeight: '700', color: Colors.ink }}>{member.name}</Text>
          <Text style={{ marginTop: 2, fontSize: 14, fontWeight: '400', color: Colors.textMuted }}>
            {member.relationship} · Age {member.age}
          </Text>
          <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 }}>
            <Icon name="checkCircle" size={14} color="#059669" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#059669' }}>
              {faceEnrolled ? 'Fully Verified' : 'Document Only'}
            </Text>
          </View>
        </View>

        {/* Verification */}
        <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.ink, marginBottom: 4 }}>Verification</Text>
          <InfoField
            icon="scanFace"
            label="Face Enrollment"
            value={faceEnrolled ? 'Complete' : 'Pending'}
          />
          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginHorizontal: -16 }} />
          <InfoField
            icon="documents"
            label="Documents"
            value="1 verified"
          />
        </View>

        {/* Documents — the member's already scanned documents */}
        <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.ink, marginBottom: 4 }}>Documents</Text>
          {docsPending ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Skeleton height={48} radius={12} />
            </View>
          ) : (memberDocs?.length ?? 0) === 0 ? (
            <Text style={{ fontSize: 13, color: Colors.textMuted, paddingVertical: 12 }}>
              No documents scanned yet. Use "Add document" below to scan one.
            </Text>
          ) : (
            memberDocs!.map((doc, index) => (
              <Pressable
                key={doc.id}
                onPress={() => router.push({ pathname: '/document/[id]', params: { id: doc.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Open ${doc.label}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: '#F0FAFF',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={doc.type as never} size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.ink }}>{doc.label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '400', color: Colors.textMuted, marginTop: 2 }}>
                    {doc.status === 'verified' ? 'Verified' : doc.status === 'failed' ? 'Failed' : 'Pending'}
                    {doc.expiresAt ? ` · Expires ${new Date(doc.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </Text>
                </View>
                {doc.status === 'verified' ? (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: '#ECFDF5', paddingHorizontal: 10, height: 28, borderRadius: 8,
                  }}>
                    <Icon name="check" size={12} color="#059669" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#059669' }}>Verified</Text>
                  </View>
                ) : (
                  <Icon name="chevron" size={18} color={Colors.textMuted} />
                )}
                {index < (memberDocs?.length ?? 0) - 1 && (
                  <View style={{ position: 'absolute', left: 60, right: 0, bottom: 0, height: 1, backgroundColor: '#F1F5F9' }} />
                )}
              </Pressable>
            ))
          )}
        </View>

        {/* Add document */}
        <Pressable
          onPress={openMemberDocuments}
          accessibilityRole="button"
          accessibilityLabel="Add document"
          style={{
            marginTop: 16,
            marginHorizontal: 16,
            height: 48,
            borderRadius: 14,
            backgroundColor: '#F0FAFF',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
          <Icon name="plus" size={18} color={Colors.primary} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.primary }}>Add document</Text>
        </Pressable>

        {/* Remove member */}
        <Pressable
          onPress={handleRemove}
          accessibilityRole="button"
          accessibilityLabel="Remove family member"
          style={{
            marginTop: 12,
            marginHorizontal: 16,
            marginBottom: 12,
            height: 48,
            borderRadius: 14,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#FECACA',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Remove member</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

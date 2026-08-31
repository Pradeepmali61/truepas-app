import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Icon, Skeleton } from '@/components/ui';
import { Colors, Elevation, Gradients } from '@/constants/theme';
import { useBooking } from '@/features/history/hooks';

const BOOKING_IMAGES = {
  'hayat hotel': require('../../../assets/images/hayat-hotel1.png'),
  'theme park': require('../../../assets/images/theme-park2.png'),
  'disney cruise': require('../../../assets/images/cruise-2,.png'),
};

/** Check-in detail — completed booking summary. */
export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isPending } = useBooking(id);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [membersExpanded, setMembersExpanded] = useState(false);

  const verifiedDocs = [
    { icon: 'idCard' as const, label: 'Driving License' },
    { icon: 'passport' as const, label: 'Passport' },
  ];

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: '#F8FBFF' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }}>
        {Platform.OS === 'web' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundImage: 'linear-gradient(180deg, #39c5fd, #9ce2fe, #f5fcff)' } as any]} />
        ) : (
          <LinearGradient
            colors={['#39c5fd', '#9ce2fe', '#f5fcff']}
            style={{ flex: 1 }}
          />
        )}
      </View>
      <ScreenHeader title="Check-in details" light />

      {isPending ? (
        <View className="gap-4 px-6 pt-4">
          <Skeleton height={180} radius={20} />
          <Skeleton height={120} radius={20} />
        </View>
      ) : !booking ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[14px] text-muted">Booking not found.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {/* Check-in summary card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            overflow: 'hidden',
            marginTop: 16,
            borderWidth: 1,
            borderColor: '#F1F5F9',
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
          }}>
            {/* Hotel image */}
            {booking.image && BOOKING_IMAGES[booking.image] ? (
              <View style={{ width: '100%', aspectRatio: 2.2 }}>
                <Image
                  source={BOOKING_IMAGES[booking.image]}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <LinearGradient
                colors={Gradients.historyThumb}
                style={{
                  width: '100%',
                  aspectRatio: 2.2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name="hotel" size={48} color={Colors.primary} />
              </LinearGradient>
            )}

            {/* Summary content */}
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 21, fontWeight: '700', color: Colors.ink, marginBottom: 12 }}>
                {booking.venue} <Text style={{ fontWeight: '500', color: '#9CA3AF' }}>— Front Desk</Text>
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="location" size={18} color="#6B7280" />
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#374151' }}>{booking.location}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="calendar" size={18} color="#6B7280" />
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#374151' }}>
                  {booking.checkIn} → {booking.checkOut}
                </Text>
              </View>
            </View>
          </View>

          {/* Verification details card */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            paddingHorizontal: 20,
            paddingVertical: 4,
            marginTop: 24,
            ...Elevation.small,
          }}>
            {/* Success header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#ECFDF5',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="check" size={22} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.ink }}>
                  Check-in completed
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '400', color: '#9CA3AF', marginTop: 2 }}>
                  All required details are verified
                </Text>
              </View>
            </View>

            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: 1,
              paddingTop: 20,
              paddingBottom: 8,
            }}>
              Verification details
            </Text>

            <View style={{
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9',
            }}>
              <Pressable
                onPress={() => setDocsExpanded(!docsExpanded)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#374151' }}>Documents verified</Text>
                  <Text style={{ fontSize: 13, fontWeight: '400', color: '#9CA3AF', marginTop: 2 }}>
                    {verifiedDocs.length} of {verifiedDocs.length} documents verified
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexDirection: 'row', marginRight: 4 }}>
                    {verifiedDocs.slice(0, docsExpanded ? 0 : 2).map((doc, idx) => (
                      <View key={idx} style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: '#ECFDF5',
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 2, borderColor: '#059669',
                        marginLeft: idx === 0 ? 0 : -12,
                      }}>
                        <Icon name={doc.icon} size={20} color="#059669" />
                      </View>
                    ))}
                  </View>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: '#ECFDF5',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="check" size={14} color="#059669" />
                  </View>
                </View>
              </Pressable>
              {docsExpanded && (
                <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {verifiedDocs.map((doc, idx) => (
                    <View key={idx} style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor: '#F8FBFF', borderRadius: 24,
                      paddingHorizontal: 10, paddingVertical: 6,
                      borderWidth: 1, borderColor: '#F1F5F9',
                    }}>
                      <View style={{
                        width: 32, height: 32, borderRadius: 16,
                        backgroundColor: '#ECFDF5',
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1.5, borderColor: '#059669',
                      }}>
                        <Icon name={doc.icon} size={18} color="#059669" />
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', paddingRight: 4 }}>{doc.label}</Text>
                      <View style={{
                        width: 18, height: 18, borderRadius: 9,
                        backgroundColor: '#ECFDF5',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name="check" size={11} color="#059669" />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Checked-in family members */}
            <View style={{ paddingVertical: 16 }}>
              <Pressable
                onPress={() => setMembersExpanded(!membersExpanded)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#374151' }}>Family members checked in</Text>
                  <Text style={{ fontSize: 13, fontWeight: '400', color: '#9CA3AF', marginTop: 2 }}>
                    {(booking.checkedInMembers ?? []).length} members
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexDirection: 'row', marginRight: 4 }}>
                    {(booking.checkedInMembers ?? []).slice(0, membersExpanded ? 0 : 4).map((member, idx) => (
                      <View key={idx} style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: '#08B6FC',
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 3, borderColor: '#FFFFFF',
                        marginLeft: idx === 0 ? 0 : -12,
                      }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                          {member.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: '#ECFDF5',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="check" size={14} color="#059669" />
                  </View>
                </View>
              </Pressable>
              {membersExpanded && (
                <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(booking.checkedInMembers ?? []).map((member, idx) => (
                    <View key={idx} style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor: '#F8FBFF', borderRadius: 24,
                      paddingHorizontal: 10, paddingVertical: 6,
                      borderWidth: 1, borderColor: '#F1F5F9',
                    }}>
                      <View style={{
                        width: 32, height: 32, borderRadius: 16,
                        backgroundColor: '#08B6FC',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
                          {member.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', paddingRight: 4 }}>{member}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Bottom CTA */}
          <Pressable
            onPress={() => {}}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, marginTop: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#08B6FC' }}>View boarding details</Text>
            <Icon name="chevron" size={18} color="#08B6FC" />
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

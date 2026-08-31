import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Icon } from '@/components/ui/Icon';
import { STATUE_SVG } from '@/components/ui/StatueOfLibertySvg';
import type { DocumentType } from '@/types/domain';

const PERSON_SVG = `
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle
    cx="60"
    cy="28"
    r="21"
    fill="#F8D8C6"
    stroke="#000000"
    stroke-width="3"
  />
  <path
    d="M20 78
       C20 60 37 45 60 45
       C83 45 100 60 100 78
       C100 86 20 86 20 78Z"
    fill="#58B4F0"
    stroke="#000000"
    stroke-width="3"
    stroke-linejoin="round"
  />
</svg>
`;

const US_FLAG_SVG = `
<svg width="190" height="100" viewBox="0 0 190 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="190" height="100" fill="#FFFFFF"/>
  <g fill="#B22234">
    <rect y="0" width="190" height="7.7"/>
    <rect y="15.4" width="190" height="7.7"/>
    <rect y="30.8" width="190" height="7.7"/>
    <rect y="46.2" width="190" height="7.7"/>
    <rect y="61.5" width="190" height="7.7"/>
    <rect y="76.9" width="190" height="7.7"/>
    <rect y="92.3" width="190" height="7.7"/>
  </g>
  <rect width="76" height="53.8" fill="#3C3B6E"/>
  <g fill="#FFFFFF">
    <circle cx="9" cy="7" r="2.2"/><circle cx="22" cy="7" r="2.2"/><circle cx="35" cy="7" r="2.2"/><circle cx="48" cy="7" r="2.2"/><circle cx="61" cy="7" r="2.2"/>
    <circle cx="15.5" cy="13" r="2.2"/><circle cx="28.5" cy="13" r="2.2"/><circle cx="41.5" cy="13" r="2.2"/><circle cx="54.5" cy="13" r="2.2"/><circle cx="67.5" cy="13" r="2.2"/>
    <circle cx="9" cy="19" r="2.2"/><circle cx="22" cy="19" r="2.2"/><circle cx="35" cy="19" r="2.2"/><circle cx="48" cy="19" r="2.2"/><circle cx="61" cy="19" r="2.2"/>
    <circle cx="15.5" cy="25" r="2.2"/><circle cx="28.5" cy="25" r="2.2"/><circle cx="41.5" cy="25" r="2.2"/><circle cx="54.5" cy="25" r="2.2"/><circle cx="67.5" cy="25" r="2.2"/>
    <circle cx="9" cy="31" r="2.2"/><circle cx="22" cy="31" r="2.2"/><circle cx="35" cy="31" r="2.2"/><circle cx="48" cy="31" r="2.2"/><circle cx="61" cy="31" r="2.2"/>
    <circle cx="15.5" cy="37" r="2.2"/><circle cx="28.5" cy="37" r="2.2"/><circle cx="41.5" cy="37" r="2.2"/><circle cx="54.5" cy="37" r="2.2"/><circle cx="67.5" cy="37" r="2.2"/>
    <circle cx="9" cy="43" r="2.2"/><circle cx="22" cy="43" r="2.2"/><circle cx="35" cy="43" r="2.2"/><circle cx="48" cy="43" r="2.2"/><circle cx="61" cy="43" r="2.2"/>
    <circle cx="15.5" cy="49" r="2.2"/><circle cx="28.5" cy="49" r="2.2"/><circle cx="41.5" cy="49" r="2.2"/><circle cx="54.5" cy="49" r="2.2"/><circle cx="67.5" cy="49" r="2.2"/>
  </g>
</svg>
`;

export function DocIllustration({ type, minHeight = 130 }: { type: DocumentType; minHeight?: number }) {
  return (
    <View style={{
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 8,
      minHeight,
      ...(type === 'drivingLicense' ? {} : {}),
      ...(type === 'passport' ? { borderWidth: 1, borderColor: '#0B1B2A' } : {}),
      ...(type === 'greenCard' ? { borderWidth: 1, borderColor: '#1B7A43' } : {}),
      ...(type === 'usVisa' ? { borderWidth: 1, borderColor: '#1B3A5F' } : {}),
      ...(type === 'birthCertificate' ? { borderWidth: 1, borderColor: '#2C3E2E' } : {}),
    }}>
      {type === 'drivingLicense' ? (
        /* Driver's Licence — light gradient bg, blue header, photo + signature + watermark */
        <LinearGradient colors={['#F8FAF7', '#F0F5F0', '#E8F0E6']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
          {/* Watermark */}
          <Text style={{ position: 'absolute', top: 26, left: 0, right: 0, textAlign: 'center', fontSize: 22, fontWeight: '800', color: '#003366', opacity: 0.04, letterSpacing: 3, transform: [{ rotate: '-4deg' }] }}>DRIVER'S LICENCE</Text>

          {/* Header: blue strip with DRIVER'S LICENCE + gold bear */}
          <View style={{ height: 22, flexDirection: 'row', alignItems: 'center', backgroundColor: '#003366', paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#C9A84C' }}>
            <Text style={{ fontSize: 7, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>DRIVER'S LICENCE</Text>
            <View style={{ flex: 1 }} />
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#C9A84C', marginLeft: 4, borderWidth: 1, borderColor: '#FFFFFF' }} />
          </View>

          {/* Body: photo + fields */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4 }}>
            <View style={{ width: 44, height: 44, backgroundColor: '#FFFFFF', borderRadius: 2, borderWidth: 1, borderColor: '#D1D5DB', marginRight: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <SvgXml xml={PERSON_SVG} width={40} height={40} />
            </View>
            <View style={{ flex: 1, height: 44, justifyContent: 'center', gap: 3 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#666', width: 26 }}>Name</Text>
                <Text style={{ fontSize: 7, color: '#111', fontWeight: '700' }}>SAMPLE JANICE</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#666', width: 26 }}>DLN</Text>
                <Text style={{ fontSize: 7, color: '#C00000', fontWeight: '800' }}>I1234567</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#666', width: 26 }}>Expiry</Text>
                <Text style={{ fontSize: 7, color: '#C00000', fontWeight: '800' }}>11/26/2030</Text>
              </View>
            </View>
          </View>

        </LinearGradient>
      ) : type === 'passport' ? (
        /* Passport — light gold bg, black header strip with gold globe */
        <LinearGradient colors={['#FDF8E8', '#FAF3D0', '#F5EDB8']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
          {/* Watermark */}
          <Text style={{ position: 'absolute', top: 26, left: 0, right: 0, textAlign: 'center', fontSize: 22, fontWeight: '800', color: '#C9A84A', opacity: 0.04, letterSpacing: 3, transform: [{ rotate: '-4deg' }] }}>PASSPORT</Text>

          {/* Header: black strip with PASSPORT + gold globe */}
          <View style={{ height: 22, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1B2A', paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#C9A84A' }}>
            <Text style={{ fontSize: 7, fontWeight: '800', color: '#C9A84A', letterSpacing: 0.5 }}>PASSPORT</Text>
            <View style={{ flex: 1 }} />
            <Icon name="passport" size={12} color="#C9A84A" />
          </View>

          {/* Body: photo + fields */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4 }}>
            <View style={{ width: 44, height: 44, backgroundColor: '#FFFFFF', borderRadius: 2, borderWidth: 1, borderColor: '#D1D5DB', marginRight: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <SvgXml xml={PERSON_SVG} width={40} height={40} />
            </View>
            <View style={{ flex: 1, height: 44, justifyContent: 'center', gap: 3 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#8A8578', width: 26 }}>Name</Text>
                <Text style={{ fontSize: 7, color: '#111', fontWeight: '700' }}>PATEL AARAV</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#8A8578', width: 26 }}>Pass No</Text>
                <Text style={{ fontSize: 7, color: '#8A6D1A', fontWeight: '800' }}>K9234567</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#8A8578', width: 26 }}>Expiry</Text>
                <Text style={{ fontSize: 7, color: '#8A6D1A', fontWeight: '800' }}>01/15/2032</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      ) : type === 'greenCard' ? (
        /* Green Card — green header, statue watermark, photo + fields + fingerprint */
        <View style={{ flex: 1, backgroundColor: '#D8E8C8' }}>
          {/* Statue of Liberty watermark */}
          <View style={{ position: 'absolute', right: -14, top: 20, bottom: 0, width: 90, opacity: 0.18 }}>
            <SvgXml xml={STATUE_SVG} width={90} height={120} preserveAspectRatio="xMidYMid slice" />
          </View>

          {/* Header strip: eagle + USA + PERMANENT RESIDENT */}
          <View style={{ height: 22, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B7A43', paddingHorizontal: 6 }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#C9A84C', marginRight: 5 }} />
            <Text style={{ fontSize: 5.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 }}>UNITED STATES OF AMERICA</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontSize: 5, fontWeight: '700', color: '#C9A84C' }}>PERMANENT RESIDENT</Text>
          </View>

          {/* Body: photo + field labels + fingerprint */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 }}>
            <View style={{ width: 46, height: 58, backgroundColor: '#C4D8B0', borderWidth: 1, borderColor: '#9AB884', marginRight: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <SvgXml xml={PERSON_SVG} width={42} height={42} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center', gap: 5 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#8A9A7A', width: 40 }}>Surname</Text>
                <Text style={{ fontSize: 7, color: '#2D3D1E', fontWeight: '800' }}>PATEL</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#8A9A7A', width: 40 }}>Given Name</Text>
                <Text style={{ fontSize: 7, color: '#2D3D1E', fontWeight: '800' }}>AARAV KUMAR</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#8A9A7A', width: 40 }}>USCIS#</Text>
                <Text style={{ fontSize: 7, color: '#1B7A43', fontWeight: '800' }}>SRC1992034567</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#8A9A7A', width: 40 }}>Card Expires</Text>
                <Text style={{ fontSize: 7, color: '#1B7A43', fontWeight: '800' }}>08/25/2030</Text>
              </View>
            </View>
          </View>

          {/* Fingerprint bottom right */}
          <View style={{ position: 'absolute', right: 8, bottom: 6, width: 22, height: 30, backgroundColor: '#EAF2DF', borderWidth: 1, borderColor: '#9AB884', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
            <View style={{ width: 14, height: 22, borderRadius: 7, borderWidth: 1, borderColor: '#7A9A64' }} />
            <View style={{ position: 'absolute', width: 9, height: 15, borderRadius: 5, borderWidth: 1, borderColor: '#7A9A64' }} />
            <View style={{ position: 'absolute', width: 4, height: 8, borderRadius: 2, borderWidth: 1, borderColor: '#7A9A64' }} />
          </View>
        </View>
      ) : type === 'birthCertificate' ? (
        /* Birth Certificate — cream bg, ornate dark border, gothic title */
        <View style={{ flex: 1, backgroundColor: '#FBF8EF' }}>
          {/* Ornate border */}
          <View style={{ position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, borderRadius: 6, borderWidth: 3, borderColor: '#2C3E2E' }} />
          <View style={{ position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, borderRadius: 4, borderWidth: 1, borderColor: '#2C3E2E' }} />
          {/* Corner decorations */}
          <View style={{ position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#2C3E2E' }} />
          <View style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#2C3E2E' }} />
          <View style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#2C3E2E' }} />
          <View style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#2C3E2E' }} />

          {/* Content */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }}>
            <Text style={{ fontSize: 5, fontWeight: '700', color: '#1B365D', letterSpacing: 0.5, marginBottom: 1 }}>BIRTH CERTIFICATE</Text>
            <Text style={{ fontSize: 4, color: '#1B365D', letterSpacing: 0.3, marginBottom: 3 }}>DEPARTMENT OF COMMERCE</Text>
            <Text style={{ fontSize: 7, fontWeight: '800', color: '#1B365D', letterSpacing: 0.5, marginBottom: 4 }}>Notification of Birth Registration</Text>

            <View style={{ width: '75%', gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ fontSize: 4, color: '#333', width: 24 }}>Name</Text>
                <Text style={{ fontSize: 4, color: '#1B365D', fontWeight: '600' }}>AARAV KUMAR PATEL</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ fontSize: 4, color: '#333', width: 24 }}>Date of Birth</Text>
                <Text style={{ fontSize: 4, color: '#1B365D', fontWeight: '600' }}>March 15, 1995</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ fontSize: 4, color: '#333', width: 24 }}>Place of Birth</Text>
                <Text style={{ fontSize: 4, color: '#1B365D', fontWeight: '600' }}>San Francisco, CA</Text>
              </View>
            </View>
          </View>
        </View>
      ) : type === 'usVisa' ? (
        /* US Visa — realistic visa-style card with blue/red header strips */
        <View style={{ flex: 1, backgroundColor: '#F2EFE8' }}>
          {/* US flag watermark */}
          <View style={{ position: 'absolute', right: -20, top: 24, opacity: 0.12, transform: [{ rotate: '8deg' }] }}>
            <SvgXml xml={US_FLAG_SVG} width={120} height={64} />
          </View>

          {/* Header strip: blue VISA + red UNITED STATES OF AMERICA */}
          <View style={{ height: 20, flexDirection: 'row' }}>
            <View style={{ flex: 0.42, backgroundColor: '#1B3A5F', justifyContent: 'center', paddingLeft: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>VISA</Text>
            </View>
            <View style={{ flex: 0.58, backgroundColor: '#B91C1C', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 5, fontWeight: '700', letterSpacing: 0.4, textAlign: 'center' }}>UNITED STATES OF AMERICA</Text>
            </View>
          </View>

          {/* Body: photo silhouette + fields */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4 }}>
            {/* Photo */}
            <View style={{ width: 44, height: 44, backgroundColor: '#D8D5CE', marginRight: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <SvgXml xml={PERSON_SVG} width={40} height={40} />
            </View>

            {/* Fields */}
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#8A8578', width: 40 }}>Surname</Text>
                <Text style={{ fontSize: 7, color: '#111', fontWeight: '800' }}>SHARMA</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#8A8578', width: 40 }}>Given Name</Text>
                <Text style={{ fontSize: 7, color: '#111', fontWeight: '800' }}>PRIYA RANJAN</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{ fontSize: 6, color: '#8A8578', width: 40 }}>Passport No</Text>
                <Text style={{ fontSize: 7, color: '#1B3A5F', fontWeight: '800' }}>M1234567</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Text style={{ fontSize: 6, color: '#8A8578', width: 40 }}>Visa Type</Text>
                <Text style={{ fontSize: 7, color: '#1B3A5F', fontWeight: '800' }}>B1/B2</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ fontSize: 7, color: '#C00000', fontWeight: '800' }}>2024 00001234</Text>
              </View>
            </View>
          </View>

          {/* MRZ strip */}
          <View style={{ height: 14, backgroundColor: '#E8E4DA', borderTopWidth: 1, borderTopColor: '#C9C4B8', justifyContent: 'center', paddingHorizontal: 6 }}>
            <Text style={{ fontSize: 6, color: '#555', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }} numberOfLines={1}>{'<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'}</Text>
            <Text style={{ fontSize: 6, color: '#555', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }} numberOfLines={1}>{'000000000000000000000000000000000'}</Text>
          </View>
        </View>
      ) : (
        /* ID Card — light indigo bg, gold header, photo + fields */
        <View style={{ flex: 1, backgroundColor: '#F0F4FF' }}>
          {/* Header */}
          <View style={{ height: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
            <Text style={{ fontSize: 7, fontWeight: '800', color: '#C9A84C', letterSpacing: 0.5 }}>IDENTIFICATION CARD</Text>
          </View>

          {/* Body: photo + field labels */}
          <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 4 }}>
            <View style={{ width: 30, height: 38, backgroundColor: '#D1D5DB', borderRadius: 2, marginRight: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#9CA3AF' }} />
              <View style={{ width: 24, height: 16, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: '#9CA3AF', marginTop: -3 }} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text style={{ fontSize: 4, color: '#666', width: 20 }}>Name</Text>
                <Text style={{ fontSize: 4, color: '#333' }}>JOHN DOE</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text style={{ fontSize: 4, color: '#666', width: 20 }}>ID No</Text>
                <Text style={{ fontSize: 4, color: '#333' }}>ID123456789</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text style={{ fontSize: 4, color: '#666', width: 20 }}>DOB</Text>
                <Text style={{ fontSize: 4, color: '#333' }}>01/01/1990</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text style={{ fontSize: 4, color: '#666', width: 20 }}>EXP</Text>
                <Text style={{ fontSize: 4, color: '#333' }}>01/01/2030</Text>
              </View>
            </View>
          </View>

          {/* Bottom strip */}
          <View style={{ height: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 4, color: '#C9A84C', fontWeight: '700', letterSpacing: 0.5 }}>ID123456789</Text>
          </View>
        </View>
      )}
    </View>
  );
}

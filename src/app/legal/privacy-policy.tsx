import { LegalDocument } from '@/features/legal/components/LegalDocument';

const SECTIONS = [
  {
    heading: '1. Information We Collect',
    body: "We collect biometric data (facial templates), government ID information (Passport, Driver's License, Identity Card), and account metadata to provide secure identity verification services.",
  },
  {
    heading: '2. Biometric Data Handling',
    body: 'Your facial template is encrypted and stored in ROC (Rank One Computing) gallery. It is never shared with third parties and is used solely for identity matching during verification.',
  },
  {
    heading: '3. Minor/Guardianship Consent',
    body: 'For family members under 18, a parent or legal guardian must provide explicit consent before biometric enrollment. Children aged 0-4 require document upload only — no face enrollment. Ages 5-17 require document, selfie, and face enrollment.',
  },
  {
    heading: '4. Data Retention',
    body: 'All data — PostgreSQL records, S3 images, and ROC face templates — is retained while your account is active and permanently deleted upon account deletion. Deletion is verified across all three systems.',
  },
  {
    heading: '5. Your Rights',
    body: 'You have the right to download your data, withdraw biometric consent, and delete your account at any time. Account deletion removes all data across PostgreSQL, S3, and ROC.',
  },
];

export default function PrivacyPolicyScreen() {
  return <LegalDocument title="Privacy Policy" updated="Last updated: July 2026" sections={SECTIONS} />;
}

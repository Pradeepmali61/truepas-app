import { LegalDocument } from '@/features/legal/components/LegalDocument';

const SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    body: 'By using Truepas, you agree to these Terms of Service and our Privacy Policy. Truepas is an identity verification platform that uses biometric data and government documents to verify your identity.',
  },
  {
    heading: '2. Mandatory Face Enrollment',
    body: 'Face enrollment is a mandatory step in the registration process. You cannot proceed to document verification or use Truepas services without completing face enrollment.',
  },
  {
    heading: '3. Account Responsibilities',
    body: 'You are responsible for maintaining the confidentiality of your PIN and account credentials. Face updates require PIN verification.',
  },
  {
    heading: '4. Family Member Onboarding',
    body: 'You may add family members under 18 as dependents. Adults 18 and older must create their own independent Truepas account. Guardianship consent is required for all minor enrollments.',
  },
  {
    heading: '5. Prohibited Uses',
    body: 'You may not use Truepas for fraudulent identity verification, unauthorized access, or sharing of biometric data with unauthorized parties.',
  },
];

export default function TermsScreen() {
  return <LegalDocument title="Terms of Service" updated="Effective: July 2026" sections={SECTIONS} />;
}

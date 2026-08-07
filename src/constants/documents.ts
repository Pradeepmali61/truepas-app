export interface IssuedDoc {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
  icon: 'drivingLicense' | 'passport';
  number: string;
  status: 'Active' | 'Expired';
}

export const ISSUED_DOCS: IssuedDoc[] = [
  {
    id: 'i1',
    name: 'Driving License',
    issuer: 'Ministry of Road Transport and Highways',
    issuedAt: 'Thu, 19 Jan 2022 14:27 GMT',
    icon: 'drivingLicense',
    number: 'DL•••••9034',
    status: 'Active',
  },
  {
    id: 'i2',
    name: 'Passport',
    issuer: 'Ministry of External Affairs',
    issuedAt: 'Thu, 19 Jan 2022 15:12 GMT',
    icon: 'passport',
    number: 'P•••••4821',
    status: 'Active',
  },
];

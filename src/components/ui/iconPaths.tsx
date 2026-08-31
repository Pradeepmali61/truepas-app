import React from 'react';
import { Circle, Path, Rect } from 'react-native-svg';

type IconRenderer = (color: string) => React.ReactNode;

const P = (d: string, color: string, sw = 2) => (
  <Path d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
);

export const identity: IconRenderer = (c) => (
  <>
    {P("M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", c)}
    {P("M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", c)}
  </>
);

export const documents: IconRenderer = (c) => (
  <>
    {P("M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z", c)}
    {P("M14 2v5a1 1 0 0 0 1 1h5", c)}
    {P("M10 9H8", c)}
    {P("M16 13H8", c)}
    {P("M16 17H8", c)}
  </>
);

export const family: IconRenderer = (c) => (
  <>
    {P("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", c)}
    {P("M16 3.128a4 4 0 0 1 0 7.744", c)}
    {P("M22 21v-2a4 4 0 0 0-3-3.87", c)}
    <Circle cx="9" cy="7" r="4" stroke={c} strokeWidth={2} fill="none" />
  </>
);

export const history: IconRenderer = (c) => (
  <>
    {P("M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", c)}
    {P("M3 3v5h5", c)}
    {P("M12 7v5l4 2", c)}
  </>
);

export const drivingLicense: IconRenderer = (c) => (
  <>
    {P("M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2", c)}
    <Circle cx="7" cy="17" r="2" stroke={c} strokeWidth={2} fill="none" />
    {P("M9 17h6", c)}
    <Circle cx="17" cy="17" r="2" stroke={c} strokeWidth={2} fill="none" />
  </>
);

export const passport: IconRenderer = (c) => (
  <>
    <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={2} fill="none" />
    {P("M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", c)}
    {P("M2 12h20", c)}
  </>
);

export const back: IconRenderer = (c) => P("M15 18L9 12L15 6", c);

export const bell: IconRenderer = (c) => (
  <>
    <Path d="M6 9C6 6 8 4 12 4C16 4 18 6 18 9V14L20 17H4L6 14V9Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    {P("M10 17C10 18 11 19 12 19C13 19 14 18 14 17", c)}
  </>
);

export const settings: IconRenderer = (c) => (
  <>
    {P("M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915", c)}
    <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={2} fill="none" />
  </>
);

export const camera: IconRenderer = (c) => (
  <>
    <Rect x="3" y="7" width="18" height="13" rx="2" stroke={c} strokeWidth={2} />
    <Path d="M8 7L9 4H15L16 7" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="3" stroke={c} strokeWidth={2} />
  </>
);

export const face: IconRenderer = (c) => (
  <>
    <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={2} />
    <Path d="M9 10V10.01M15 10V10.01" stroke={c} strokeWidth={2.5} strokeLinecap="round" />
    {P("M8 14C9 16 10.5 17 12 17C13.5 17 15 16 16 14", c)}
  </>
);

export const shield: IconRenderer = (c) => (
  <>
    <Path d="M12 3L4 6V12C4 16 7 20 12 21C17 20 20 16 20 12V6L12 3Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    {P("M9 12L11 14L15 10", c)}
  </>
);

export const lock: IconRenderer = (c) => (
  <>
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={c} strokeWidth={2} />
    <Path d="M8 11V7C8 5 10 3 12 3C14 3 16 5 16 7V11" stroke={c} strokeWidth={2} strokeLinecap="round" />
  </>
);

export const check: IconRenderer = (c) => (
  <Path d="M5 12L10 17L19 7" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
);

export const checkCircle: IconRenderer = (c) => (
  <>
    <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={2} />
    <Path d="M8 12L11 15L16 9" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

export const cross: IconRenderer = (c) => (
  <Path d="M6 6L18 18M18 6L6 18" stroke={c} strokeWidth={2} strokeLinecap="round" />
);

export const warning: IconRenderer = (c) => (
  <>
    {P("m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3", c)}
    {P("M12 9v4", c)}
    {P("M12 17h.01", c)}
  </>
);

export const info: IconRenderer = (c) => (
  <>
    <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={2} />
    <Path d="M12 8V8.01" stroke={c} strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 11V16" stroke={c} strokeWidth={2} strokeLinecap="round" />
  </>
);

export const calendar: IconRenderer = (c) => (
  <>
    {P("M8 2v3", c)}
    {P("M16 2v3", c)}
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={c} strokeWidth={2} />
    {P("M3 9h18", c)}
  </>
);

export const cake: IconRenderer = (c) => (
  <>
    {P("M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8", c)}
    {P("M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1", c)}
    {P("M2 21h20", c)}
    {P("M7 8v3", c)}
    {P("M12 8v3", c)}
    {P("M17 8v3", c)}
    {P("M7 4h.01", c)}
    {P("M12 4h.01", c)}
    {P("M17 4h.01", c)}
  </>
);

export const trash: IconRenderer = (c) => (
  <>
    {P("M4 7H20", c)}
    <Path d="M9 7V4H15V7" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M6 7L7 20C7 21 8 21 8 21H16C16 21 17 21 17 20L18 7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    {P("M10 11V17", c, 1.5)}{P("M14 11V17", c, 1.5)}
  </>
);

export const clock: IconRenderer = (c) => (
  <>
    <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={2} />
    {P("M12 7V12L15 14", c)}
  </>
);

export const search: IconRenderer = (c) => (
  <>
    <Circle cx="11" cy="11" r="7" stroke={c} strokeWidth={2} />
    {P("M16 16L21 21", c)}
  </>
);

export const plus: IconRenderer = (c) => (
  <Path d="M12 5V19M5 12H19" stroke={c} strokeWidth={2} strokeLinecap="round" />
);

export const chevron: IconRenderer = (c) => P("M9 6L15 12L9 18", c);

export const document: IconRenderer = (c) => (
  <>
    <Path d="M14 3H6C5 3 4 4 4 5V19C4 20 5 21 6 21H18C19 21 20 20 20 19V9L14 3Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M14 3V9H20" stroke={c} strokeWidth={2} strokeLinejoin="round" />
  </>
);

export const idCard: IconRenderer = (c) => (
  <>
    <Rect x="3" y="6" width="18" height="12" rx="2" stroke={c} strokeWidth={2} />
    <Circle cx="9" cy="11" r="2" stroke={c} strokeWidth={2} />
    {P("M14 10H18", c)}{P("M14 13H18", c)}
    <Path d="M6 15C6 14 7 13 9 13C11 13 12 14 12 15" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
  </>
);

export const greenCard: IconRenderer = (c) => (
  <>
    <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={2} fill="none" />
    {P("M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8", c)}
    {P("M12 18V6", c)}
  </>
);

export const birthCertificate: IconRenderer = (c) => (
  <>
    {P("M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5", c)}
    {P("M15 12h.01", c)}
    {P("M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1", c)}
    {P("M9 12h.01", c)}
  </>
);

export const usVisa: IconRenderer = (c) => (
  <>
    {P("M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z", c)}
  </>
);

export const selfie: IconRenderer = (c) => (
  <>
    <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={2} />
    <Path d="M9 10V10.01M15 10V10.01" stroke={c} strokeWidth={2.5} strokeLinecap="round" />
    {P("M8 14C9 16 10.5 17 12 17C13.5 17 15 16 16 14", c)}
    <Path d="M12 3V5M12 19V21" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
  </>
);

export const smartphone: IconRenderer = (c) => (
  <>
    <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke={c} strokeWidth={2} />
    <Path d="M12 18h.01" stroke={c} strokeWidth={2} strokeLinecap="round" />
  </>
);

export const user: IconRenderer = (c) => (
  <>
    <Circle cx="12" cy="7" r="4" stroke={c} strokeWidth={2} fill="none" />
    <Path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </>
);

export const more: IconRenderer = (c) => (
  <>
    <Circle cx="12" cy="12" r="1" fill={c} />
    <Circle cx="12" cy="5" r="1" fill={c} />
    <Circle cx="12" cy="19" r="1" fill={c} />
  </>
);

export const email: IconRenderer = (c) => (
  <>
    <Rect x="3" y="5" width="18" height="14" rx="2" stroke={c} strokeWidth={2} />
    <Path d="M3 7L12 13L21 7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

export const eye: IconRenderer = (c) => (
  <>
    <Path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={2} />
  </>
);

export const eyeClosed: IconRenderer = (c) => (
  <>
    {P("m15 18-.722-3.25", c)}
    {P("M2 8a10.645 10.645 0 0 0 20 0", c)}
    {P("m20 15-1.726-2.05", c)}
    {P("m4 15 1.726-2.05", c)}
    {P("m9 18 .722-3.25", c)}
  </>
);

export const edit: IconRenderer = (c) => (
  <>
    <Path d="M16 3L21 8L8 21H3V16L16 3Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    {P("M14 5L19 10", c)}
  </>
);

export const logout: IconRenderer = (c) => (
  <>
    <Path d="M14 4H6C5 4 4 5 4 6V18C4 19 5 20 6 20H14" stroke={c} strokeWidth={2} strokeLinecap="round" />
    <Path d="M10 12H21M21 12L17 8M21 12L17 16" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

export const hotel: IconRenderer = (c) => (
  <>
    <Path d="M3 21V8L12 3L21 8V21" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    {P("M3 21H21", c)}
    <Rect x="8" y="12" width="3" height="3" stroke={c} strokeWidth={1.5} />
    <Rect x="13" y="12" width="3" height="3" stroke={c} strokeWidth={1.5} />
    <Path d="M10 21V18H14V21" stroke={c} strokeWidth={1.5} strokeLinejoin="round" />
  </>
);

export const invoice: IconRenderer = (c) => (
  <>
    <Path d="M5 3H19V21L17 20L15 21L13 20L11 21L9 20L7 21L5 20V3Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M8 8H16M8 12H16M8 16H13" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
  </>
);

export const qr: IconRenderer = (c) => (
  <>
    <Rect x="3" y="3" width="7" height="7" stroke={c} strokeWidth={2} />
    <Rect x="14" y="3" width="7" height="7" stroke={c} strokeWidth={2} />
    <Rect x="3" y="14" width="7" height="7" stroke={c} strokeWidth={2} />
    <Path d="M14 14H17V17M17 17V21M17 17H21M14 18V21M19 19V21" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
  </>
);

export const sparkle: IconRenderer = (c) => (
  <>
    <Path d="M12 3L13.5 9L19 10.5L13.5 12L12 18L10.5 12L5 10.5L10.5 9L12 3Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M19 16L19.5 18L21 18.5L19.5 19L19 21L18.5 19L17 18.5L18.5 18L19 16Z" stroke={c} strokeWidth={1} strokeLinejoin="round" />
  </>
);

export const hourglass: IconRenderer = (c) => (
  <>
    {P("M6 3H18", c)}{P("M6 21H18", c)}
    <Path d="M7 3C7 8 12 10 12 12C12 14 7 16 7 21" stroke={c} strokeWidth={2} strokeLinecap="round" />
    <Path d="M17 3C17 8 12 10 12 12C12 14 17 16 17 21" stroke={c} strokeWidth={2} strokeLinecap="round" />
  </>
);

export const location: IconRenderer = (c) => (
  <>
    <Path d="M12 21C12 21 19 14 19 9C19 5 16 2 12 2C8 2 5 5 5 9C5 14 12 21 12 21Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    <Circle cx="12" cy="9" r="2.5" stroke={c} strokeWidth={2} />
  </>
);

export const otpcode: IconRenderer = (c) => (
  <>
    <Rect x="7" y="2" width="10" height="20" rx="2" stroke={c} strokeWidth={2} />
    {P("M11 6H13", c)}
    <Circle cx="12" cy="12" r="2" stroke={c} strokeWidth={2} />
    {P("M11 18H13", c)}
  </>
);

export const inbox: IconRenderer = (c) => (
  <>
    {P("m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", c)}
    <Rect x="2" y="4" width="20" height="16" rx="2" stroke={c} strokeWidth={2} />
  </>
);

export const scanFace: IconRenderer = (c) => (
  <>
    {P("M3 7V5a2 2 0 0 1 2-2h2", c)}
    {P("M17 3h2a2 2 0 0 1 2 2v2", c)}
    {P("M21 17v2a2 2 0 0 1-2 2h-2", c)}
    {P("M7 21H5a2 2 0 0 1-2-2v-2", c)}
    {P("M8 14s1.5 2 4 2 4-2 4-2", c)}
    {P("M9 9h.01", c)}
    {P("M15 9h.01", c)}
  </>
);

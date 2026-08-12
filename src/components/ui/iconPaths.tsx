import React from 'react';
import { Circle, Path, Rect } from 'react-native-svg';

type IconRenderer = (color: string) => React.ReactNode;

const P = (d: string, color: string, sw = 2) => (
  <Path d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
);

export const identity: IconRenderer = (c) => (
  <>
    <Rect x="3" y="5" width="18" height="14" rx="2" stroke={c} strokeWidth={2} />
    <Circle cx="9" cy="11" r="2" stroke={c} strokeWidth={2} />
    {P("M14 10H18", c)}{P("M14 13H18", c)}{P("M7 16C7 14.5 8 13.5 9 13.5C10 13.5 11 14.5 11 16", c, 1.5)}
  </>
);

export const documents: IconRenderer = (c) => (
  <>
    <Path d="M14 3H6C5 3 4 4 4 5V19C4 20 5 21 6 21H18C19 21 20 20 20 19V9L14 3Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M14 3V9H20" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    {P("M8 13H16", c)}{P("M8 17H16", c)}
  </>
);

export const family: IconRenderer = (c) => (
  <>
    <Circle cx="8" cy="8" r="3" stroke={c} strokeWidth={2} />
    <Circle cx="16" cy="8" r="3" stroke={c} strokeWidth={2} />
    <Path d="M3 20C3 16.5 5 14 8 14C11 14 13 16.5 13 20" stroke={c} strokeWidth={2} strokeLinecap="round" />
    <Path d="M11 20C11 16.5 13 14 16 14C19 14 21 16.5 21 20" stroke={c} strokeWidth={2} strokeLinecap="round" />
  </>
);

export const history: IconRenderer = (c) => (
  <>
    <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={2} />
    {P("M12 7V12L15 14", c)}
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
    <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={2} />
    <Path d="M12 2V5M12 19V22M2 12H5M19 12H22M5 5L7 7M17 17L19 19M5 19L7 17M17 7L19 5" stroke={c} strokeWidth={2} strokeLinecap="round" />
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
    <Path d="M12 3L2 20H22L12 3Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    {P("M12 10V14", c)}{P("M12 17V17.01", c)}
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
    <Rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth={2} />
    <Path d="M3 9H21" stroke={c} strokeWidth={2} />
    <Path d="M8 3V7M16 3V7" stroke={c} strokeWidth={2} strokeLinecap="round" />
  </>
);

export const cake: IconRenderer = (c) => (
  <>
    <Path d="M4 21V12C4 11 5 10 6 10H18C19 10 20 11 20 12V21" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M2 21H22" stroke={c} strokeWidth={2} strokeLinecap="round" />
    {P("M12 10V6", c)}{P("M10 6C10 5 11 4 12 4C13 4 14 5 14 6", c, 1.5)}
    <Path d="M4 16C6 15 8 15 12 16C16 17 18 15 20 16" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
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

export const passport: IconRenderer = (c) => (
  <>
    <Rect x="5" y="2" width="14" height="20" rx="2" stroke={c} strokeWidth={2} />
    <Circle cx="12" cy="10" r="3" stroke={c} strokeWidth={2} />
    {P("M9 17H15", c)}
  </>
);

export const drivingLicense: IconRenderer = (c) => (
  <>
    <Rect x="3" y="6" width="18" height="12" rx="2" stroke={c} strokeWidth={2} />
    <Circle cx="8" cy="11" r="2" stroke={c} strokeWidth={2} />
    <Path d="M13 10H18M13 13H18M5 15C5 14 6 13 8 13C10 13 11 14 11 15" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
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
    <Rect x="3" y="6" width="18" height="12" rx="2" stroke={c} strokeWidth={2} />
    <Circle cx="9" cy="11" r="2" stroke={c} strokeWidth={2} />
    {P("M14 10H18", c)}{P("M14 13H18", c)}
    <Path d="M12 8L12.6 9.8H14.4L12.9 10.8L13.5 12.6L12 11.6L10.5 12.6L11.1 10.8L9.6 9.8H11.4L12 8Z" stroke={c} strokeWidth={1.2} strokeLinejoin="round" />
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

export const phone: IconRenderer = (c) => (
  <>
    <Rect x="7" y="2" width="10" height="20" rx="2" stroke={c} strokeWidth={2} />
    {P("M11 6H13", c)}{P("M11 18H13", c)}
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
    <Path d="M3 12L5 4H19L21 12V20H3V12Z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M3 12H8L9 14H15L16 12H21" stroke={c} strokeWidth={2} strokeLinejoin="round" />
  </>
);

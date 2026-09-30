/** @jsxImportSource react */
/**
 * UseCaseCarousel — Home-tab hero that shows what Truepas is for: hotels,
 * theme parks, cruises, attractions and family check-ins. Each slide is a
 * vector scene (react-native-svg) tinted from the active palette's
 * actionPrimary, so the art stays on-brand and crisp at every density.
 *
 * Auto-advances every few seconds; a manual swipe restarts the timer.
 */
import {
  FerrisWheel,
  Hotel,
  Landmark,
  Ship,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { alpha, makeStyles, mix, useThemeTokens } from "@/theme";

/** Scene canvas — every illustration is drawn in this box. */
const VW = 360;
const VH = 210;
const AUTOPLAY_MS = 5000;

const WARM = "#ffd27a";
const PINK = "#ff8fcf";
const GO = "#4ade80";

type Tones = {
  night: string;
  deep: string;
  mid: string;
  soft: string;
  pale: string;
};

function useTones(): Tones {
  const t = useThemeTokens();
  const p = t.colors.actionPrimary;
  return useMemo(
    () => ({
      night: mix(p, "#07041a", 0.28),
      deep: mix(p, "#110838", 0.55),
      mid: p,
      soft: mix(p, "#ffffff", 0.5),
      pale: mix(p, "#ffffff", 0.16),
    }),
    [p],
  );
}

/* ------------------------------------------------------------------ */
/* Shared scene pieces                                                 */
/* ------------------------------------------------------------------ */

function Sky({ id, top, bottom }: { id: string; top: string; bottom: string }) {
  return (
    <>
      <Defs>
        <LinearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect width={VW} height={VH} fill={`url(#${id}-sky)`} />
    </>
  );
}

function Glow({
  id,
  cx,
  cy,
  r,
  color,
  o = 0.55,
}: {
  id: string;
  cx: number;
  cy: number;
  r: number;
  color: string;
  o?: number;
}) {
  return (
    <>
      <Defs>
        <RadialGradient
          id={id}
          cx={cx}
          cy={cy}
          r={r}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={color} stopOpacity={o} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
    </>
  );
}

const STARS: [number, number, number][] = [
  [196, 18, 1.1],
  [228, 30, 0.8],
  [252, 12, 1.2],
  [286, 24, 0.7],
  [344, 16, 1],
  [214, 58, 0.7],
  [338, 60, 0.8],
  [178, 40, 0.9],
  [270, 46, 0.6],
  [306, 8, 0.8],
];

function Stars({ color, only }: { color: string; only?: number }) {
  return (
    <G>
      {STARS.slice(0, only).map(([x, y, r], i) => (
        <Circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={color}
          opacity={0.55 + (i % 3) * 0.15}
        />
      ))}
    </G>
  );
}

/** Left-side scrim so the caption stays legible over any scene. */
function Scrim({ id, color }: { id: string; color: string }) {
  return (
    <>
      <Defs>
        <LinearGradient id={`${id}-scrim`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={0.82} />
          <Stop offset="0.5" stopColor={color} stopOpacity={0.35} />
          <Stop offset="0.72" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width={VW} height={VH} fill={`url(#${id}-scrim)`} />
    </>
  );
}

/** Glass viewfinder with a face and a green "verified" tick — the product, in one glyph. */
function FaceBadge({
  x,
  y,
  s,
  ring,
}: {
  x: number;
  y: number;
  s: number;
  ring: string;
}) {
  const m = s * 0.16;
  const k = s * 0.2;
  return (
    <G transform={`translate(${x} ${y})`}>
      <Rect
        width={s}
        height={s}
        rx={s * 0.26}
        fill="#ffffff"
        fillOpacity={0.14}
        stroke="#ffffff"
        strokeOpacity={0.5}
        strokeWidth={1}
      />
      <Path
        d={`M${m} ${m + k}V${m}H${m + k}M${s - m - k} ${m}H${s - m}V${m + k}M${s - m} ${s - m - k}V${s - m}H${s - m - k}M${m + k} ${s - m}H${m}V${s - m - k}`}
        stroke="#ffffff"
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={s / 2} cy={s * 0.42} r={s * 0.12} fill="#ffffff" />
      <Path
        d={`M${s * 0.3} ${s * 0.76}C${s * 0.3} ${s * 0.6} ${s * 0.7} ${s * 0.6} ${s * 0.7} ${s * 0.76}Z`}
        fill="#ffffff"
      />
      <Rect
        x={m}
        y={s * 0.53}
        width={s - m * 2}
        height={1.2}
        fill={GO}
        opacity={0.9}
      />
      <Circle
        cx={s - 2}
        cy={2}
        r={s * 0.17}
        fill={GO}
        stroke={ring}
        strokeWidth={2}
      />
      <Path
        d={`M${s - 2 - s * 0.075} 2l${s * 0.05} ${s * 0.05}l${s * 0.09} -${s * 0.09}`}
        stroke="#ffffff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

function HotelScene({ c }: { c: Tones }) {
  const windows: ReactNode[] = [];
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      const lit = (r * 7 + col * 3) % 5 < 2;
      windows.push(
        <Rect
          key={`${r}-${col}`}
          x={222 + col * 15.5}
          y={60 + r * 15}
          width={8}
          height={8}
          rx={1.5}
          fill={lit ? WARM : c.pale}
          opacity={lit ? 0.92 : 0.22}
        />,
      );
    }
  }
  return (
    <>
      <Sky id="ho" top={c.night} bottom={mix(c.mid, "#c04bd8", 0.6)} />
      <Stars color={c.pale} />
      <Glow id="ho-moon" cx={322} cy={38} r={44} color={c.pale} o={0.35} />
      <Circle cx={322} cy={38} r={13} fill={c.pale} />
      <Circle
        cx={327}
        cy={34}
        r={11}
        fill={mix(c.night, c.mid, 0.6)}
        opacity={0.35}
      />
      {/* skyline */}
      <G fill={c.deep} opacity={0.75}>
        <Rect x={166} y={126} width={26} height={90} rx={2} />
        <Rect x={190} y={104} width={18} height={112} rx={2} />
        <Rect x={302} y={112} width={24} height={100} rx={2} />
        <Rect x={328} y={90} width={34} height={122} rx={2} />
      </G>
      {/* hotel tower */}
      <Defs>
        <LinearGradient id="ho-tower" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mix(c.mid, "#ffffff", 0.8)} />
          <Stop offset="1" stopColor={c.deep} />
        </LinearGradient>
      </Defs>
      <Rect x={224} y={34} width={64} height={16} rx={4} fill={c.mid} />
      <Rect
        x={236}
        y={38}
        width={40}
        height={7}
        rx={2}
        fill={WARM}
        opacity={0.95}
      />
      <Rect
        x={212}
        y={48}
        width={88}
        height={168}
        rx={6}
        fill="url(#ho-tower)"
      />
      {windows}
      {/* entrance */}
      <Glow id="ho-door" cx={256} cy={200} r={46} color={WARM} o={0.45} />
      <Path d="M222 176H290L296 184H216Z" fill={c.pale} />
      <Rect
        x={238}
        y={184}
        width={36}
        height={26}
        rx={2}
        fill={WARM}
        opacity={0.9}
      />
      <Line
        x1={256}
        y1={186}
        x2={256}
        y2={210}
        stroke={c.deep}
        strokeWidth={1}
      />
      {/* palm */}
      <Path
        d="M200 212Q197 184 204 160"
        stroke={c.night}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <G fill={c.night}>
        <Path d="M204 160Q188 152 178 162Q192 156 204 162Z" />
        <Path d="M204 160Q220 150 232 158Q218 156 204 162Z" />
        <Path d="M204 160Q196 142 184 140Q198 148 203 161Z" />
        <Path d="M204 160Q214 142 226 142Q212 150 205 161Z" />
      </G>
      <Rect y={206} width={VW} height={4} fill={c.night} />
      <FaceBadge x={306} y={132} s={40} ring={c.deep} />
      <Scrim id="ho" color={c.night} />
    </>
  );
}

function ParkScene({ c }: { c: Tones }) {
  const cx = 282;
  const cy = 96;
  const R = 62;
  const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI * 2) / 12);
  const bulbs = Array.from({ length: 24 }, (_, i) => (i * Math.PI * 2) / 24);
  const burst = (x: number, y: number, color: string) => (
    <G>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI * 2) / 10;
        return (
          <Line
            key={i}
            x1={x + Math.cos(a) * 5}
            y1={y + Math.sin(a) * 5}
            x2={x + Math.cos(a) * 13}
            y2={y + Math.sin(a) * 13}
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={x} cy={y} r={1.8} fill={color} />
    </G>
  );
  return (
    <>
      <Sky id="pk" top={c.deep} bottom={mix(c.mid, PINK, 0.45)} />
      <Stars color={c.pale} only={7} />
      {burst(208, 40, WARM)}
      {burst(342, 26, PINK)}
      <Glow id="pk-glow" cx={cx} cy={cy} r={90} color={PINK} o={0.3} />
      {/* ferris wheel */}
      <Path
        d={`M${cx} ${cy}L${cx - 36} 206M${cx} ${cy}L${cx + 36} 206`}
        stroke={c.pale}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Circle
        cx={cx}
        cy={cy}
        r={R}
        stroke={c.pale}
        strokeWidth={2.5}
        fill="none"
      />
      <Circle
        cx={cx}
        cy={cy}
        r={R - 9}
        stroke={c.pale}
        strokeOpacity={0.4}
        strokeWidth={1}
        fill="none"
      />
      {spokes.map((a, i) => (
        <Line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(a) * R}
          y2={cy + Math.sin(a) * R}
          stroke={c.pale}
          strokeOpacity={0.55}
          strokeWidth={1}
        />
      ))}
      {bulbs.map((a, i) => (
        <Circle
          key={i}
          cx={cx + Math.cos(a) * R}
          cy={cy + Math.sin(a) * R}
          r={1.3}
          fill={WARM}
        />
      ))}
      {spokes.map((a, i) => (
        <Rect
          key={i}
          x={cx + Math.cos(a) * R - 5}
          y={cy + Math.sin(a) * R + 1}
          width={10}
          height={9}
          rx={3}
          fill={i % 3 === 0 ? WARM : i % 3 === 1 ? PINK : c.soft}
        />
      ))}
      <Circle cx={cx} cy={cy} r={6} fill={c.pale} />
      {/* coaster */}
      <G stroke={c.night} strokeOpacity={0.7} strokeWidth={1.4}>
        {[
          [184, 158],
          [204, 138],
          [222, 146],
          [244, 186],
          [304, 168],
          [324, 144],
          [344, 134],
        ].map(([x, y]) => (
          <Line key={x} x1={x} y1={210} x2={x} y2={y} />
        ))}
      </G>
      <Path
        d="M150 206C184 130 214 126 232 166S266 214 294 178S338 118 372 148"
        stroke={c.night}
        strokeWidth={4.5}
        fill="none"
        strokeLinecap="round"
      />
      {/* tent */}
      <Path d="M178 206L198 176L218 206Z" fill={mix(PINK, c.mid, 0.6)} />
      <Path d="M198 176L192 206H204Z" fill={c.pale} opacity={0.8} />
      <Path d="M0 198Q90 188 180 196T360 192V210H0Z" fill={c.night} />
      <FaceBadge x={322} y={138} s={34} ring={c.deep} />
      <Scrim id="pk" color={c.night} />
    </>
  );
}

function CruiseScene({ c }: { c: Tones }) {
  const teal = "#35c7e8";
  const portholes = (y: number, from: number, to: number, step: number) =>
    Array.from({ length: Math.floor((to - from) / step) }, (_, i) => (
      <Circle
        key={i}
        cx={from + i * step}
        cy={y}
        r={1.7}
        fill={i % 4 === 1 ? WARM : c.deep}
        opacity={i % 4 === 1 ? 1 : 0.55}
      />
    ));
  return (
    <>
      <Sky id="cr" top={c.night} bottom={mix(c.mid, teal, 0.55)} />
      <Stars color={c.pale} only={6} />
      <Glow id="cr-sun" cx={296} cy={140} r={80} color={WARM} o={0.45} />
      <Circle cx={296} cy={140} r={24} fill={WARM} opacity={0.95} />
      {/* sea */}
      <Defs>
        <LinearGradient id="cr-sea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mix(c.deep, teal, 0.6)} />
          <Stop offset="1" stopColor={c.night} />
        </LinearGradient>
      </Defs>
      <Rect y={150} width={VW} height={60} fill="url(#cr-sea)" />
      <G fill={WARM}>
        <Rect x={272} y={184} width={48} height={1.6} rx={1} opacity={0.5} />
        <Rect x={280} y={192} width={32} height={1.6} rx={1} opacity={0.4} />
        <Rect x={288} y={200} width={18} height={1.6} rx={1} opacity={0.3} />
      </G>
      <G
        stroke={c.pale}
        strokeOpacity={0.28}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      >
        <Path d="M170 196q8 -4 16 0t16 0" />
        <Path d="M318 202q8 -4 16 0t16 0" />
        <Path d="M226 204q8 -4 16 0" />
      </G>
      {/* ship */}
      <Path d="M300 102L303 76H323L327 102Z" fill={c.mid} />
      <Rect x={302} y={82} width={23} height={5} fill={WARM} />
      <Rect
        x={222}
        y={102}
        width={112}
        height={15}
        rx={3}
        fill="#ffffff"
        opacity={0.9}
      />
      <Rect
        x={204}
        y={116}
        width={138}
        height={17}
        rx={3}
        fill="#ffffff"
        opacity={0.94}
      />
      <Rect x={190} y={132} width={158} height={19} rx={3} fill="#ffffff" />
      <G>{portholes(109.5, 230, 330, 9)}</G>
      <G>{portholes(124.5, 212, 340, 9)}</G>
      <G>{portholes(141.5, 198, 346, 9)}</G>
      <Path
        d="M168 150H356L340 176Q338 180 332 180H188Q182 180 180 176Z"
        fill={c.pale}
      />
      <Rect x={176} y={160} width={172} height={5} fill={c.mid} />
      <G stroke={c.pale} strokeWidth={1.3} fill="none" strokeLinecap="round">
        <Path d="M214 40q5 -5 10 0q5 -5 10 0" />
        <Path d="M242 56q4 -4 8 0q4 -4 8 0" />
      </G>
      <FaceBadge x={194} y={70} s={36} ring={c.deep} />
      <Scrim id="cr" color={c.night} />
    </>
  );
}

function AttractionScene({ c }: { c: Tones }) {
  const cols = [204, 228, 252, 276, 300, 324];
  return (
    <>
      <Sky id="at" top={c.night} bottom={mix(c.mid, "#ffb27a", 0.55)} />
      <Stars color={c.pale} only={8} />
      <Glow id="at-glow" cx={266} cy={150} r={110} color={WARM} o={0.25} />
      {/* pediment + entablature */}
      <Path d="M186 100L266 60L346 100Z" fill={c.pale} />
      <Path d="M204 96L266 68L328 96Z" fill={c.mid} opacity={0.3} />
      <Circle cx={266} cy={86} r={5} fill={WARM} opacity={0.9} />
      <Rect x={190} y={99} width={152} height={12} rx={1} fill={c.pale} />
      <Rect x={196} y={111} width={140} height={73} fill={c.deep} />
      {/* doorway light */}
      <Glow id="at-door" cx={269} cy={176} r={34} color={WARM} o={0.6} />
      <Rect x={262} y={146} width={14} height={38} rx={1} fill={WARM} />
      {/* columns */}
      <Defs>
        <LinearGradient id="at-col" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={c.soft} />
          <Stop offset="0.5" stopColor="#ffffff" />
          <Stop offset="1" stopColor={c.soft} />
        </LinearGradient>
      </Defs>
      {cols.map((x) => (
        <G key={x}>
          <Rect x={x - 2} y={111} width={14} height={4} fill={c.pale} />
          <Rect x={x} y={115} width={10} height={69} fill="url(#at-col)" />
        </G>
      ))}
      {/* steps */}
      <Rect x={192} y={184} width={148} height={7} fill={c.pale} />
      <Rect x={186} y={191} width={160} height={7} fill={c.soft} />
      <Rect
        x={180}
        y={198}
        width={172}
        height={12}
        fill={mix(c.soft, c.deep, 0.6)}
      />
      {/* flags */}
      <G>
        <Line
          x1={186}
          y1={100}
          x2={186}
          y2={76}
          stroke={c.pale}
          strokeWidth={1.2}
        />
        <Path d="M186 76h11l-3 4l3 4h-11Z" fill={PINK} />
        <Line
          x1={346}
          y1={100}
          x2={346}
          y2={76}
          stroke={c.pale}
          strokeWidth={1.2}
        />
        <Path d="M346 76h11l-3 4l3 4h-11Z" fill={WARM} />
      </G>
      <FaceBadge x={314} y={20} s={34} ring={c.deep} />
      <Scrim id="at" color={c.night} />
    </>
  );
}

function FamilyScene({ c }: { c: Tones }) {
  const ground = 212;
  const people = [
    { cx: 226, top: 90, h: 122, fill: c.pale },
    { cx: 294, top: 100, h: 112, fill: c.soft },
    { cx: 260, top: 134, h: 78, fill: WARM },
    { cx: 326, top: 148, h: 64, fill: PINK },
  ];
  return (
    <>
      <Sky id="fm" top={c.deep} bottom={mix(c.mid, "#7fd4ff", 0.5)} />
      <Stars color={c.pale} only={5} />
      <Glow id="fm-glow" cx={272} cy={130} r={110} color={c.pale} o={0.3} />
      <Circle cx={272} cy={214} r={96} fill={c.mid} opacity={0.35} />
      {/* link line through every head — one check-in for everyone */}
      <Path
        d="M226 96Q243 70 260 140Q277 80 294 106Q310 120 326 152"
        stroke={c.pale}
        strokeOpacity={0.6}
        strokeWidth={1.2}
        strokeDasharray="3 4"
        fill="none"
      />
      {people.map((p, i) => {
        const r = p.h * 0.13;
        const hy = p.top + r;
        const sy = p.top + r * 2 + 4;
        const w = p.h * 0.44;
        const pad = r + 5;
        const k = r * 0.7;
        return (
          <G key={i}>
            <Path
              d={`M${p.cx - w / 2} ${ground}V${sy + w * 0.36}Q${p.cx - w / 2} ${sy} ${p.cx} ${sy}Q${p.cx + w / 2} ${sy} ${p.cx + w / 2} ${sy + w * 0.36}V${ground}Z`}
              fill={p.fill}
              opacity={0.95}
            />
            <Circle cx={p.cx} cy={hy} r={r} fill={p.fill} />
            <Path
              d={`M${p.cx - pad} ${hy - pad + k}V${hy - pad}H${p.cx - pad + k}M${p.cx + pad - k} ${hy - pad}H${p.cx + pad}V${hy - pad + k}M${p.cx + pad} ${hy + pad - k}V${hy + pad}H${p.cx + pad - k}M${p.cx - pad + k} ${hy + pad}H${p.cx - pad}V${hy + pad - k}`}
              stroke="#ffffff"
              strokeWidth={1.4}
              strokeLinecap="round"
              fill="none"
            />
            <Circle
              cx={p.cx + pad}
              cy={hy - pad}
              r={4}
              fill={GO}
              stroke={c.deep}
              strokeWidth={1.5}
            />
          </G>
        );
      })}
      <Scrim id="fm" color={c.night} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Carousel                                                            */
/* ------------------------------------------------------------------ */

type Slide = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  Icon: LucideIcon;
  Scene: (p: { c: Tones }) => ReactNode;
};

const SLIDES: Slide[] = [
  {
    key: "hotel",
    eyebrow: "Hotels",
    title: "Check in without the queue",
    body: "A quick face scan at the desk and your room is ready.",
    Icon: Hotel,
    Scene: HotelScene,
  },
  {
    key: "park",
    eyebrow: "Theme parks",
    title: "Walk straight to the rides",
    body: "Your face is your park pass. No wristbands.",
    Icon: FerrisWheel,
    Scene: ParkScene,
  },
  {
    key: "cruise",
    eyebrow: "Cruises",
    title: "Board in seconds",
    body: "Skip the terminal line with your verified ID.",
    Icon: Ship,
    Scene: CruiseScene,
  },
  {
    key: "attraction",
    eyebrow: "Attractions",
    title: "Your face is the ticket",
    body: "Museums, landmarks and tours: just walk in.",
    Icon: Landmark,
    Scene: AttractionScene,
  },
  {
    key: "family",
    eyebrow: "Family",
    title: "Everyone checks in together",
    body: "Verify the whole family once, then go anywhere.",
    Icon: Users,
    Scene: FamilyScene,
  },
];

export function UseCaseCarousel() {
  const styles = useCarouselStyles();
  const t = useThemeTokens();
  const tones = useTones();
  const scroller = useRef<ScrollView>(null);
  const dragging = useRef(false);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(Math.round(e.nativeEvent.layout.width));

  const goTo = (i: number) => {
    scroller.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  // Restart the timer whenever the slide changes (auto or by swipe).
  useEffect(() => {
    if (width === 0) return;
    const id = setTimeout(() => {
      if (dragging.current) return;
      const next = (index + 1) % SLIDES.length;
      scroller.current?.scrollTo({ x: next * width, animated: true });
      setIndex(next);
    }, AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [index, width]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < SLIDES.length) setIndex(i);
  };

  const height = Math.round(width * (VH / VW));

  return (
    <View style={styles.wrap}>
      <View style={styles.shadow}>
        <View style={styles.frame} onLayout={onLayout}>
          {width > 0 && (
            <ScrollView
              ref={scroller}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={32}
              onScrollBeginDrag={() => (dragging.current = true)}
              onScrollEndDrag={() => (dragging.current = false)}
              style={{ height }}
            >
              {SLIDES.map(({ key, eyebrow, title, body, Icon, Scene }) => (
                <View
                  key={key}
                  style={{ width, height }}
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={`${eyebrow}. ${title}. ${body}`}
                >
                  <Svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${VW} ${VH}`}
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <Scene c={tones} />
                  </Svg>
                  <View style={styles.caption} pointerEvents="none">
                    <View style={styles.eyebrow}>
                      <Icon size={12} color={t.colors.onActionPrimary} />
                      <Text style={styles.eyebrowText}>{eyebrow}</Text>
                    </View>
                    <View style={styles.copy}>
                      <Text style={styles.title} numberOfLines={2}>
                        {title}
                      </Text>
                      <Text style={styles.body} numberOfLines={2}>
                        {body}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <Pressable
            key={s.key}
            accessibilityRole="button"
            accessibilityLabel={`Show ${s.eyebrow}`}
            hitSlop={8}
            onPress={() => goTo(i)}
          >
            <View style={[styles.dot, i === index && styles.dotActive]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const useCarouselStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing[3] },
  /* Shadow and clipping live on separate views — iOS drops the shadow of an overflow:hidden view. */
  shadow: {
    borderRadius: t.radii.xl,
    backgroundColor: mix(t.colors.actionPrimary, "#07041a", 0.28),
    ...t.shadows.lg,
  },
  frame: {
    borderRadius: t.radii.xl,
    overflow: "hidden",
    minHeight: 120,
  },
  caption: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "62%",
    padding: t.spacing[4] + 2,
    justifyContent: "space-between",
  },
  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[1.5],
    paddingHorizontal: t.spacing[2] + 2,
    paddingVertical: t.spacing[1],
    borderRadius: t.radii.full,
    backgroundColor: alpha(t.colors.onActionPrimary, 0.16),
    borderWidth: 1,
    borderColor: alpha(t.colors.onActionPrimary, 0.22),
  },
  eyebrowText: {
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    letterSpacing: t.letterSpacing.caps,
    textTransform: "uppercase",
    color: t.colors.onActionPrimary,
  },
  copy: { gap: t.spacing[1] },
  title: {
    fontFamily: t.fontFamily.display.semibold,
    fontSize: t.fontSize.lg,
    lineHeight: t.fontSize.lg * t.lineHeight.snug,
    color: t.colors.onActionPrimary,
  },
  body: {
    fontSize: t.fontSize.xs,
    lineHeight: t.fontSize.xs * 1.45,
    color: alpha(t.colors.onActionPrimary, 0.78),
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: t.spacing[1.5],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.borderStrong,
  },
  dotActive: { width: 20, backgroundColor: t.colors.actionPrimary },
}));

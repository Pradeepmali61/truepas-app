import { useEffect, useId, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G,
    LinearGradient,
    Path,
    Stop,
} from "react-native-svg";

import { Blink, FadeUp } from "@/components/ui/motion";
import { alpha, useThemeTokens } from "@/theme";
import type { LivenessChallenge } from "@/types/domain";
import { SoftCard, VariantTag } from "./core";
import { useStyles } from "./styles";

/**
 * LIVENESS — guided challenge dial (design-repo E · DIAL). Per-step perimeter
 * segments + a countdown drain ring around a demonstrator head that performs
 * each action. Unlike the upstream showcase this is controlled: the active
 * step and completion come from the real liveness session.
 */

const ACircle = Animated.createAnimatedComponent(Circle);
const APath = Animated.createAnimatedComponent(Path);
const AG = Animated.createAnimatedComponent(G);

/* ---------- shared drivers ---------- */

/** Ping-pong 0→1→0 loop — breathing/pulsing. */
function usePingPong(ms: number) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, ms]);
  return v;
}

/**
 * Per-step 0→1 driver — animates over the step's allowed window
 * (step_time_limits.max_ms), restarting when `currentIndex` changes.
 * Paused once `allDone` so the success reveal owns the stage.
 */
function useStepDriver(stepMs: number, currentIndex: number, paused: boolean) {
  const [action] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (paused) return;
    action.setValue(0);
    const anim = Animated.timing(action, {
      toValue: 1,
      duration: stepMs,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [action, stepMs, currentIndex, paused]);
  return action;
}

/** Success reveal driver — 0→1 when `allDone` flips. */
function useSuccess(allDone: boolean) {
  const [success] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.timing(success, {
      toValue: allDone ? 1 : 0,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [success, allDone]);
  return success;
}

/* ---------- shared atoms ---------- */

/** Check mark that draws itself in as `v` crosses its window. */
function DrawnCheck({ v, color, size = 92, sw = 7 }: { v: Animated.Value; color: string; size?: number; sw?: number }) {
  const off = v.interpolate({ inputRange: [0.08, 0.55], outputRange: [68, 0], extrapolate: "clamp" });
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <APath
        d="M28,52 L44,68 L74,36"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={68}
        strokeDashoffset={off}
      />
    </Svg>
  );
}

/** Two staggered expanding rings on success. */
function Bursts({ v, color, size }: { v: Animated.Value; color: string; size: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
      {[0.15, 0.4].map((d) => (
        <Animated.View
          key={d}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: color,
            opacity: v.interpolate({ inputRange: [d, d + 0.12, 1], outputRange: [0, 0.55, 0], extrapolate: "clamp" }),
            transform: [{ scale: v.interpolate({ inputRange: [d, 1], outputRange: [0.8, 1.45], extrapolate: "clamp" }) }],
          }}
        />
      ))}
    </View>
  );
}

/** LIVE / DONE pill in the card header. */
function LiveBadge({ done }: { done: boolean }) {
  const t = useThemeTokens();
  const styles = useStyles();
  const color = done ? t.colors.success : t.colors.error;
  return (
    <View style={[styles.liveBadge, { backgroundColor: done ? t.colors.successSubtle : t.colors.errorSubtle }]}>
      {done ? (
        <View style={[styles.liveBadgeDot, { backgroundColor: color }]} />
      ) : (
        <Blink ms={600}>
          <View style={[styles.liveBadgeDot, { backgroundColor: color }]} />
        </Blink>
      )}
      <Text style={[styles.liveBadgeText, { color }]}>{done ? "DONE" : "LIVE"}</Text>
    </View>
  );
}

function CardHead({ tag, done }: { tag: string; done: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.liveHead}>
      <VariantTag>{tag}</VariantTag>
      <LiveBadge done={done} />
    </View>
  );
}

/* ---------- guided liveness (challenge sequence) ---------- */

const DEFAULT_COPY: Record<LivenessChallenge, string> = {
  turn_left: "Turn your head slowly to the left",
  turn_right: "Turn your head slowly to the right",
  blink: "Blink your eyes",
};
const ZERO = new Animated.Value(0);

/**
 * Demonstration head — three parallax layers fake a 3D turn (skull moves
 * least, eyes move most) and the eye band squashes vertically for blinks.
 * `action` is a 0→1 per-step driver; `challenge` maps it to the motion.
 */
export function GuideFace({
  size = 150,
  action = ZERO,
  challenge = "turn_left",
  color,
}: {
  size?: number;
  action?: Animated.Value;
  challenge?: LivenessChallenge;
  color: string;
}) {
  const sway = usePingPong(2400);
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const dir = challenge === "turn_left" ? -1 : 1;
  const isTurn = challenge !== "blink";
  const turn = action.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, isTurn ? dir : 0, isTurn ? dir : 0, 0],
    extrapolate: "clamp",
  });
  const tx = (k: number) => turn.interpolate({ inputRange: [-1, 1], outputRange: [-k, k] });
  const deg = (k: number) => turn.interpolate({ inputRange: [-1, 1], outputRange: [`${-k}deg`, `${k}deg`] });
  const sx = (k: number) => turn.interpolate({ inputRange: [-1, 0, 1], outputRange: [1 - k, 1, 1 - k] });
  const blinkY =
    challenge === "blink"
      ? action.interpolate({
          inputRange: [0, 0.12, 0.24, 0.38, 0.5, 1],
          outputRange: [1, 0.08, 1, 0.08, 1, 1],
          extrapolate: "clamp",
        })
      : 1;
  const band = size * 0.18;
  const skin = `url(#lvFace${gid})`;

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [{ rotate: sway.interpolate({ inputRange: [0, 1], outputRange: ["-1.2deg", "1.2deg"] }) }],
      }}
    >
      {/* skull, ears, hair — least parallax */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx(6) }, { rotate: deg(5) }, { scaleX: sx(0.1) }] }]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id={`lvFace${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.18" />
              <Stop offset="1" stopColor={color} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>
          <Ellipse cx={27.6} cy={49} rx={3.4} ry={5.2} fill={skin} stroke={color} strokeWidth={2.2} />
          <Ellipse cx={72.4} cy={49} rx={3.4} ry={5.2} fill={skin} stroke={color} strokeWidth={2.2} />
          <Path
            d="M50,15 C63,15 72,26 72,40 C72,50 70,58 65.5,65.5 C61.5,73.5 56,79 50,79 C44,79 38.5,73.5 34.5,65.5 C30,58 28,50 28,40 C28,26 37,15 50,15 Z"
            fill={skin}
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path
            d="M30.5,35 C33,21.5 40,16.5 50,16.5 C60,16.5 67,21.5 69.5,35 C61,26.5 39,26.5 30.5,35 Z"
            fill={color}
            opacity={0.16}
          />
        </Svg>
      </Animated.View>
      {/* brows / nose / mouth / blush — mid parallax */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx(10) }, { rotate: deg(6.5) }, { scaleX: sx(0.22) }] }]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx={37.5} cy={57.5} r={4.2} fill={color} opacity={0.13} />
          <Circle cx={62.5} cy={57.5} r={4.2} fill={color} opacity={0.13} />
          <Path d="M36,37.5 Q41.5,34 47,36.8" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M53,36.8 Q58.5,34 64,37.5" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M50,45.5 L50,54.5 Q50,57 52.8,57" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
          <Path d="M39,62.5 Q50,70.5 61,62.5" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" />
        </Svg>
      </Animated.View>
      {/* eye band — almond eyes with catchlights; scaleY around the eye line = blink */}
      <Animated.View
        style={{
          position: "absolute",
          top: size * 0.36,
          left: 0,
          right: 0,
          height: band,
          transform: [{ translateX: tx(11.5) }, { scaleX: sx(0.3) }, { scaleY: blinkY }],
        }}
      >
        <Svg width={size} height={band} viewBox="0 36 100 18" preserveAspectRatio="xMidYMid meet">
          <Path d="M36.5,45 Q41.5,40.6 46.5,45 Q41.5,49.4 36.5,45 Z" fill={color} />
          <Path d="M53.5,45 Q58.5,40.6 63.5,45 Q58.5,49.4 53.5,45 Z" fill={color} />
          <Circle cx={43.4} cy={43.4} r={1} fill="#ffffff" opacity={0.9} />
          <Circle cx={60.4} cy={43.4} r={1} fill="#ffffff" opacity={0.9} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** Curved rotation arrow drawn over the head — Face ID setup cue. */
function GuideArrow({ dir, v, color, size }: { dir: 1 | -1; v: Animated.Value; color: string; size: number }) {
  const arc = dir === -1 ? "M78,38 A33,33 0 0 0 22,38" : "M22,38 A33,33 0 0 1 78,38";
  const head = dir === -1 ? "M22,38 L26.2,30 M22,38 L31,37.7" : "M78,38 L73.8,30 M78,38 L69,37.7";
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
      <AG opacity={v.interpolate({ inputRange: [0.75, 0.95], outputRange: [1, 0], extrapolate: "clamp" })}>
        <APath
          d={arc}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={72}
          strokeDashoffset={v.interpolate({ inputRange: [0, 0.35], outputRange: [72, 0], extrapolate: "clamp" })}
        />
        <APath
          d={head}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={v.interpolate({ inputRange: [0.3, 0.38], outputRange: [0, 1], extrapolate: "clamp" })}
        />
      </AG>
      </Svg>
    </View>
  );
}

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};
const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  return `M${p0.x},${p0.y} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x},${p1.y}`;
};

/* ---------- E · Dial — instrument gauge with countdown ring ---------- */

export interface LivenessGuideDialProps {
  /** Ordered steps from POST /liveness/v2/challenge → challenge_sequence. */
  steps: LivenessChallenge[];
  /** Active step index — liveness.currentStepIndex; earlier segments read done. */
  currentIndex: number;
  /** Instruction copy — pass the backend ui_copy map (falls back to defaults). */
  labels?: Partial<Record<LivenessChallenge, string>>;
  /** Countdown window per step — pass step_time_limits.max_ms. */
  stepMs?: number;
  /** Verified state — emerald arcs, drawn check, "All checks passed". */
  allDone?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LivenessGuideDial({
  steps,
  currentIndex,
  labels,
  stepMs = 6000,
  allDone = false,
  style,
}: LivenessGuideDialProps) {
  const styles = useStyles();
  const t = useThemeTokens();
  const violet = t.colors.actionPrimary;
  const emerald = t.colors.success;
  const action = useStepDriver(stepMs, currentIndex, allDone);
  const success = useSuccess(allDone);
  const segPulse = usePingPong(700);
  const copy = { ...DEFAULT_COPY, ...labels };
  const current = steps[Math.min(currentIndex, steps.length - 1)];
  const isTurn = current !== "blink";
  const dir = current === "turn_left" ? -1 : 1;
  const C2 = 2 * Math.PI * 96;
  const seg = 360 / steps.length;

  if (steps.length === 0) return null;

  return (
    <SoftCard style={[styles.liveCard, style]}>
      <CardHead tag="E · DIAL" done={allDone} />
      <View style={styles.liveStage}>
        <Svg width={240} height={240} viewBox="0 0 240 240" style={StyleSheet.absoluteFill}>
          {/* per-step perimeter segments */}
          {steps.map((_, i) => {
            const a0 = -90 + i * seg + 5;
            const a1 = -90 + (i + 1) * seg - 5;
            const state = allDone || i < currentIndex ? "done" : i === currentIndex ? "active" : "idle";
            const arc = (
              <Path
                key={i}
                d={arcPath(120, 120, 110, a0, a1)}
                fill="none"
                stroke={state === "done" ? emerald : state === "active" ? violet : alpha(violet, 0.18)}
                strokeWidth={6}
                strokeLinecap="round"
              />
            );
            return state === "active" ? (
              <AG key={i} opacity={segPulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] })}>
                {arc}
              </AG>
            ) : (
              arc
            );
          })}
          {/* countdown drain ring for the active step */}
          <Circle cx={120} cy={120} r={96} fill="none" stroke={alpha(violet, 0.14)} strokeWidth={2.5} />
          <ACircle
            cx={120}
            cy={120}
            r={96}
            fill="none"
            stroke={alpha(violet, 0.55)}
            strokeWidth={2.5}
            strokeDasharray={C2}
            strokeDashoffset={action.interpolate({ inputRange: [0, 1], outputRange: [0, C2] })}
            transform="rotate(-90 120 120)"
          />
        </Svg>

        {/* center demonstrator */}
        <View style={{ width: 132, height: 132, alignItems: "center", justifyContent: "center" }}>
          <GuideFace size={132} action={action} challenge={current} color={violet} />
          {isTurn && !allDone && <GuideArrow dir={dir as 1 | -1} v={action} color={violet} size={132} />}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 999,
                backgroundColor: emerald,
                opacity: success.interpolate({ inputRange: [0, 0.5], outputRange: [0, 0.14] }),
              },
            ]}
          />
          {allDone && <DrawnCheck v={success} color={emerald} size={84} />}
        </View>
        <Bursts v={success} color={emerald} size={190} />
      </View>

      <View style={[styles.centerCol, { alignSelf: "stretch" }]}>
        <FadeUp key={allDone ? "done" : current} dy={8}>
          <Text style={[styles.cardTitle, styles.centerText, allDone && { color: emerald }]}>
            {allDone ? "All checks passed" : copy[current]}
          </Text>
        </FadeUp>
        <Text style={styles.helper}>
          {allDone ? "Liveness complete" : `Step ${currentIndex + 1} of ${steps.length} — hold until the ring completes`}
        </Text>
      </View>
    </SoftCard>
  );
}

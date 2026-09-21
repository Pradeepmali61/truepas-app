import { useThemeTokens } from "@/theme";
import type { ViewStyle } from "react-native";
import { AppIcon, type IconName } from "../app/AppIcon";
import { Card as CoreCard } from "../composite/Card";
import { ErrorState as CoreErrorState } from "../composite/states";
import { Button as CoreButton, type ButtonSize, type ButtonVariant } from "./Button";
import { Progress } from "./Progress";
import { Switch } from "./Switch";

// --- ui-native primitives (token-based) ---
export { Avatar, type AvatarProps } from "./Avatar";
export { Badge, type BadgeProps, type BadgeVariant } from "./Badge";
export { Button as CoreButton, type ButtonProps, type ButtonSize, type ButtonVariant } from "./Button";
export { Checkbox, type CheckboxProps } from "./Checkbox";
export { Divider, type DividerProps } from "./Divider";
export { Icon as CoreIcon, type IconProps, type IconSize } from "./Icon";
export { IconButton, type IconButtonProps } from "./IconButton";
export { Input, type InputProps } from "./Input";
export { Label, type LabelProps } from "./Label";
export { Link, type LinkProps } from "./Link";
export { Blink, FadeUp, PopIn, Pulse, ScanLine } from "./motion";
export { NeuBox, NeuWell, type NeuBoxProps, type NeuVariant } from "./NeuBox";
export { Progress, type ProgressProps } from "./Progress";
export { RadioGroup, type RadioGroupProps, type RadioOption } from "./RadioGroup";
export { RowIcon, type RowIconProps, type RowIconTone } from "./RowIcon";
export { Select, type SelectOption, type SelectProps } from "./Select";
export { Skeleton, type SkeletonProps } from "./Skeleton";
export { Spinner, type SpinnerProps } from "./Spinner";
export { Switch, type SwitchProps } from "./Switch";
export { Textarea, type TextareaProps } from "./Textarea";
export { Typography, type TextVariant, type TypographyProps } from "./Typography";

// --- App-only components (token-based, backward-compatible APIs) ---
export {
    AnimatedCard,
    AppIcon, CAR_CLAY_SVG, CheckboxRow,
    Chip,
    ChipRow,
    DocIllustration,
    FloatingInput,
    getIcon, GLOBE_CLAY_SVG, InfoBanner, ListItem,
    NeuButton,
    NeuElevatedView,
    NeuPitView, PASSPORT_CLAY_SVG, Pill, PinDots,
    PinPad,
    SectionTitle, STATUE_CLAY_SVG,
    STATUE_SVG, Stepper, USFLAG_CLAY_SVG, type BannerVariant, type IconName, type PillVariant
} from "../app";
export { BottomSheet } from "./BottomSheet";

// --- Composite re-exports (for backward compat with old import paths) ---
export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Card as CoreCard } from "../composite/Card";
export { ErrorState as CoreErrorState, EmptyState, LoadingState, type ErrorStateProps } from "../composite/states";
export { useToast as useCoreToast } from "../composite/Toast";

// --- Compatibility wrappers ---

/**
 * Compatibility Button — accepts the legacy `label` prop and delegates
 * to the ui-native Button (which uses `children`).
 */
type LegacyVariant = "primary" | "secondary" | "outline" | "danger" | "link";

interface LegacyButtonProps {
  label: string;
  onPress?: () => void;
  variant?: LegacyVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: IconName;
  iconColor?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const VARIANT_MAP: Record<LegacyVariant, ButtonVariant> = {
  primary: "primary",
  secondary: "secondary",
  outline: "outline",
  danger: "destructive",
  link: "link",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  icon,
  iconColor,
  fullWidth,
  style,
}: LegacyButtonProps) {
  const theme = useThemeTokens();
  return (
    <CoreButton
      variant={VARIANT_MAP[variant]}
      size={size}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      fullWidth={fullWidth ?? true}
      style={style}
      iconLeft={
        icon ? <AppIcon name={icon} size={20} color={iconColor ?? theme.colors.onActionPrimary} /> : undefined
      }
    >
      {label}
    </CoreButton>
  );
}

/** Compatibility Icon — accepts the legacy `name` + numeric `size` API. */
interface LegacyIconProps {
  name: IconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

export function Icon({ name, size, color, accessibilityLabel }: LegacyIconProps) {
  return <AppIcon name={name} size={size} color={color} accessibilityLabel={accessibilityLabel} />;
}

/** ProgressTrack — alias for Progress, accepting legacy `percent` prop. */
interface LegacyProgressProps {
  percent?: number;
  size?: "sm" | "md";
  variant?: "primary" | "success" | "warning" | "error";
  style?: ViewStyle;
}

export function ProgressTrack({ percent, ...rest }: LegacyProgressProps) {
  return <Progress value={percent} {...rest} />;
}

/** Toggle — alias for Switch, accepting legacy `on`/`onToggle` API. */
interface LegacyToggleProps {
  on: boolean;
  onToggle: (value: boolean) => void;
  accessibilityLabel?: string;
}

export function Toggle({ on, onToggle, accessibilityLabel }: LegacyToggleProps) {
  return <Switch value={on} onValueChange={onToggle} label={accessibilityLabel} />;
}

/** ErrorState — compat wrapper accepting legacy `message` prop. */
interface LegacyErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: LegacyErrorStateProps) {
  return <CoreErrorState title={title} description={message} onRetry={onRetry} />;
}

/** OtpRow — placeholder re-export (legacy OtpRow is replaced by composite OtpInput). */
export { OtpInput as OtpRow } from "../composite/OtpInput";

/** Card — compat wrapper accepting legacy `className` prop (ignored). */
interface LegacyCardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, className: _className, onPress, style }: LegacyCardProps) {
  return (
    <CoreCard onPress={onPress} style={style}>
      {children}
    </CoreCard>
  );
}

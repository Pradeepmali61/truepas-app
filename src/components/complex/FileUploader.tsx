/** @jsxImportSource react */
import { File, FileWarning, UploadCloud, X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { makeStyles, useThemeTokens } from "../../theme";
import { iconSize } from "../../theme/tokens";
import { IconButton } from "../ui/IconButton";
import { Progress } from "../ui/Progress";

export interface UploadedFile {
  key: string;
  name: string;
  size?: string;
  /** 0–100; omit = done */
  progress?: number;
  error?: string;
}

export interface FileUploaderProps {
  files?: UploadedFile[];
  /** Tap the dropzone — wire to expo-document-picker / expo-image-picker */
  onPick?: () => void;
  onRemove?: (key: string) => void;
  hint?: ReactNode;
  disabled?: boolean;
  state?: "default" | "error";
  errorText?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Document upload UI. Presentation only — the app supplies the picker
 * (e.g. expo-document-picker) via onPick and drives progress per file.
 */
export function FileUploader({
  files = [],
  onPick,
  onRemove,
  hint,
  disabled,
  state = "default",
  errorText,
  style,
}: FileUploaderProps) {
  const styles = useStyles();
  const theme = useThemeTokens();
  const hasError = state === "error" || !!errorText;

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Upload file"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPick}
        style={({ pressed }) => [
          styles.dropzone,
          pressed && styles.dropzonePressed,
          hasError && styles.dropzoneError,
          disabled && styles.dropzoneDisabled,
        ]}
      >
        <UploadCloud size={iconSize.lg} color={theme.colors.textMuted} />
        <Text style={styles.dropTitle}>Tap to upload</Text>
        {hint != null && <Text style={styles.dropHint}>{hint}</Text>}
      </Pressable>

      {hasError && errorText != null && (
        <View style={styles.errorRow}>
          <FileWarning size={iconSize.sm} color={theme.colors.error} />
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      )}

      {files.map((f) => (
        <View key={f.key} style={styles.fileRow}>
          <File size={iconSize.md} color={f.error ? theme.colors.error : theme.colors.textMuted} />
          <View style={styles.fileBody}>
            <Text style={[styles.fileName, !!f.error && styles.fileNameError]} numberOfLines={1}>
              {f.name}
            </Text>
            {f.error ? (
              <Text style={styles.fileError}>{f.error}</Text>
            ) : f.size ? (
              <Text style={styles.fileSize}>{f.size}</Text>
            ) : null}
            {f.progress != null && f.progress < 100 && !f.error && (
              <Progress value={f.progress} size="sm" style={styles.fileProgress} />
            )}
          </View>
          {onRemove && (
            <IconButton
              accessibilityLabel={`Remove ${f.name}`}
              icon={<X size={iconSize.sm} color={theme.colors.textMuted} />}
              size="sm"
              onPress={() => onRemove(f.key)}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing[3] },
  dropzone: {
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[2],
    paddingVertical: t.spacing[8],
    paddingHorizontal: t.spacing[4],
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: t.colors.borderStrong,
    borderRadius: t.radii.xl,
    backgroundColor: t.colors.surface,
  },
  dropzonePressed: { backgroundColor: t.colors.actionSecondary },
  dropzoneError: { borderColor: t.colors.error, backgroundColor: t.colors.errorSubtle },
  dropzoneDisabled: { opacity: t.opacity.disabled },
  dropTitle: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  dropHint: { fontSize: t.fontSize.sm, color: t.colors.textMuted, textAlign: "center" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: t.spacing[1.5] },
  errorText: { flex: 1, fontSize: t.fontSize.sm, color: t.colors.error },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    padding: t.spacing[3],
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.fieldBorderWidth,
    borderColor: t.colors.borderSubtle,
    borderRadius: t.radii.lg,
  },
  fileBody: { flex: 1, gap: 2 },
  fileName: { fontSize: t.fontSize.base, fontWeight: t.fontWeight.medium, color: t.colors.textPrimary },
  fileNameError: { color: t.colors.error },
  fileSize: { fontSize: t.fontSize.xs, color: t.colors.textMuted },
  fileError: { fontSize: t.fontSize.xs, color: t.colors.error },
  fileProgress: { marginTop: t.spacing[1] },
}));

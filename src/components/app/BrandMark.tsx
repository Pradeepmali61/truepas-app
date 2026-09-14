import { View } from "react-native";
import { ScanFace } from "lucide-react-native";
import { makeStyles, useThemeTokens } from "@/theme";
import { iconSize } from "@/theme/tokens";
import { Typography } from "@/components/ui/Typography";

export function BrandMark({ compact }: { compact?: boolean }) {
  const styles = useStyles();
  const theme = useThemeTokens();
  return (
    <View style={styles.brand}>
      <View style={styles.brandIcon}>
        <ScanFace size={compact ? iconSize.md : iconSize.lg} color={theme.colors.onActionPrimary} />
      </View>
      <Typography variant={compact ? "h4" : "h3"}>Truepas</Typography>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  brand: { flexDirection: "row", alignItems: "center", gap: t.spacing[2] },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
}));

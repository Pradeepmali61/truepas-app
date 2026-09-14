import { useFonts, type FontSource } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono/400Regular";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono/500Medium";
import { JetBrainsMono_600SemiBold } from "@expo-google-fonts/jetbrains-mono/600SemiBold";
import { JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono/700Bold";

/**
 * TRUEPAS UI NATIVE — FONTS
 * The exact faces referenced by the fontFamily token (tokens.ts).
 * Registering happens in the host app (or showcase) via useTruepasFonts().
 *
 * Inter        → UI text (sans)
 * JetBrainsMono → codes, amounts, IDs (mono) — fixed-width digits
 *
 * Subpath imports keep the bundle lean: only the 8 used weights ship,
 * not the full 100–900 range of each family.
 */

export const TRUEPAS_FONT_SOURCES: Record<string, FontSource> = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
};

/** Loads the Truepas font set. Returns [loaded, error] like expo-font. */
export function useTruepasFonts(): [boolean, Error | null] {
  return useFonts(TRUEPAS_FONT_SOURCES);
}

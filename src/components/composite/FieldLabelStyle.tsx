import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * FieldLabelStyle — how FormField renders its label:
 *  - "stacked": classic label above the control
 *  - "overlap": label chip straddling the control's top edge (default)
 */
export type FieldLabelStyle = "stacked" | "overlap";

const FieldLabelStyleContext = createContext<{
  labelStyle: FieldLabelStyle;
  setLabelStyle: (s: FieldLabelStyle) => void;
}>({ labelStyle: "overlap", setLabelStyle: () => {} });

export const useFieldLabelStyle = () => useContext(FieldLabelStyleContext);

export function FieldLabelStyleProvider({ children }: { children: ReactNode }) {
  const [labelStyle, setLabelStyle] = useState<FieldLabelStyle>("overlap");
  const value = useMemo(() => ({ labelStyle, setLabelStyle }), [labelStyle]);
  return <FieldLabelStyleContext.Provider value={value}>{children}</FieldLabelStyleContext.Provider>;
}

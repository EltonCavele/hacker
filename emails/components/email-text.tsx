import { Text } from "@react-email/components";
import type { ReactNode } from "react";
import { emailTheme } from "../theme";

export function EmailText({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <Text
      style={{
        margin: "0",
        fontSize: small ? "12px" : "14px",
        lineHeight: small ? "18px" : "20px",
        color: emailTheme.colors.mutedForeground,
        textAlign: "center",
      }}
    >
      {children}
    </Text>
  );
}

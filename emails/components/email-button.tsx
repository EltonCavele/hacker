import { Button } from "@react-email/components";
import type { ReactNode } from "react";
import { emailTheme } from "../theme";

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  const { colors, radius } = emailTheme;
  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        padding: "10px 22px",
        borderRadius: radius.button,
        backgroundColor: colors.primary,
        color: colors.primaryForeground,
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}

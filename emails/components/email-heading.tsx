import { Heading } from "@react-email/components";
import type { ReactNode } from "react";
import { emailTheme } from "../theme";

export function EmailHeading({ children }: { children: ReactNode }) {
  return (
    <Heading
      as="h1"
      style={{
        margin: "0 0 20px",
        fontSize: "20px",
        lineHeight: "28px",
        fontWeight: 600,
        color: emailTheme.colors.foreground,
        textAlign: "center",
      }}
    >
      {children}
    </Heading>
  );
}

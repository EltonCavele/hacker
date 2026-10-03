import { Section, Text } from "@react-email/components";
import { emailTheme } from "../theme";

const LETTER_SPACING = "0.3em";

/**
 * A one-time code in a soft box. Rendered as a single text node (spacing via letter-spacing) so a
 * double-click or drag selects and copies it as one clean string.
 */
export function EmailCode({ code }: { code: string }) {
  const { colors, radius } = emailTheme;
  return (
    <Section style={{ backgroundColor: colors.muted, borderRadius: radius.box, padding: "16px 8px" }}>
      <Text
        style={{
          margin: 0,
          fontSize: "28px",
          lineHeight: "36px",
          fontWeight: 600,
          color: colors.foreground,
          textAlign: "center",
          letterSpacing: LETTER_SPACING,
          // letter-spacing also trails the last character; pad the start to keep the code centred.
          paddingLeft: LETTER_SPACING,
          userSelect: "all",
        }}
      >
        {code}
      </Text>
    </Section>
  );
}

import { Hr } from "@react-email/components";
import { emailTheme } from "../theme";

export function EmailDivider() {
  return <Hr style={{ margin: "20px 0", border: 0, borderTop: `1px solid ${emailTheme.colors.border}` }} />;
}

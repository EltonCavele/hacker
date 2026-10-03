// Email clients don't support CSS variables or oklch(), so these are hex mirrors of the tokens in
// app/globals.css (light mode). Keep them in sync when rebranding.
export const emailTheme = {
  colors: {
    background: "#f5f5f5", // page behind the card
    card: "#ffffff", // --card
    foreground: "#0a0a0a", // --foreground
    muted: "#fafafa", // surface for the code box
    mutedForeground: "#737373", // --muted-foreground
    subtle: "#a3a3a3", // footer text
    border: "#f0f0f0", // divider (softer than --border)
    primary: "#171717", // --primary
    primaryForeground: "#fafafa", // --primary-foreground
  },
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  radius: { card: "24px", box: "16px", button: "999px" },
} as const;

export const appName = "Nextpad";

/**
 * CodeDev Network Design System Tokens (JavaScript)
 * Central theme object for use in React components, styling utilities,
 * canvas drawings, chart configurations, and Monaco editor themes.
 */

export const theme = {
  colors: {
    // Brand & Primary
    primary: "#ffa116",
    primaryHover: "#ffb33e",
    primaryActive: "#e68d05",
    primaryRgb: "255, 161, 22",

    // Secondary
    secondary: "#2d2d2d",
    secondaryHover: "#383838",
    secondaryText: "#cfcfcf",

    // Backgrounds & Surfaces
    background: "#1b1b1b",
    surface: "#2d2d2d",
    surfaceHover: "#343434",
    surfaceAlt: "#242424",
    surfaceSubtle: "#222222",
    input: "rgba(255, 255, 255, 0.03)",

    // Typography & Text
    textPrimary: "#ffffff",
    textBody: "#cfcfcf",
    textSecondary: "#a0a0a0",
    textMuted: "#777777",
    textDisabled: "#555555",

    // Borders & Dividers
    border: "#3d3d3d",
    borderSubtle: "#2d2d2d",
    borderHover: "#555555",
    borderAccent: "#ffa116",

    // Verdicts & Statuses
    success: "#22c55e",
    successSubtle: "#9be9a8", // Easy
    warning: "#f1c232",       // Medium / TLE
    danger: "#f28b82",        // Hard / WA / Error
    dangerBold: "#ef4444",
    info: "#3b82f6",

    // External Coding Platforms
    platforms: {
      leetcode: "#ffa116",
      codeforces: "#1890ff",
      codechef: "#8b572a",
      gfg: "#2f8d46",
    },
  },

  radius: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "10px",
    xl: "14px",
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.2)",
    md: "0 4px 12px rgba(0, 0, 0, 0.25)",
    lg: "0 8px 24px rgba(0, 0, 0, 0.35)",
    glow: "0 0 12px rgba(255, 161, 22, 0.25)",
  },

  transitions: {
    fast: "0.15s ease",
    normal: "0.25s ease",
    slow: "0.35s ease",
  },

  layout: {
    maxContentWidth: "1000px",
    maxWideWidth: "1200px",
  },
};

export default theme;

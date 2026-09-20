import * as stylex from "@stylexjs/stylex";
export const tokens = stylex.defineVars({
  paper: "#181818",
  ink: "#eeeeee",
  muted: "#a3a3a3",
  line: "#333333",
  accent: "#ea3f8b",
  font: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  photoDuration: {
    default: "320ms",
    "@media (prefers-reduced-motion: reduce)": "0s",
  },
  photoReturnDuration: {
    default: "180ms",
    "@media (prefers-reduced-motion: reduce)": "0s",
  },
  gutter: { default: "32px", "@media (max-width: 600px)": "16px" },
});

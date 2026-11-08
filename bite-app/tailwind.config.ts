import type { Config } from "tailwindcss";

// Identidad BITE.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bite-black": "#171717",
        "bite-cream": "#F5F0E8",
        "bite-orange": "#FF642D",
        "bite-stone": "#77736D",
        "bite-sand": "#E5D9C8",
        "bite-card": "#B6B1AB",
        "bite-ok": "#2F7D4F",
        "bite-bad": "#B3261E"
      },
      fontFamily: {
        display: ["var(--font-display)", "Century Gothic", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        bite: "22px"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0a0a0c",
          raised: "#111114",
          overlay: "#18181c",
        },
        accent: {
          DEFAULT: "#d4a843",
          dim: "#a17e2e",
          bright: "#f0c95e",
        },
        danger: "#c44b4b",
        success: "#4b9c6b",
        muted: "#6b6b78",
        subtle: "#3a3a44",
      },
      fontFamily: {
        display: ['"Instrument Serif"', "Georgia", "serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

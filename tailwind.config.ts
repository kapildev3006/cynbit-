import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: {
          DEFAULT: "#0f172a",
          card: "#131c31",
          elevated: "#18243e",
          border: "#1e293b",
          borderHighlight: "#334155",
        },
        primary: {
          DEFAULT: "#06b6d4", // Cyan
          hover: "#0891b2",
          light: "#22d3ee",
          dark: "#0e7490",
        },
        accent: {
          DEFAULT: "#3b82f6", // Blue
          purple: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

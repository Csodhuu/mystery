import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07080d",
        panel: "#0f1119",
        panel2: "#151826",
        line: "#232739",
        neon: "#22d3ee",
        common: "#9ca3af",
        uncommon: "#3b82f6",
        rare: "#a855f7",
        epic: "#ec4899",
        legendary: "#f59e0b",
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
    },
  },
  plugins: [],
} satisfies Config;

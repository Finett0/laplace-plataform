import type { Config } from "tailwindcss";

/**
 * Laplace — Tailwind config
 * Base branca · acento azul metálico (variante B travada em globals.css).
 * Tokens-fonte: design/README.md · Preview: design/metallic-blue.html
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        border: {
          DEFAULT: "var(--border)",
          2: "var(--border-2)",
        },
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        positive: "var(--positive)",
        // rampa azul da marca
        steel: {
          50: "var(--steel-50)",
          100: "var(--steel-100)",
          200: "var(--steel-200)",
          300: "var(--steel-300)",
          400: "var(--steel-400)",
          500: "var(--steel-500)",
          600: "var(--steel-600)",
          700: "var(--steel-700)",
          800: "var(--steel-800)",
          900: "var(--steel-900)",
        },
      },
      // gradientes metálicos como background-image → bg-metal, bg-metal-wash
      backgroundImage: {
        metal: "var(--metal)",
        "metal-wash": "var(--metal-wash)",
        grain: "var(--grain)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Hanken Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "ui-sans-serif", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "22px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        metal: "var(--shadow-metal)",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(.22,.61,.36,1)",
      },
      keyframes: {
        rise: {
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        rise: "rise .6s cubic-bezier(.22,.61,.36,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;

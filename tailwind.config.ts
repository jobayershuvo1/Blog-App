import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        secondary: {
          DEFAULT: "#8b5cf6",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        accent: {
          DEFAULT: "#f59e0b",
          500: "#f59e0b",
        },
        success: "#10b981",
        danger: "#ef4444",
        // Dark navy / slate surfaces (not pure black)
        surface: {
          DEFAULT: "#ffffff",
          dark: "#0f172a",
          "dark-elevated": "#1e293b",
          "dark-card": "#1a2236",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Hind Siliguri", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
        bengali: ["Hind Siliguri", "SolaimanLipi", "Kalpurush", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        "gradient-accent": "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
        "glow-primary": "0 0 24px -4px rgba(99, 102, 241, 0.5)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        marquee: "marquee 30s linear infinite",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#F0F5F2",
          100: "#DCE8E2",
          200: "#B8D2C5",
          300: "#8EB8A3",
          400: "#609B7F",
          500: "#3D8262",
          600: "#2B6F50",
          700: "#21634A",
          800: "#174B39",
          900: "#123B2E",
          950: "#0A241C",
        },
        sage: {
          50: "#F7F9F5",
          100: "#EDF1E8",
          200: "#DDE6D7",
          300: "#C4D4BC",
          400: "#A6BE9B",
          500: "#89A67D",
        },
        cream: {
          50: "#FBF8F1",
          100: "#F4EFE4",
          200: "#EAE2CF",
        },
        sand: {
          100: "#EDE6D9",
          200: "#DED2BF",
          300: "#C8B9A0",
        },
        taupe: {
          400: "#BDAD96",
          500: "#A99B87",
          600: "#8F816E",
        },
        ink: {
          950: "#17211E",
          700: "#46514B",
          500: "#69736D",
          400: "#8C9690",
          200: "#D3D9D5",
          100: "#E9ECE9",
        },
        border: {
          DEFAULT: "#E6E3DA",
          dark: "#D4D0C5",
        },
        state: {
          success: "#28734E",
          warning: "#A66B19",
          danger: "#B53C37",
          info: "#315F85",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "DM Serif Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(18, 59, 46, 0.05), 0 1px 2px rgba(18, 59, 46, 0.03)",
        card: "0 4px 12px rgba(18, 59, 46, 0.04), 0 1px 3px rgba(18, 59, 46, 0.02)",
        elevated: "0 12px 32px rgba(18, 59, 46, 0.08), 0 2px 6px rgba(18, 59, 46, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;


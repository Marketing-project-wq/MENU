/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#D62828",
          dark: "#141414",
        },
        // Token tema (light/dark) — nilai channel RGB dari CSS vars di index.css.
        bg: "rgb(var(--bg) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        card2: "rgb(var(--card2) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Barlow Condensed", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

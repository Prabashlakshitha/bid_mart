/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12172B",
          900: "#0B0E1C",
          800: "#12172B",
          700: "#1C2340",
          600: "#2A3357",
        },
        paper: "#F6F3EC",
        gold: {
          DEFAULT: "#D9A441",
          light: "#F0CB7E",
          dark: "#A9782B",
        },
        slate: {
          DEFAULT: "#5B6178",
        },
        signal: {
          go: "#2F9E63",
          warn: "#C1443C",
        },
      },
      fontFamily: {
        display: [
          "Georgia",
          "Iowan Old Style",
          "Palatino Linotype",
          "URW Palladio L",
          "P052",
          "serif",
        ],
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,23,43,0.06), 0 8px 24px rgba(18,23,43,0.06)",
      },
    },
  },
  plugins: [],
};

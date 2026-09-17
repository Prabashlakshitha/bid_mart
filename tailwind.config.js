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
        paper: "#FFFFFF",
        // Kept the "gold" key so every existing bg-gold/text-gold-dark class
        // across the app stays correct — only the hex values moved from the
        // old amber accent to a true orange.
        gold: {
          DEFAULT: "#FF6A1A",
          light: "#FFB37A",
          dark: "#C2410C",
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

        // A tight, saturated ring right at the edge plus a much larger soft
        // spread underneath — the combination is what actually reads as
        // "glowing" against a white page. A single soft shadow alone just
        // looks like an ordinary drop shadow once it fades into white.
        glow: "0 0 0 1px rgba(255,106,26,0.35), 0 0 16px rgba(255,106,26,0.65), 0 10px 30px -4px rgba(255,106,26,0.55)",
        "glow-lg": "0 0 0 1px rgba(255,106,26,0.5), 0 0 28px rgba(255,106,26,0.85), 0 16px 44px -4px rgba(255,106,26,0.7)",

        // Layered, offset shadows read as depth/elevation rather than a flat
        // drop shadow — that's the "3D" a card gets at rest vs. on hover.
        "card-3d": "0 1px 2px rgba(18,23,43,0.05), 0 8px 16px -4px rgba(18,23,43,0.10), 0 24px 48px -16px rgba(18,23,43,0.18)",
        "card-3d-hover": "0 2px 4px rgba(18,23,43,0.06), 0 4px 18px -2px rgba(255,106,26,0.25), 0 32px 64px -20px rgba(18,23,43,0.28)",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": {
            boxShadow: "0 0 0 1px rgba(255,106,26,0.35), 0 0 16px rgba(255,106,26,0.65), 0 10px 30px -4px rgba(255,106,26,0.55)",
          },
          "50%": {
            boxShadow: "0 0 0 1px rgba(255,106,26,0.55), 0 0 30px rgba(255,106,26,0.9), 0 14px 40px -4px rgba(255,106,26,0.7)",
          },
        },
      },
      animation: {
        "glow-pulse": "glowPulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

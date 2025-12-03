import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Magenta color palette (for direct class usage like magenta-500)
        magenta: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        // SLTR Core Colors
        sltr: {
          navy: {
            DEFAULT: '#0a1628',
            light: '#0d1b2a',
            dark: '#061018',
            card: '#1b2838',
          },
          lime: {
            DEFAULT: '#00ff88',
            dark: '#00cc6a',
            light: '#88ffaa',
          },
          magenta: {
            DEFAULT: '#ff00ff',
            50: '#fdf4ff',
            100: '#fae8ff',
            200: '#f5d0fe',
            300: '#f0abfc',
            400: '#e879f9',
            500: '#d946ef',
            600: '#c026d3',
            700: '#a21caf',
            800: '#86198f',
            900: '#701a75',
          },
          white: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['var(--font-orbitron)', 'Orbitron', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

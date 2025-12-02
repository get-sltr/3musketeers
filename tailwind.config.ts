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
          white: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['var(--font-orbitron)', 'Orbitron', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'ecg-beat': {
          '0%, 100%': { transform: 'scaleY(1)', opacity: '1' },
          '15%': { transform: 'scaleY(1.15)', opacity: '1' },
          '30%': { transform: 'scaleY(0.9)', opacity: '0.9' },
          '45%': { transform: 'scaleY(1.25)', opacity: '1' },
          '60%': { transform: 'scaleY(0.85)', opacity: '0.85' },
          '75%': { transform: 'scaleY(1)', opacity: '1' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(251, 113, 133, 0.4)' },
          '50%': { boxShadow: '0 0 0 6px rgba(251, 113, 133, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(251, 113, 133, 0)' },
        },
      },
      animation: {
        'ecg-beat': 'ecg-beat 1s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

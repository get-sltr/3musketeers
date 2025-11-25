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
      },
    },
  },
  plugins: [],
} satisfies Config;

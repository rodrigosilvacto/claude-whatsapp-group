import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5fb',
          100: '#d9e8f5',
          200: '#b6d0ea',
          500: '#1f5f8b',
          600: '#184e74',
          700: '#123f5f',
          800: '#0f334d',
          900: '#0c283c',
        },
        ink: '#15202b',
        mist: '#f3f6f9',
        sand: '#f7f4ef',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -18px rgba(15, 51, 77, 0.35)',
        card: '0 1px 2px rgba(15, 40, 60, 0.04), 0 8px 24px rgba(15, 40, 60, 0.06)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.45s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        app: {
          bg: '#1d1d1f',
          sidebar: '#2c2c2e',
          surface: '#3a3a3c',
          elevated: '#48484a',
          border: '#38383a',
          'border-light': '#48484a',
        },
        accent: {
          DEFAULT: '#0a84ff',
          hover: '#409cff',
          muted: 'rgba(10, 132, 255, 0.15)',
        },
        label: {
          primary: '#f5f5f7',
          secondary: '#98989d',
          tertiary: '#636366',
          quaternary: '#48484a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

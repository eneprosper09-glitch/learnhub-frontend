/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        black: {
          50: '#f7f7f7',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#262626',
          800: '#171717',
          900: '#0a0a0a',
        },
        accent: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
        soft: '0 10px 30px -12px rgba(0, 0, 0, 0.15)',
        lift: '0 20px 50px -20px rgba(0, 0, 0, 0.25)',
        dark: '0 20px 60px -20px rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      backgroundImage: {
        'black-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #171717 100%)',
        'hero-glow':
          'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, rgba(10, 10, 10, 0) 60%)',
      },
    },
  },
  plugins: [],
};
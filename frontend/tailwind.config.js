/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fefdf0',
          100: '#fdfbe2',
          200: '#fcf6b6',
          300: '#faf18a',
          400: '#f8eb5e',
          500: '#f5c518', // IMDb Gold
          600: '#dda20c',
          700: '#b67a0a',
          800: '#8f5608',
          900: '#744207',
        },
        surface: {
          950: '#111827', // dark slate for headers
          900: '#f3f4f6', // light page background
          800: '#ffffff', // white card background
          700: '#f9fafb', // table header background
          600: '#e5e7eb', // border color
          500: '#6b7280', // muted text
        },
        accent: {
          DEFAULT: '#0066c0', // Mojo Blue
          light:   '#0284c7',
          dark:    '#1d4ed8',
        },
        success: '#16a34a', // professional green
        danger:  '#dc2626', // professional red
        muted:   '#64748b',
      },
      fontFamily: {
        sans:  ['Inter', 'ui-sans-serif', 'system-ui'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient':    'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        'card-gradient':    'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
        'amber-gradient':   'linear-gradient(135deg, #f5c518 0%, #dda20c 100%)',
        'indigo-gradient':  'linear-gradient(135deg, #0066c0 0%, #1d4ed8 100%)',
        'success-gradient': 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
      },
      boxShadow: {
        'glow-amber':  '0 0 15px rgba(245,197,24,0.15)',
        'glow-indigo': '0 0 15px rgba(0,102,192,0.15)',
        'card':        '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
      },
      animation: {
        'slide-up':    'slideUp 0.3s ease-out',
        'fade-in':     'fadeIn 0.2s ease-out',
        'pulse-amber': 'pulseAmber 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseAmber: {
          '0%, 100%': { boxShadow: '0 0 4px rgba(245,197,24,0.2)' },
          '50%':      { boxShadow: '0 0 12px rgba(245,197,24,0.4)' },
        },
      },
    },
  },
  plugins: [],
}

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        background: '#F8F6F3',
        accent: {
          DEFAULT: '#E05A28',
          hover:   '#C94E21',
          light:   '#FEF0E8',
          border:  '#F5C9AD',
          50:      '#FEF0E8',
          100:     '#FCDCCA',
          500:     '#E05A28',
          600:     '#C94E21',
          700:     '#A83E18',
        },
      },
      animation: {
        'pulse-ring':  'pulse-ring 2.4s ease-out infinite',
        'blink':       'blink 1s step-end infinite',
        'slow-spin':   'slow-spin 12s linear infinite',
        'shimmer':     'shimmer 1.5s ease-in-out infinite',
        'scale-in':    'scaleIn 220ms cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':  'slideDown 280ms cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { transform: 'scale(1)', opacity: '0.35' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'slow-spin': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card':  '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.07)',
        'modal': '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

export default config

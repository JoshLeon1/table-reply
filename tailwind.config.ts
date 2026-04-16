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
        background: 'var(--bg)',
        card:       'var(--card)',
        surface:    'var(--surface)',
        border:     'var(--border)',
        divider:    'var(--divider)',
        text: {
          DEFAULT:    'var(--text-1)',
          1:          'var(--text-1)',
          2:          'var(--text-2)',
          3:          'var(--text-3)',
          placeholder:'var(--text-ph)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
          light:   'var(--accent-light)',
          border:  'var(--accent-border)',
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
        'float':       'float 3.5s ease-in-out infinite',
        'fade-up':     'fadeUp 380ms cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':     'fadeIn 220ms ease-out both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
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
        card:        'var(--shadow-card)',
        'card-hover':'var(--shadow-card-hover)',
        modal:       'var(--shadow-modal)',
        accent:      'var(--shadow-accent)',
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'var(--radius-2xl)',
      },
    },
  },
  plugins: [],
}

export default config

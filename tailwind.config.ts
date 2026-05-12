import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS variable-based semantic tokens
        bg:      'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        stroke:  'var(--stroke)',
        fg:      'var(--fg)',
        'fg-muted': 'var(--fg-muted)',
        'fg-subtle': 'var(--fg-subtle)',
        // New semantic tokens
        'bg-soft': 'var(--bg-soft)',
        'stroke-strong': 'var(--stroke-strong)',
        // Brand colors (same in both modes)
        primary: 'var(--primary, #2a6cf0)',
        'primary-dark': '#1a56d6',
        'primary-light': '#eef4ff',
        secondary: '#1f8df0',
        accent: '#1442a8',
        // v3 warm scale
        warm: {
          50:  '#fff1e6',
          100: '#ffdcbf',
          200: '#ffbe83',
          400: '#f58a3c',
          500: '#ed6f1c',
          600: '#c8540e',
          700: '#93390a',
        },
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '18px',
        '3xl': '22px',
      },
      letterSpacing: {
        tightest: '-0.035em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,15,30,.04), 0 4px 16px rgba(10,15,30,.04)',
        hero: '0 24px 60px -20px rgba(20,66,168,.45), 0 8px 20px -10px rgba(10,15,30,.2)',
        warm: '0 6px 16px -4px rgba(237,111,28,0.5)',
      },
      animation: {
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'live-pulse': 'live-pulse 1.6s ease-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'live-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.4)', opacity: '.4' },
        },
      },
    },
  },
  plugins: [],
}

export default config

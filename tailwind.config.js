/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          soft: 'var(--color-primary-soft)',
        },
        background: 'var(--bg-primary)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          soft: 'var(--bg-surface-soft)',
          strong: 'var(--bg-surface-strong)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          muted: 'var(--border-muted)',
        },
        secondary: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        finqz: {
          bg: '#020617',
          surface: '#0F172A',
          card: '#111827',
          cardHover: '#172554',
          border: 'rgba(255,255,255,0.08)',

          primary: '#2563EB',
          accent: '#38BDF8',

          text: '#FFFFFF',
          muted: '#94A3B8',
        },
      },

      boxShadow: {
        glow: '0 0 30px rgba(59,130,246,0.25)',
        card: 'var(--shadow-card)',
        panel: 'var(--shadow-panel)',
      },

      fontSize: {
        'display-sm': ['1.625rem', { lineHeight: '2rem', fontWeight: '700' }],
        'heading-md': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '650' }],
        'body-sm': ['0.875rem', { lineHeight: '1.375rem' }],
        'caption': ['0.75rem', { lineHeight: '1rem' }],
      },

      backgroundImage: {
        'futuristic-grid':
          'radial-gradient(circle at top, rgba(37,99,235,0.15), transparent 40%)',
      },
    },
  },

  plugins: [],
}

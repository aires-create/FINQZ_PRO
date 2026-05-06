/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
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
      },

      backgroundImage: {
        'futuristic-grid':
          'radial-gradient(circle at top, rgba(37,99,235,0.15), transparent 40%)',
      },
    },
  },

  plugins: [],
}
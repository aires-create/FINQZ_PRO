/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================
      // PALETA OFICIAL FINQZ PRO
      // ============================================
      colors: {
        // PRIMARY - Azul FINQZ PRO (tokens oficiais)
        primary: {
          DEFAULT: "#0019AA",
          50: "#E6E9FF",
          100: "#CCD4FF",
          200: "#99A9FF",
          300: "#667EFF",
          400: "#3353FF",
          500: "#0019AA",
          600: "#0014A3",
          700: "#000F7C",
          800: "#000A55",
          900: "#00052E",
          hover: "#001393",
        },
        // SECONDARY - Cinza escuro (Sidebar)
        secondary: {
          DEFAULT: "#0F172A",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        // ACCENT - Cores complementares
        accent: {
          blue: "#2563EB",
          green: "#16A34A",
          yellow: "#F59E0B",
          red: "#DC2626",
          purple: "#7C3AED",
        },
        // STATUS
        success: "#16A34A",
        warning: "#F59E0B",
        error: "#DC2626",
        info: "#2563EB",
        // SURFACE
        surface: "#FFFFFF",
        background: "#F7F9FC",
        // BORDAS
        border: "#E5E7EB",
        "border-light": "#F1F5F9",
        // TEXTO
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
        "text-muted": "#9CA3AF",
      },
      // TIPOGRAFIA
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "display": ["3rem", { lineHeight: "1.1", fontWeight: "700" }],
        "h1": ["2.25rem", { lineHeight: "1.2", fontWeight: "600" }],
        "h2": ["1.875rem", { lineHeight: "1.25", fontWeight: "600" }],
        "h3": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "h4": ["1.25rem", { lineHeight: "1.35", fontWeight: "600" }],
        "h5": ["1.125rem", { lineHeight: "1.4", fontWeight: "500" }],
        "body": ["1rem", { lineHeight: "1.5" }],
        "small": ["0.875rem", { lineHeight: "1.5" }],
        "xs": ["0.75rem", { lineHeight: "1.5" }],
      },
      // BORDAS
      borderRadius: {
        DEFAULT: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        full: "9999px",
      },
      // SOMBRAS
      boxShadow: {
        // Cards
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)",
        "card-md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "card-lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        // Inputs
        input: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "input-focus": "0 0 0 3px rgba(29, 43, 255, 0.15)",
        // Modal
        modal: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      },
      // ANIMAÇÕES
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "spin-slow": "spin 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      // SPACING
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      // Z-INDEX
      zIndex: {
        "dropdown": "1000",
        "sticky": "1020",
        "fixed": "1030",
        "modal-backdrop": "1040",
        "modal": "1050",
        "popover": "1060",
        "tooltip": "1070",
      },

      // TRANSIÇÕES CUSTOMIZADAS
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}

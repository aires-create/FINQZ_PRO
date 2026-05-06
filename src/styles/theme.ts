// ============================================
// DESIGN TOKENS — FINQZ PRO (v1 clean fintech)
// ============================================

export const theme = {
  colors: {
    primary: '#000dff',
    primarySoft: '#3388d9',
    background: '#0f172a', // navy escuro
    surface: '#111827', // cards
    border: '#1f2937',
    text: '#e5e7eb',
    textSecondary: '#9ca3af',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px'
  },

  shadow: {
    soft: '0 4px 20px rgba(0,0,0,0.25)',
    none: 'none'
  },

  spacing: {
    xs: '6px',
    sm: '10px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
};

// ============================================
// Utility Classes — Componentes Prontos
// ============================================

// Card padrão
export const cardClasses = "bg-[#111827] border border-[#1f2937] rounded-xl p-4 shadow-none";

// Card com hover
export const cardHoverClasses = "bg-[#111827] border border-[#1f2937] rounded-xl p-4 shadow-none hover:border-[#2b3545] transition";

// Header padrão
export const headerClasses = "flex items-center justify-between mb-6";
export const headerTitleClasses = "text-xl font-semibold text-slate-200";
export const headerActionsClasses = "flex gap-2";

// Botão primário
export const buttonPrimaryClasses = "bg-[#000dff] hover:bg-[#0011cc] text-white px-4 py-2 rounded-lg font-medium";

// Botão secundário
export const buttonSecondaryClasses = "border border-[#1f2937] text-slate-300 px-4 py-2 rounded-lg hover:bg-[#1f2937]";

// KPI Card
export const kpiCardClasses = "bg-[#111827] border border-[#1f2937] rounded-xl p-4";
export const kpiLabelClasses = "text-sm text-slate-400";
export const kpiValueClasses = "text-2xl font-semibold text-white mt-1";

// Input padrão
export const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg";

// Panel padrão SDR IA
export const panelClasses = "bg-[#111827] border border-[#1f2937] rounded-xl p-6";

// Design System - Toggle Component
// PADRÃO OFICIAL: Use este componente em todo o sistema

import React from "react";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
}) => {
  const sizes = {
    sm: {
      track: "w-8 h-4",
      thumb: "w-3 h-3",
      translate: "translate-x-4",
    },
    md: {
      track: "w-11 h-6",
      thumb: "w-5 h-5",
      translate: "translate-x-5",
    },
  };

  return (
    <label className={`inline-flex items-center gap-3 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${checked ? "bg-primary" : "bg-gray-200"}
          ${sizes[size].track}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block rounded-full bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 shadow-lg transform transition-transform duration-200
            ${sizes[size].thumb}
            ${checked ? sizes[size].translate : "translate-x-0.5"}
            ${size === "sm" ? "mt-0.5 ml-0.5" : "mt-1 ml-1"}
          `}
        />
      </button>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  );
};

export default Toggle;

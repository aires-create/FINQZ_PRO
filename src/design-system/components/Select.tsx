// Design System - Select Component
// PADRÃO OFICIAL: Use este componente em todo o sistema

import React from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder = "Selecione...",
  fullWidth = true,
  className = "",
  id,
  value,
  children,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = "w-full px-4 py-2.5 text-sm border rounded-lg bg-[#0F172A] text-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-[#111827] disabled:text-slate-400 disabled:cursor-not-allowed appearance-none border-white/10";
  
  const stateStyles = error 
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
    : "border-white/10 hover:border-white/20";

  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-200 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          className={`${baseStyles} ${stateStyles} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options ? (
            options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))
          ) : (
            children
          )}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-sm text-slate-400">{helperText}</p>}
    </div>
  );
};

export default Select;

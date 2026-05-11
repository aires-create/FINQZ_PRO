// Design System - Select Component
// PADRÃO OFICIAL: Use este componente em todo o sistema

import React, { useId } from "react";

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
  const generatedId = useId();
  const selectId = id || generatedId;

  const baseStyles = `
    h-11 w-full appearance-none rounded-xl border
    bg-white dark:bg-slate-900 px-4 pr-11
    text-sm text-slate-900 dark:text-slate-100
    transition-all duration-200 ease-in-out
    focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
    disabled:cursor-not-allowed disabled:opacity-50
    hover:border-slate-300 dark:hover:border-slate-600
  `;

  const stateStyles = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 hover:border-red-500"
    : "border-slate-300 dark:border-slate-700";

  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
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
          {placeholder && !children && (
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
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="h-4 w-4 text-slate-500 dark:text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0"></span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Select;

// Design System - Input Component
// PADRÃO OFICIAL: Use este componente em todo o sistema

import React, { useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = "",
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  const baseStyles = `
    h-11 w-full rounded-xl border bg-white dark:bg-slate-900
    px-4 text-sm text-slate-900 dark:text-slate-100
    transition-all duration-200 ease-in-out
    placeholder:text-slate-500 dark:placeholder:text-slate-400
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
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`${baseStyles} ${stateStyles}
                     ${leftIcon ? "pl-11" : ""}
                     ${rightIcon ? "pr-11" : ""}
                     ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
            {rightIcon}
          </div>
        )}
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

export default Input;

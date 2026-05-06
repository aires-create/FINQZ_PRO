// Design System - Input Component
// PADRÃO OFICIAL: Use este componente em todo o sistema

import React from "react";

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
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = "w-full px-4 py-2.5 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed";
  
  const stateStyles = error 
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
    : "border-gray-300 hover:border-gray-400";

  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`${baseStyles} ${stateStyles} ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>}
    </div>
  );
};

export default Input;

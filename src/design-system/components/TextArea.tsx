// Design System - TextArea Component
// PADRÃO OFICIAL: Use este componente em todo o sistema

import React from "react";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  fullWidth = true,
  className = "",
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyles = "w-full px-4 py-2.5 text-sm border rounded-lg bg-[#0F172A] text-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-[#111827] disabled:text-slate-400 disabled:cursor-not-allowed resize-none";
  
  const stateStyles = error 
    ? "border-red-500 text-white focus:border-red-500 focus:ring-red-500/20" 
    : "border-white/10 hover:border-white/20";

  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-slate-200 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`${baseStyles} ${stateStyles} ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-sm text-slate-400">{helperText}</p>}
    </div>
  );
};

export default TextArea;

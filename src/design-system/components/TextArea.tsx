// Design System - TextArea Component
// PADRÃO OFICIAL: Use este componente em todo o sistema

import React, { useId } from "react";

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
  const generatedId = useId();
  const textareaId = id || generatedId;

  const baseStyles = `
    min-h-[100px] w-full resize-y rounded-xl border
    bg-white dark:bg-slate-900 px-4 py-3
    text-sm text-slate-900 dark:text-slate-100
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
          htmlFor={textareaId}
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`${baseStyles} ${stateStyles} ${className}`}
        {...props}
      />
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

export default TextArea;

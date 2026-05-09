// Design System - ErrorState Component
// FINQZ PRO - Estado de erro

import React from "react";
import { Button } from "./Button";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Algo deu errado",
  message,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 px-6 py-12 text-center ${className}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
        <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-300" />
      </div>
      <h3 className="text-center text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-center text-sm leading-6 text-[var(--text-muted)]">
        {message}
      </p>
      {action ? (
        <Button
          variant="primary"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
          icon={<RefreshCw size={16} />}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  );
};

// Error boundary message
export const ErrorMessage: React.FC<{
  message: string;
  className?: string;
}> = ({ message, className = "" }) => (
  <div className={`flex items-center gap-2 text-sm text-red-500 dark:text-red-300 ${className}`}>
    <AlertCircle size={16} />
    <span>{message}</span>
  </div>
);

export default ErrorState;

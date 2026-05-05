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
      className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}
    >
      <div className="bg-red-100 rounded-full p-4 mb-4">
        <AlertCircle className="w-12 h-12 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 text-center">
        {title}
      </h3>
      <p className="text-sm text-gray-500 text-center mt-1 max-w-sm">
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
  <div className={`flex items-center gap-2 text-red-600 text-sm ${className}`}>
    <AlertCircle size={16} />
    <span>{message}</span>
  </div>
);

export default ErrorState;

// Design System - Modal Component
// PADRÃO OFICIAL: Use este componente em todo o sistema
// Suporte completo dark/light mode e z-index global

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { zIndex } from "../../config/zIndex";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{ zIndex: zIndex.modal }}
      className="fixed inset-0 flex items-center justify-center p-4
                 bg-black/50 dark:bg-black/60 
                 backdrop-blur-md backdrop-saturate-150
                 animate-in fade-in duration-200"
    >
      <div
        className={`${sizes[size]} w-full
                    bg-white dark:bg-slate-900
                    border border-slate-200/50 dark:border-slate-700/50
                    rounded-2xl shadow-2xl dark:shadow-2xl dark:shadow-black/50
                    animate-in zoom-in-95 duration-200 ease-out
                    max-h-[90vh] overflow-hidden
                    flex flex-col`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between
                          px-6 py-4 sm:py-5
                          border-b border-slate-200/60 dark:border-slate-700/60
                          bg-slate-50/50 dark:bg-slate-800/50
                          flex-shrink-0">
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold
                             text-slate-900 dark:text-slate-100
                             tracking-tight pr-4">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex items-center justify-center flex-shrink-0
                           w-8 h-8 rounded-lg
                           text-slate-500 hover:text-slate-700
                           dark:text-slate-400 dark:hover:text-slate-200
                           hover:bg-slate-100 dark:hover:bg-slate-800
                           transition-all duration-200 ease-in-out
                           focus:outline-none focus:ring-2 focus:ring-primary/20
                           active:scale-95"
                aria-label="Fechar modal"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

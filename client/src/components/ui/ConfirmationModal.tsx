import React from "react";
import { Button } from "./Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  isLoading?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <h3 className="text-xl font-bold font-headline text-slate-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 font-body leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button 
              variant={variant === "danger" ? "error" : "primary"}
              onClick={onConfirm}
              isLoading={isLoading}
              className={`flex-1 h-12 rounded-xl font-bold text-xs shadow-none ${
                variant === "danger" ? "bg-red-500 hover:bg-red-600 text-white border-none" : ""
              }`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

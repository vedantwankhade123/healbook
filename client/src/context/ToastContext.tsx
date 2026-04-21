"use client";

import React, { createContext, useContext } from "react";
import { toast, Toaster } from "react-hot-toast";

interface ToastContextType {
  success: (msg: string) => void;
  error: (msg: string) => void;
  loading: (msg: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const success = (msg: string) => toast.success(msg);
  const error = (msg: string) => toast.error(msg);
  const loading = (msg: string) => toast.loading(msg);
  const dismiss = (id: string) => toast.dismiss(id);

  return (
    <ToastContext.Provider value={{ success, error, loading, dismiss }}>
      <Toaster position="top-center" reverseOrder={false} />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

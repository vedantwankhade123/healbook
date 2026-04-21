"use client";

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const AuthGuard = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "patient" | "doctor" | "admin";
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      } else if (requiredRole && user.role !== requiredRole) {
        navigate("/");
      }
    }
  }, [user, loading, navigate, location.pathname, requiredRole]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative">
        <div className="flex flex-col items-center gap-8 relative z-10 px-6 text-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-primary/10 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-b-primary rounded-full animate-spin duration-1000" />

            <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-primary text-xl">medical_services</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold font-headline tracking-[0.2em]">
              <span className="text-primary">Care</span> <span className="text-on-surface-variant/60">Simplified</span>
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

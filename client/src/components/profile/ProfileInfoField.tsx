"use client";

import React from "react";

interface ProfileInfoFieldProps {
  label: string;
  value: string | number | undefined;
  icon: string;
  className?: string;
}

export const ProfileInfoField = ({ label, value, icon, className = "" }: ProfileInfoFieldProps) => {
  return (
    <div className={`flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-3xl group hover:border-primary/20 transition-all ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-all">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div className="pt-0.5">
        <p className="text-xs font-bold text-slate-500 tracking-wide leading-none mb-1.5">{label}</p>
        <p className="text-base font-bold text-slate-900 font-poppins">{value || "Not provided"}</p>
      </div>
    </div>
  );
};

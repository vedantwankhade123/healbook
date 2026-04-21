"use client";

import React from "react";

interface ProfileHeaderProps {
  name: string;
  role: string;
  photo?: string;
  onEdit?: () => void;
  gradient?: string;
}

export const ProfileHeader = ({ 
  name, 
  role, 
  photo, 
  onEdit, 
  gradient = "bg-gradient-royal" 
}: ProfileHeaderProps) => {
  return (
    <div className={`relative min-h-[220px] md:min-h-[300px] rounded-[3rem] ${gradient} animate-gradient shadow-ambient mb-10 overflow-hidden flex items-end p-8 md:p-12`}>
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 relative z-10 w-full">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white/20 backdrop-blur-md p-2 shadow-2xl relative border border-white/20 flex-shrink-0">
          <div className="w-full h-full rounded-[2rem] bg-white overflow-hidden flex items-center justify-center text-primary text-4xl font-bold border border-white/10">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              name[0]
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center border-4 border-transparent shadow-lg">
            <span className="material-symbols-outlined text-xl fill-1">verified</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-2 text-center md:text-left pb-2">
          <h1 className="text-3xl md:text-5xl font-bold text-white font-poppins tracking-tighter drop-shadow-md">
            {name}
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold rounded-full border border-white/20 shadow-sm">
              {role.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                <span className="text-[11px] text-slate-900 font-bold">Active Session</span>
            </div>
          </div>
        </div>
      </div>

      {onEdit && (
        <button 
          onClick={onEdit}
          className="absolute top-6 right-6 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold text-sm transition-all shadow-xl"
        >
          Edit profile
        </button>
      )}
    </div>
  );
};

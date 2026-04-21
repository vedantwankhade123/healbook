"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useState } from "react";
import { usePrakriti } from "@/context/PrakritiContext";

const doctorNavItems = [
  { name: "My Summary", href: "/doctor-dashboard", icon: "dashboard" },
  { name: "My Patients", href: "/doctor-dashboard/patients", icon: "groups" },
  { name: "My Schedule", href: "/doctor-dashboard/schedule", icon: "calendar_today" },
  { name: "Patient Records", href: "/doctor-dashboard/records", icon: "clinical_notes" },
  { name: "My Profile", href: "/doctor-dashboard/profile", icon: "account_circle" },
];

export const DoctorSidebar = () => {
  const pathname = useLocation().pathname;
  const { user, logout } = useAuth();
  const { chatWithPrakriti } = usePrakriti();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-container border-r border-outline-variant/10 hidden lg:flex flex-col p-6 z-40">
      <Link to="/doctor-dashboard" className="flex items-center gap-3 mb-12 px-2 group">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-white text-2xl">health_and_safety</span>
        </div>
        <div>
          <span className="text-xl font-bold text-slate-900 font-poppins tracking-tighter block leading-none">HealBook</span>
          <span className="text-[10px] font-semibold text-primary mt-1 block font-poppins tracking-widest">Doctor portal</span>
        </div>
      </Link>

      <div className="space-y-1.5 flex-1">
        <p className="px-4 text-[10px] font-semibold text-slate-400 mb-4 font-poppins tracking-widest">Clinical menu</p>
        <nav className="space-y-1">
          {doctorNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-2xl font-poppins font-semibold text-sm transition-all
                  ${
                    isActive
                      ? "bg-primary/5 text-primary border border-primary/10"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                  }
                `}
              >
                <span className={`material-symbols-outlined ${isActive ? "fill-1" : "opacity-70"}`}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
        {user && (
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 p-0.5 border border-slate-200 overflow-hidden">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm bg-primary/5 rounded-lg">
                  {user.name[0]}
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-900 truncate font-poppins">{user.name}</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <div className="text-[9px] font-semibold text-slate-400 tracking-wider">Active now</div>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center gap-4 px-4 py-3.5 bg-[#111] text-white hover:bg-black rounded-2xl transition-all duration-300 font-poppins font-bold text-sm border border-white/5 hover:border-white/10 hover:scale-[1.02] hover:shadow-xl shadow-black/20 group"
        >
          <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">logout</span>
          Logout
        </button>

        <ConfirmationModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={() => {
            setIsLogoutModalOpen(false);
            logout();
          }}
          title="Sign Out"
          message="Are you sure you want to log out from the portal?"
          confirmText="Yes, Log out"
          variant="danger"
        />
      </div>
      {pathname !== "/doctor-dashboard/profile" && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            type="button"
            onClick={() => chatWithPrakriti()}
            className="flex items-center gap-3 bg-primary-fixed border border-primary/20 shadow-2xl shadow-primary/10 rounded-full pl-1.5 pr-5 py-1.5 hover:shadow-xl hover:scale-105 transition-all group"
          >
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/10 flex-shrink-0">
              <img
                src="/Image-Assets/prakriti.png"
                alt="Prakriti AI"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold text-on-primary-fixed font-poppins leading-tight">Prakriti AI</span>
              <span className="text-[10px] font-semibold text-slate-400 leading-tight">Ask Anything</span>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
};

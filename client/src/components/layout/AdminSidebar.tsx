"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useState } from "react";

const adminNavItems = [
  { name: "Dashboard", href: "/admin", icon: "terminal" },
  { name: "Doctors", href: "/admin/doctors", icon: "medical_services" },
  { name: "Patients", href: "/admin/patients", icon: "groups" },
  { name: "Logs", href: "/admin/logs", icon: "history_edu" },
  { name: "Settings", href: "/admin/settings", icon: "settings_suggest" },
];

export const AdminSidebar = () => {
  const pathname = useLocation().pathname;
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-[#0F172A] dark:bg-surface-container border-r border-white/5 dark:border-outline-variant/10 hidden lg:flex flex-col p-6 z-40 text-slate-300 dark:text-on-surface-variant">
      <Link to="/admin" className="flex items-center gap-3 mb-10 px-2 group">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-white text-2xl">admin_panel_settings</span>
        </div>
        <div>
            <span className="text-xl font-bold text-white dark:text-on-surface font-poppins block leading-none">HealBook</span>
            <span className="text-[10px] font-bold text-primary mt-1 block font-poppins">Admin Console</span>
        </div>
      </Link>

      <div className="mb-8 px-2">
          <p className="text-[10px] font-bold text-slate-500 mb-4 opacity-60 font-poppins">System Operations</p>
          <nav className="space-y-1.5">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  to={item.href}
                  className={`
                    flex items-center gap-4 px-4 py-3 rounded-xl font-poppins font-bold text-xs transition-all
                    ${isActive 
                      ? "bg-white/10 text-white dark:bg-primary dark:text-white border border-white/10 dark:border-primary/10 shadow-xl" 
                      : "hover:bg-white/5 hover:text-white dark:hover:bg-surface-container-high dark:hover:text-on-surface border border-transparent"
                    }
                  `}
                >
                  <span className={`material-symbols-outlined text-2xl ${isActive ? "text-primary dark:text-white" : "text-white/70 dark:text-on-surface-variant group-hover:text-white dark:group-hover:text-on-surface"}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
        {user && (
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 p-0.5 border border-white/10">
                <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                    {user.name[0]}
                </div>
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white dark:text-on-surface truncate font-poppins">{user.name}</div>
              <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <div className="text-[9px] font-bold text-slate-500">System Operator</div>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center gap-4 px-4 py-3 bg-[#111] dark:bg-on-surface text-white dark:text-surface hover:bg-black dark:hover:bg-on-surface/90 rounded-xl transition-all duration-300 font-poppins font-bold text-xs border border-white/5 dark:border-outline-variant/10 hover:scale-[1.02] hover:shadow-xl shadow-black/20 dark:shadow-on-surface/10 group"
        >
          <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">power_settings_new</span>
          Logout
        </button>

        <ConfirmationModal 
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={() => {
            setIsLogoutModalOpen(false);
            logout();
          }}
          title="Exit Session"
          message="Are you sure you want to log out? Any unsaved administrative changes will be lost."
          confirmText="Logout"
          cancelText="Stay"
        />
      </div>
    </aside>
  );
};

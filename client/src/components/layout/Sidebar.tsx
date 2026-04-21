"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useState } from "react";

import { usePrakriti } from "@/context/PrakritiContext";

export const Sidebar = () => {
  const pathname = useLocation().pathname;
  const { user, logout } = useAuth();
  const { chatWithPrakriti } = usePrakriti();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const dashHref = user?.role === "doctor" ? "/doctor-dashboard" : "/dashboard";

  const navItems = [
    { name: "Dashboard", href: dashHref, icon: "dashboard" },
    { name: "Find Doctors", href: "/doctors", icon: "person_search" },
    { name: "Hospitals", href: "/hospitals", icon: "medical_services" },
    { name: "Appointments", href: "/appointments", icon: "event_note" },
    { name: "Medical Records", href: "/records", icon: "clinical_notes" },
    { name: "My Profile", href: "/profile", icon: "account_circle" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-container border-r border-outline-variant/10 hidden lg:flex flex-col p-6 z-40">
      <Link to="/" className="flex items-center gap-3 mb-10 px-2 group">
        <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">health_and_safety</span>
        <span className="text-2xl font-bold text-on-surface font-headline tracking-tighter">Heal<span className="text-primary">Book</span></span>
      </Link>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              to={item.href}
              className={`
                flex items-center gap-4 px-4 py-3.5 rounded-xl font-headline font-bold text-sm transition-all
                ${isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/10" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }
              `}
            >
              <span className={`material-symbols-outlined ${isActive ? "fill-1" : ""}`}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
        
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/10 space-y-4">
        {user && (
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-fixed overflow-hidden border-2 border-white shadow-sm">
                {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                        {user.name[0]}
                    </div>
                )}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-on-surface truncate font-headline">{user.name}</div>
              <div className="text-[10px] font-bold text-primary tracking-widest">{user.role}</div>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center gap-4 px-4 py-3 bg-on-surface text-surface hover:bg-on-surface/90 rounded-xl transition-all duration-300 font-headline font-bold text-sm border border-outline-variant/10 hover:scale-[1.02] hover:shadow-xl shadow-on-surface/10 group"
        >
          <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">logout</span>
          Logout
        </button>

        <ConfirmationModal 
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={() => {
            setIsLogoutModalOpen(false);
            logout();
          }}
          title="Safe Exit"
          message={`Are you sure you want to log out of your ${user?.role || 'user'} account? You'll need to sign back in to access your clinical data.`}
          confirmText="Logout"
          cancelText="Stay"
        />
      </div>
    </aside>
  );
};

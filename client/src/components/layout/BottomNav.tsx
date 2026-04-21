"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const BottomNav = () => {
  const pathname = useLocation().pathname;
  const { user } = useAuth();
  const dashHref = user?.role === "doctor" ? "/doctor-dashboard" : "/dashboard";

  const mainItems = [
    { name: "Home", href: dashHref, icon: "home" },
    { name: "Doctors", href: "/doctors", icon: "person_search" },
    { name: "Symptoms", href: "/symptoms", icon: "neurology", center: true },
    { name: "Records", href: "/records", icon: "clinical_notes" },
    { name: "Profile", href: "/profile", icon: "account_circle" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-outline-variant/10 h-20 lg:hidden flex items-center justify-around px-4 pb-2 z-40">
      {mainItems.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.center) {
            return (
                <Link 
                    key={item.href}
                    to={item.href}
                    className="relative -top-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center transition-transform active:scale-90"
                >
                    <span className="material-symbols-outlined text-2xl fill-1">{item.icon}</span>
                </Link>
            );
        }

        return (
          <Link 
            key={item.href}
            to={item.href} 
            className={`flex flex-col items-center gap-1 transition-all ${isActive ? "text-primary" : "text-on-surface-variant"}`}
          >
            <span className={`material-symbols-outlined text-2xl ${isActive ? "fill-1" : ""}`}>
              {item.icon}
            </span>
            <span className="text-[10px] font-bold font-headline uppercase tracking-tighter">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

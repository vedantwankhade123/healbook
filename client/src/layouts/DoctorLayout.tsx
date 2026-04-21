"use client";

import React, { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { DoctorSidebar } from "@/components/layout/DoctorSidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { NotificationHub } from "@/components/notifications/NotificationHub";
import { usePrakriti } from "@/context/PrakritiContext";

export function DoctorLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { chatWithPrakriti } = usePrakriti();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const doctorNavItems = [
    { name: "My Summary", href: "/doctor-dashboard", icon: "dashboard" },
    { name: "My Patients", href: "/doctor-dashboard/patients", icon: "groups" },
    { name: "My Schedule", href: "/doctor-dashboard/schedule", icon: "calendar_today" },
    { name: "Patient Records", href: "/doctor-dashboard/records", icon: "clinical_notes" },
    { name: "My Profile", href: "/doctor-dashboard/profile", icon: "account_circle" },
  ];

  return (
    <AuthGuard requiredRole="doctor">
      <div className="min-h-screen bg-surface flex">
        <DoctorSidebar />
        <main className="flex-1 lg:ml-72 min-h-screen relative">
          <div className="lg:hidden h-16 px-6 bg-white border-b border-outline-variant/10 flex items-center justify-between sticky top-0 z-40">
            <Link to="/doctor-dashboard" className="text-xl font-black text-primary font-headline tracking-tighter">HealBook</Link>
            <div className="flex items-center gap-4">
              <div className="relative flex items-center">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="text-on-surface-variant flex items-center relative hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationHub
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                  className="fixed top-20 inset-x-4 md:absolute md:top-12 md:right-0 md:left-auto md:w-[420px] md:origin-top-right"
                />
              </div>
              <Link to="/doctor-dashboard/profile" className="w-8 h-8 rounded-full bg-primary-fixed overflow-hidden flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm hover:scale-105 transition-transform">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user?.name || "Doctor"} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0] || "D"
                )}
              </Link>
              <div className="relative">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-on-surface-variant flex items-center hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[26px]">more_vert</span>
                </button>
                {isMobileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute top-10 right-0 z-50 w-56 bg-surface rounded-2xl shadow-xl shadow-primary/5 border border-outline-variant/10 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                      <nav className="flex flex-col py-2">
                        {doctorNavItems.map((item) => {
                          const isActive = location.pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`
                                flex items-center gap-3 px-4 py-3 font-headline font-semibold text-sm transition-colors
                                ${isActive ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container"}
                              `}
                            >
                              <span className={`material-symbols-outlined text-[20px] ${isActive ? "fill-1" : ""}`}>
                                {item.icon}
                              </span>
                              {item.name}
                            </Link>
                          );
                        })}
                        <div className="mx-4 my-2 border-t border-outline-variant/10"></div>
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-error hover:bg-error/10 transition-colors font-headline font-semibold text-sm w-full text-left"
                        >
                          <span className="material-symbols-outlined text-[20px]">logout</span>
                          Logout
                        </button>
                      </nav>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {location.pathname !== "/doctor-dashboard/profile" && (
          <div className="fixed bottom-6 right-4 lg:hidden z-50">
            <button
              type="button"
              onClick={() => chatWithPrakriti()}
              className="flex items-center gap-2.5 bg-primary-fixed border border-primary/20 shadow-2xl shadow-primary/10 rounded-full pl-1.5 pr-4 py-1.5 hover:shadow-xl hover:scale-105 transition-all group"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/10 flex-shrink-0">
                <img
                  src="/Image-Assets/prakriti.png"
                  alt="Prakriti AI"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-bold text-on-surface font-headline leading-tight">Prakriti AI</span>
                <span className="text-[10px] font-semibold text-on-surface-variant leading-tight">Ask Anything</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

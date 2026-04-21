"use client";

import React, { useState } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { usePrakriti } from "@/context/PrakritiContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { NotificationHub } from "@/components/notifications/NotificationHub";

export function MainLayout() {
  const { chatWithPrakriti } = usePrakriti();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const isProfilePage = location.pathname === "/profile";
  const isBookingPage = location.pathname.includes("/appointments/book/");
  
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
    <AuthGuard>
      <div className="min-h-screen bg-surface flex">
        <Sidebar />

        <main className="flex-1 lg:ml-72 pb-24 lg:pb-0 min-h-screen relative">
          <div className="lg:hidden h-16 px-6 bg-white border-b border-outline-variant/10 flex items-center justify-between sticky top-0 z-40">
            <Link to="/" className="text-xl font-black text-primary font-headline tracking-tighter">HealBook</Link>
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
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationHub 
                  isOpen={isNotificationsOpen} 
                  onClose={() => setIsNotificationsOpen(false)} 
                  className="fixed top-20 inset-x-4 md:absolute md:top-12 md:right-0 md:left-auto md:w-[420px] md:origin-top-right"
                />
              </div>
              <Link to="/profile" className="w-8 h-8 rounded-full bg-primary-fixed overflow-hidden flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm hover:scale-105 transition-transform">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user?.name || "User"} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0] || "?"
                )}
              </Link>
              <div className="relative">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-on-surface-variant flex items-center hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[26px]">more_vert</span>
                </button>
                {isMobileMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute top-10 right-0 z-50 w-56 bg-surface rounded-2xl shadow-xl shadow-primary/5 border border-outline-variant/10 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                      <nav className="flex flex-col py-2">
                        {navItems.map((item) => {
                          const isActive = location.pathname === item.href;
                          return (
                            <Link 
                              key={item.href}
                              to={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`
                                flex items-center gap-3 px-4 py-3 font-headline font-semibold text-sm transition-colors
                                ${isActive 
                                  ? "bg-primary/10 text-primary" 
                                  : "text-on-surface hover:bg-surface-container"
                                }
                              `}
                            >
                              <span className={`material-symbols-outlined text-[20px] ${isActive ? "fill-1" : ""}`}>
                                {item.icon}
                              </span>
                              {item.name}
                            </Link>
                          )
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

          <div className="pt-2 pb-8 md:pt-4 md:pb-12 lg:pt-6 lg:pb-16 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>


        {!isProfilePage && (
          <div className={`fixed bottom-8 right-8 z-50 ${isBookingPage ? "hidden lg:block" : "block"}`}>
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
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-bold text-on-surface font-headline leading-tight">Prakriti AI</span>
                <span className="text-[10px] font-semibold text-on-surface-variant leading-tight">Ask Anything</span>
              </div>
            </button>
          </div>
        )}


      </div>
    </AuthGuard>
  );
}

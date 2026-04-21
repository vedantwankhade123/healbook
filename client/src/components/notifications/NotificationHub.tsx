"use client";

import React, { useRef, useEffect } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import { safeParseDate } from "@/lib/date-utils";

interface NotificationHubProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const NotificationHub = ({ isOpen, onClose, className }: NotificationHubProps) => {
  const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // We no longer return null here to allow for closing animations
  // Instead, we use CSS classes for visibility and opacity

  return (
    <div 
      ref={dropdownRef}
      className={`absolute z-[100] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        isOpen 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      } ${className || "top-full right-0 md:right-0 mt-4 w-[calc(100vw-2rem)] md:w-[420px] origin-top-right"}`}
    >
      <Card className="p-0 overflow-hidden bg-surface-container backdrop-blur-2xl border border-outline-variant/30 shadow-[0_25px_70px_rgba(0,0,0,0.1)] rounded-[2rem] md:rounded-[2.5rem]">
        <div className="p-5 md:p-8 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/50">
          <div>
            <h3 className="text-2xl font-bold font-poppins text-on-surface tracking-tight">Activity hub</h3>
            <p className="text-[11px] font-medium text-primary mt-1">Clinical updates and alerts</p>
          </div>
          <button 
            onClick={markAllAsRead}
            className="text-[11px] font-bold text-on-surface-variant hover:text-primary transition-all px-4 py-2 rounded-xl hover:bg-surface-container-high border border-outline-variant/10"
          >
            Clear all
          </button>
        </div>

        <div className="max-h-[450px] overflow-y-auto slim-scrollbar">
          {loading ? (
            <div className="p-14 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-outline-variant/10 border-t-primary rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-on-surface-variant tracking-wider">Updating activity...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-outline-variant/10">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-6 hover:bg-surface-container-high/50 transition-all cursor-pointer group relative ${!n.read ? "bg-primary/[0.02]" : ""}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container-lowest flex-shrink-0 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all overflow-hidden relative border border-outline-variant/10 shadow-sm">
                        <span className="material-symbols-outlined text-3xl">
                          {n.type === "appointment"
                            ? "event_note"
                            : n.type === "cancellation"
                              ? "cancel"
                              : n.type === "payment"
                                ? "payments"
                                : "notifications"}
                        </span>
                        {!n.read && <span className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full ring-2 ring-surface-container shadow-sm animate-pulse"></span>}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-base font-bold font-poppins leading-tight ${!n.read ? "text-on-surface" : "text-on-surface-variant/70"}`}>
                          {n.title}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap pt-0.5">
                          {formatDistanceToNow(safeParseDate(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed font-medium mt-1 group-hover:text-on-surface transition-colors">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6 border border-outline-variant/10">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">notifications_off</span>
              </div>
              <p className="text-lg font-bold text-on-surface font-poppins">All caught up!</p>
              <p className="text-xs text-on-surface-variant font-bold tracking-wide mt-2">No new clinical alerts at the moment</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-lowest/30">
            <Button variant="ghost" className="w-full text-xs font-bold tracking-wider text-on-surface-variant hover:text-primary hover:bg-primary/5 h-12 rounded-2xl transition-all">
                View all history
            </Button>
        </div>
      </Card>
    </div>
  );
};

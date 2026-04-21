"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Notification } from "@/types";
import { apiFetch, apiJson } from "@/lib/api";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const prevIds = useRef<Set<string>>(new Set());
  const isFirst = useRef(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      prevIds.current = new Set();
      isFirst.current = true;
      return;
    }

    const load = async (showToastsForNew: boolean) => {
      try {
        const list = await apiJson<Notification[]>("/api/notifications");
        if (showToastsForNew && !isFirst.current) {
          const newOnes = list.filter((n) => !n.read && !prevIds.current.has(n.id));
          newOnes.forEach((n) => {
            toast(`${n.title}: ${n.message}`, { duration: 8000 });
          });
        }
        prevIds.current = new Set(list.map((n) => n.id));
        isFirst.current = false;
        setNotifications(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    void load(true);
    const id = setInterval(() => void load(true), 15000);
    return () => clearInterval(id);
  }, [user, user?.uid]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const list = await apiJson<Notification[]>("/api/notifications");
      prevIds.current = new Set(list.map((n) => n.id));
      setNotifications(list);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      await apiFetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await apiFetch("/api/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications, loading }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};

"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export function AdminLayout() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <AdminSidebar />
        <main className="flex-1 lg:ml-72 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </AuthGuard>
  );
}

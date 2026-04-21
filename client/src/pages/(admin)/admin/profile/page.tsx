"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfoField } from "@/components/profile/ProfileInfoField";
import { Card } from "@/components/ui/Card";

export default function AdminProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <ProfileHeader 
        name={user.name} 
        role="System Administrator" 
        photo={user.profilePhoto}
        onEdit={() => console.log("Edit admin credentials")}
        gradient="bg-gradient-royal"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">
          <section>
            <h2 className="text-2xl font-bold font-poppins text-slate-800 tracking-tight flex items-center gap-3 mb-8">
                <span className="w-2 h-8 bg-slate-900 rounded-full"></span>
                System operator credentials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileInfoField label="Admin name" value={user.name} icon="terminal" />
              <ProfileInfoField label="Operational email" value={user.email} icon="shield" />
              <ProfileInfoField label="Access level" value="Root (Developer)" icon="key" />
              <ProfileInfoField label="Status" value="Verified operator" icon="check_circle" />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold font-poppins text-slate-800 tracking-tight flex items-center gap-3 mb-8">
                <span className="w-2 h-8 bg-slate-400 rounded-full"></span>
                Permission overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500">task_alt</span>
                    <span className="text-xs font-bold text-slate-700">User Audit</span>
                </div>
                <div className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500">task_alt</span>
                    <span className="text-xs font-bold text-slate-700">Doctor Verification</span>
                </div>
                <div className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500">task_alt</span>
                    <span className="text-xs font-bold text-slate-700">System Logs</span>
                </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <h2 className="text-lg font-bold text-slate-500 tracking-wide font-poppins mb-6">Administrative security</h2>
          <Card className="p-8 bg-slate-900 border-none rounded-[2.5rem] text-white shadow-xl">
            <h4 className="text-xl font-bold font-poppins mb-1">Access protocols</h4>
            <p className="text-xs text-slate-400 mb-8 font-bold">Protocol strictness</p>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">2FA Status</span>
                    <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full font-bold">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">IP Lockdown</span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-bold">Warning</span>
                </div>
            </div>
            <button className="w-full mt-8 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs transition-all hover:bg-slate-100 shadow-xl">
              Security audit
            </button>
          </Card>

          <Card variant="flat" className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-center">
              <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-2">Join date</h4>
              <p className="text-base font-bold text-slate-900">{user.createdAt ? "Active for 1 year" : "New Operator"}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

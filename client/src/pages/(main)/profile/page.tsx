"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfoField } from "@/components/profile/ProfileInfoField";
import { Card } from "@/components/ui/Card";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PatientProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ appointments: 0, medicalFiles: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const apptQuery = query(collection(db, "appointments"), where("patientId", "==", user.uid));
        const recordsQuery = query(collection(db, "medical_records"), where("userId", "==", user.uid));
        
        const [apptSnapshot, recordsSnapshot] = await Promise.all([
          getCountFromServer(apptQuery),
          getCountFromServer(recordsQuery)
        ]);

        setStats({
          appointments: apptSnapshot.data().count,
          medicalFiles: recordsSnapshot.data().count
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <ProfileHeader 
        name={user.name} 
        role="Patient" 
        photo={user.profilePhoto}
        gradient="bg-gradient-emerald"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold font-poppins text-slate-800 tracking-tight flex items-center gap-3 mb-8">
                <span className="w-2 h-8 bg-primary rounded-full"></span>
                Personal information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileInfoField label="Full name" value={user.name} icon="person" />
              <ProfileInfoField label="Email address" value={user.email} icon="mail" />
              <ProfileInfoField label="Phone number" value={user.phoneNumber || "+91 — — — — —"} icon="call" />
              <ProfileInfoField label="Account role" value="Health seeker (Patient)" icon="shield_person" />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold font-poppins text-slate-800 tracking-tight flex items-center gap-3 mb-8">
                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                Health hub overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card variant="flat" className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">event_note</span>
                </div>
                <h3 className="text-3xl font-bold font-poppins text-slate-900">
                  {loadingStats ? "..." : stats.appointments.toString().padStart(2, '0')}
                </h3>
                <p className="text-xs font-bold text-slate-500 tracking-wider">Total appointments</p>
              </Card>
              <Card variant="flat" className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-white text-blue-500 flex items-center justify-center mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">clinical_notes</span>
                </div>
                <h3 className="text-3xl font-bold font-poppins text-slate-900">
                  {loadingStats ? "..." : stats.medicalFiles.toString().padStart(2, '0')}
                </h3>
                <p className="text-xs font-bold text-slate-500 tracking-wider">Medical files</p>
              </Card>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <h2 className="text-lg font-bold text-slate-500 tracking-wide font-poppins mb-6">Security</h2>
          <Card className="p-8 bg-slate-900 border-none rounded-[2.5rem] text-white shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <h4 className="text-xl font-bold font-poppins mb-2">Account password</h4>
            <p className="text-sm text-slate-400 mb-8 font-medium">Keep your account secure by using a strong, unique password.</p>
            <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all border border-white/5">
              Change password
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

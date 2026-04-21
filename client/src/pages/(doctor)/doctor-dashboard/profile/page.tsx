"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfoField } from "@/components/profile/ProfileInfoField";
import { Card } from "@/components/ui/Card";
import { Doctor } from "@/types";

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [doctorData, setDoctorData] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "doctors"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setDoctorData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Doctor);
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <ProfileHeader 
        name={user.name} 
        role="Medical Practitioner" 
        photo={user.profilePhoto}
        gradient="bg-gradient-ocean"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">
          <section>
            <h2 className="text-2xl font-bold font-poppins text-slate-800 tracking-tight flex items-center gap-3 mb-8">
                <span className="w-2 h-8 bg-primary rounded-full"></span>
                Professional background
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileInfoField label="Specialization" value={doctorData?.specialization} icon="medical_services" />
              <ProfileInfoField label="Experience" value={`${doctorData?.experience || 0} years`} icon="history" />
              <ProfileInfoField label="Clinic Name" value={doctorData?.clinicName} icon="home_health" />
              <ProfileInfoField label="Consultation Fee" value={doctorData?.consultationFee ? `₹${doctorData.consultationFee}` : "Free"} icon="payments" />
            </div>
            {doctorData?.bio ? (
              <Card variant="flat" className="mt-6 p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
                <p className="text-xs font-bold text-slate-500 tracking-wider leading-none mb-4">Professional bio</p>
                <p className="text-base font-medium text-slate-700 leading-relaxed font-poppins uppercase translate-y-[-0.1em] pointer-events-none select-none opacity-0 absolute">hidden</p>
                <p className="text-base font-medium text-slate-700 leading-relaxed">{doctorData.bio}</p>
              </Card>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center p-10 bg-slate-50 border border-slate-200 border-dashed rounded-[2.5rem] w-full text-center">
                  <span className="material-symbols-outlined text-slate-300 text-5xl mb-3">account_circle</span>
                  <p className="text-base font-bold text-slate-500 font-poppins">No professional bio added yet</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold font-poppins text-slate-800 tracking-tight flex items-center gap-3 mb-8">
                <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                Expertise & treats
            </h2>
            <div className="flex flex-wrap gap-2">
                {doctorData?.treats && doctorData.treats.length > 0 ? (
                    doctorData.treats.map((item, idx) => (
                        <span key={idx} className="px-5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-sm font-bold font-poppins shadow-sm">
                            {item}
                        </span>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center p-10 bg-slate-50 border border-slate-200 border-dashed rounded-[2.5rem] w-full text-center">
                        <span className="material-symbols-outlined text-slate-300 text-5xl mb-3">medical_services</span>
                        <p className="text-base font-bold text-slate-500 font-poppins">No expertise areas listed yet</p>
                    </div>
                )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-bold text-slate-500 tracking-wide mb-6 font-poppins">Clinical stats</h3>
            <div className="space-y-4">
                <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="material-symbols-outlined text-amber-400 text-3xl fill-1">star</span>
                        <span className="text-2xl font-bold text-slate-900">{doctorData?.rating || "4.8"}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 tracking-wider">Patient rating</p>
                </div>
                <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="material-symbols-outlined text-blue-500 text-3xl">groups</span>
                        <span className="text-2xl font-bold text-slate-900">{doctorData?.reviewsCount || "120"}+</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 tracking-wider">Consultations</p>
                </div>
            </div>
          </section>

          <Card className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-[100px] text-primary">schedule</span>
            </div>
            <div className="relative z-10">
                <h4 className="text-2xl font-bold font-poppins text-slate-900 tracking-tight mb-1">Clinic hours</h4>
                <p className="text-[10px] text-primary font-bold tracking-widest uppercase mb-8">Standard schedule</p>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Mon - Fri</p>
                            <p className="text-sm font-bold text-slate-700">09:00 AM - 05:00 PM</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <span className="material-symbols-outlined text-lg">weekend</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Saturday</p>
                            <p className="text-sm font-bold text-slate-700">10:00 AM - 02:00 PM</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                            <span className="material-symbols-outlined text-lg">event_busy</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sunday</p>
                            <p className="text-sm font-bold text-slate-400 italic">Clinic Closed</p>
                        </div>
                    </div>
                </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

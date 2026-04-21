"use client";

import React, { useState, useEffect, Suspense } from "react";
import { collection, query, where, getDocs, orderBy, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MedicalRecord } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSearchParams } from "react-router-dom";

function PatientFilesContent() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetPatientId = searchParams.get("patientId");
  
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<Record<string, { name: string; email: string; photo?: string }>>({});

  useEffect(() => {
    const fetchPatientFiles = async () => {
      if (!user) return;
      try {
        // 1. Find the clinical doctor profile linked to this user UID
        const doctorQuery = query(
          collection(db, "doctors"),
          where("userId", "==", user.uid)
        );
        const doctorSnapshot = await getDocs(doctorQuery);
        
        if (doctorSnapshot.empty) {
          console.warn("No clinical doctor profile found for this user");
          setLoading(false);
          return;
        }

        const clinicalDoctorId = doctorSnapshot.docs[0].id;

        // 2. Get all unique patients from appointments to build our roster
        const apptQuery = query(
          collection(db, "appointments"),
          where("doctorId", "==", clinicalDoctorId)
        );
        const apptSnapshot = await getDocs(apptQuery);
        const uniquePatientIds = Array.from(new Set(apptSnapshot.docs.map(doc => doc.data().patientId)));

        if (uniquePatientIds.length === 0) {
          setRecords([]);
          setLoading(false);
          return;
        }

        // 2. Fetch User metadata (names, emails, photos) for these patients
        const patientsInfo: Record<string, { name: string; email: string; photo?: string }> = {};
        for (let i = 0; i < uniquePatientIds.length; i += 30) {
            const chunk = uniquePatientIds.slice(i, i + 30);
            const userQuery = query(
                collection(db, "users"),
                where(documentId(), "in", chunk)
            );
            const userSnapshot = await getDocs(userQuery);
            userSnapshot.docs.forEach(doc => {
                const data = doc.data();
                patientsInfo[doc.id] = { 
                  name: data.name, 
                  email: data.email,
                  photo: data.profilePhoto 
                };
            });
        }
        setPatientData(patientsInfo as any);

        // 3. Filter IDs based on targetPatientId param
        const filteredIds = targetPatientId ? [targetPatientId] : uniquePatientIds;
        
        if (targetPatientId && !uniquePatientIds.includes(targetPatientId)) {
          setRecords([]);
          setLoading(false);
          return;
        }

        // 4. Fetch records for these isolated patients
        const recordsData: MedicalRecord[] = [];
        for (let i = 0; i < filteredIds.length; i += 30) {
            const chunk = filteredIds.slice(i, i + 30);
            const recordsQuery = query(
                collection(db, "medical_records"),
                where("userId", "in", chunk),
                orderBy("createdAt", "desc")
            );
            const recordsSnapshot = await getDocs(recordsQuery);
            recordsData.push(...recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord)));
        }
        
        setRecords(recordsData);
      } catch (error) {
        console.error("Error fetching patient files:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientFiles();
  }, [user, targetPatientId]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 font-poppins tracking-tighter mb-2">
              Clinical <span className="text-primary font-medium">archives</span>
          </h1>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-44 bg-slate-50 animate-pulse rounded-[2rem] border border-slate-100" />)
        ) : records.length > 0 ? (
          records.map((record) => (
            <Card key={record.id} variant="outline" className="p-0 overflow-hidden bg-gradient-to-br from-white via-white to-primary/10 border-slate-100 hover:border-primary/20 transition-all rounded-2xl sm:rounded-[2rem] group relative shadow-sm cursor-default">
              {/* Sync with Patient Profile Card Design */}
              <div className="flex flex-col sm:flex-row items-stretch h-full min-h-[170px] w-full">
                {/* Left - Portrait Sidebar (Match Patients Page) */}
                <div className="w-full sm:w-48 min-h-[120px] sm:min-h-0 bg-sky-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100/80 transition-colors relative py-4 sm:py-0">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white shadow-xl border-4 sm:border-[6px] border-white overflow-hidden group-hover:scale-105 transition-transform flex items-center justify-center relative">
                        {patientData[record.userId]?.photo ? (
                            <img src={(patientData[record.userId] as any).photo} alt="Patient" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary text-xl sm:text-3xl font-bold bg-primary/5">
                                {(patientData[record.userId]?.name || 'P')[0]}
                            </div>
                        )}
                    </div>
                    {/* Small Record Type Overlay */}
                    <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/80 backdrop-blur-md shadow-sm border border-white/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-lg">
                            {record.type === 'prescription' ? 'prescriptions' : 'folder_open'}
                        </span>
                    </div>
                </div>

                {/* Right - Content Area */}
                <div className="flex-1 p-4 sm:p-7 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold font-poppins text-slate-900 leading-tight mb-1 truncate">
                          {patientData[record.userId]?.name || 'Patient Profile'}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 font-bold truncate tracking-tight lowercase">
                          {patientData[record.userId]?.email?.toLowerCase() || 'Private Identity'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/5 text-primary font-bold tracking-widest text-[8px] border-none uppercase py-1 px-3 sm:px-4 rounded-full flex-shrink-0">
                        {record.type.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <div className="h-px bg-slate-100 w-full mt-3 sm:mt-4" />
                        <div>
                            <h3 className="text-sm sm:text-base font-bold font-poppins text-slate-800 truncate mb-1">{record.title}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold tracking-wide">
                                <span className="material-symbols-outlined text-xs">event</span>
                                Available since {record.date}
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-3 pt-4 mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-9 sm:h-10 rounded-xl text-[10px] font-bold tracking-widest bg-white border-slate-200 text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
                      onClick={() => window.open(record.fileUrl, '_blank')}
                    >
                      PREVIEW FILE
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
                      title="Download"
                      onClick={() => window.open(record.fileUrl, '_blank')}
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">folder_shared</span>
            <h3 className="text-lg font-bold text-slate-800">No medical files found</h3>
            <p className="text-sm text-slate-500 mt-2">Try choosing a different patient or sync your records.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientFilesPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-poppins font-semibold text-slate-400 tracking-widest animate-pulse">Loading archives...</div>}>
      <PatientFilesContent />
    </Suspense>
  );
}

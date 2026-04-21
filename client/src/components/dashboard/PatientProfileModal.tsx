"use client";

import React, { useState, useEffect } from "react";
import { User, Appointment, MedicalRecord } from "@/types";
import { Card } from "@/components/ui/Card";
import { safeParseDate } from "@/lib/date-utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { apiJson } from "@/lib/api";

interface PatientProfileModalProps {
  patient: User;
  appointments: Appointment[];
  onClose: () => void;
  getStatusVariant: (status: string) => any;
  getStatusLabel: (apt: Appointment) => string;
}

export const PatientProfileModal = ({ 
  patient, 
  appointments, 
  onClose,
  getStatusVariant,
  getStatusLabel
}: PatientProfileModalProps) => {

  const [tab, setTab] = useState<'history' | 'files'>('history');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Fetch medical records when the "files" tab is selected
  useEffect(() => {
    if (tab !== 'files' || records.length > 0) return;
    const fetchRecords = async () => {
      setLoadingRecords(true);
      try {
        const list = await apiJson<MedicalRecord[]>(
          `/api/medical-records?userId=${encodeURIComponent(patient.uid)}`,
        );
        setRecords(list);
      } catch (err) {
        console.error("Error fetching records:", err);
      } finally {
        setLoadingRecords(false);
      }
    };
    fetchRecords();
  }, [tab, patient.uid]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <Card className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-white rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-8 flex flex-col items-center flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2rem] bg-white shadow-xl border-4 border-white overflow-hidden mb-3 sm:mb-4">
                {patient.profilePhoto ? (
                    <img src={patient.profilePhoto} alt={patient.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary text-3xl font-bold bg-primary/5">
                        {patient.name[0]}
                    </div>
                )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-poppins tracking-tight mb-1 text-center">{patient.name}</h2>
            <div className="flex items-center gap-2 flex-wrap justify-center text-center">
                <span className="text-[11px] sm:text-xs font-medium text-slate-400 break-all">{patient.email}</span>
                {patient.phoneNumber && (
                    <>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[11px] sm:text-xs font-bold text-primary">{patient.phoneNumber}</span>
                    </>
                )}
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Visits</p>
                    <p className="text-lg font-bold text-slate-900">{appointments.length}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Visit</p>
                    <p className="text-xs font-bold text-slate-900">{appointments[0]?.date || "N/A"}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
                    <p className="text-xs font-bold text-slate-900">{patient.createdAt ? format(safeParseDate(patient.createdAt), "MMM yyyy") : "N/A"}</p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                    onClick={() => setTab('history')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${tab === 'history' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Clinical History
                </button>
                <button 
                    onClick={() => setTab('files')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${tab === 'files' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Medical Files
                </button>
            </div>

            {/* Tab Content */}
            {tab === 'history' ? (
                <div className="space-y-3">
                    {appointments.length > 0 ? appointments.map((apt) => (
                        <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4 bg-white border border-slate-100 rounded-xl hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400 text-base">
                                        {apt.visitType === 'video' ? 'videocam' : 'location_on'}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900">{apt.date} · {apt.time}</p>
                                    <p className="text-[10px] text-slate-400 font-medium italic truncate">{apt.reason || "General checkup"}</p>
                                </div>
                            </div>
                            <Badge 
                                variant={getStatusVariant(getStatusLabel(apt))}
                                className={`text-[8px] font-bold tracking-wider border-none w-fit ${
                                    getStatusLabel(apt) === 'Expired' ? 'bg-amber-50 text-amber-600' : ''
                                }`}
                            >
                                {getStatusLabel(apt)}
                            </Badge>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-slate-400 text-xs italic">No past appointments found.</div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {loadingRecords ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl" />)}
                        </div>
                    ) : records.length > 0 ? records.map((rec) => (
                        <div key={rec.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4 bg-white border border-slate-100 rounded-xl hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-base">description</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">{rec.title || rec.type || "Medical Record"}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{rec.date || "No date"}</p>
                                </div>
                            </div>
                            {rec.fileUrl && (
                                <a href={rec.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="sm" className="text-[10px] font-bold text-primary hover:bg-primary/5 rounded-lg h-8 px-3">
                                        View
                                    </Button>
                                </a>
                            )}
                        </div>
                    )) : (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">folder_off</span>
                            <p className="text-slate-400 text-xs italic">No medical files uploaded yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 transition-all shadow-sm"
        >
            <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </Card>
    </div>
  );
};

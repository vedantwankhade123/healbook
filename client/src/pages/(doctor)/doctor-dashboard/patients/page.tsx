"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { User, Appointment } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Link } from "react-router-dom";
import { format, isAfter, parse } from "date-fns";
import { safeParseDate } from "@/lib/date-utils";
import { PatientProfileModal } from "@/components/dashboard/PatientProfileModal";

export default function MyPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const getStatusLabel = (appointment: Appointment) => {
    if (appointment.status === 'completed') return 'Appointment Done';
    if (appointment.status === 'cancelled') return 'Cancelled';
    if (appointment.status === 'expired') return 'Expired';

    const appointmentDateTime = parse(`${appointment.date} ${appointment.time}`, "yyyy-MM-dd hh:mm a", new Date());
    const isPast = isAfter(new Date(), appointmentDateTime);
    
    // Fallback date-based expired detection
    if ((appointment.status === 'confirmed' || appointment.status === 'pending') && isPast && appointment.date !== todayStr) {
        return 'Expired';
    }

    switch (appointment.status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      default: return (appointment.status as string).charAt(0).toUpperCase() + (appointment.status as string).slice(1);
    }
  };

  const getStatusVariant = (statusLabel: string) => {
    switch (statusLabel) {
        case 'Appointment Done': return 'secondary';
        case 'Cancelled': return 'error';
        case 'Expired': return 'neutral';
        case 'Confirmed': return 'primary';
        case 'Pending': return 'secondary';
        default: return 'primary';
    }
  }

  useEffect(() => {
    const fetchMyPatients = async () => {
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

        // 2. Get all appointments for this doctor using mapped ID
        const apptQuery = query(
          collection(db, "appointments"),
          where("doctorId", "==", clinicalDoctorId)
        );
        const apptSnapshot = await getDocs(apptQuery);
        const fetchedAppts = apptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        
        // Sort locally by date desc
        fetchedAppts.sort((a, b) => {
            const dateA = safeParseDate(a.createdAt).getTime();
            const dateB = safeParseDate(b.createdAt).getTime();
            return dateB - dateA;
        });
        setAppointments(fetchedAppts);
        
        // 2. Extract unique patient IDs
        const patientIds = Array.from(new Set(apptSnapshot.docs.map(doc => doc.data().patientId)));
        
        if (patientIds.length === 0) {
          setPatients([]);
          setLoading(false);
          return;
        }

        // 3. Fetch user profiles for these patients (in chunks of 10 if necessary, but assume small set for now)
        // Firestore 'in' query supports up to 30 values
        const patientsData: User[] = [];
        for (let i = 0; i < patientIds.length; i += 30) {
            const chunk = patientIds.slice(i, i + 30);
            const userQuery = query(
                collection(db, "users"),
                where(documentId(), "in", chunk)
            );
            const userSnapshot = await getDocs(userQuery);
            patientsData.push(...userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
        }
        
        setPatients(patientsData);
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPatients();
  }, [user]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <section>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 font-poppins tracking-tighter mb-2">
            My <span className="text-primary font-medium">patients</span>
        </h1>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-44 bg-slate-50 animate-pulse rounded-[2rem]" />)
        ) : patients.length > 0 ? (
          patients.map((patient) => {
            const patientAppts = appointments.filter(a => a.patientId === patient.uid);
            const latestAppt = patientAppts[0];
            const statusLabel = latestAppt ? getStatusLabel(latestAppt) : null;

            return (
                <Card 
                  key={patient.uid} 
                  variant="outline" 
                  className="bg-gradient-to-br from-white via-white to-primary/10 border-slate-100 hover:border-primary/20 transition-all rounded-2xl sm:rounded-[2rem] group relative overflow-hidden cursor-pointer shadow-sm"
                  onClick={() => { setSelectedPatient(patient); setIsProfileModalOpen(true); }}
                >
                  {/* Credit Card Layout */}
                  <div className="flex items-stretch">
                    {/* Match Reference Image Design */}
                    <div className="flex flex-col sm:flex-row items-stretch h-full min-h-[170px] w-full">
                      {/* Optimized Left Sidebar - Large & Light Blue */}
                      <div className="w-full sm:w-48 min-h-[120px] sm:min-h-0 bg-sky-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100/80 transition-colors py-4 sm:py-0">
                        <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-white shadow-2xl border-4 sm:border-[6px] border-white overflow-hidden group-hover:scale-105 transition-transform flex items-center justify-center relative">
                          {patient.profilePhoto ? (
                            <img src={patient.profilePhoto} alt={patient.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary text-xl sm:text-3xl font-bold bg-primary/5">
                              {patient.name[0]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right - Info Area */}
                      <div className="flex-1 p-4 sm:p-7 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                                <h3 className="text-lg sm:text-xl font-bold font-poppins text-slate-900 leading-tight mb-1 truncate">{patient.name}</h3>
                                <p className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-tight uppercase truncate">{patient.email}</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-2xl">arrow_forward</span>
                          </div>
                        </div>

                        <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-0">
                            <div className="h-px bg-slate-100 w-full" />
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                                {statusLabel && (
                                    <Badge 
                                      variant={getStatusVariant(statusLabel)}
                                      className={`text-[9px] font-bold tracking-wider py-1 px-4 border-none rounded-full ${
                                        statusLabel === 'Confirmed' || statusLabel === 'Pending' 
                                        ? 'bg-blue-100 text-blue-600' 
                                        : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      {statusLabel}
                                    </Badge>
                                )}
                                <span className="text-xs font-bold text-slate-500 truncate">{latestAppt?.date || 'No Date'}</span>
                              </div>
                              <span className="text-xs font-bold text-slate-400">{patientAppts.length} visit{patientAppts.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">person_off</span>
            <h3 className="text-lg font-bold text-slate-800">No patients yet</h3>
            <p className="text-sm text-slate-500 mt-2">When someone books a meeting, they will show up here.</p>
          </div>
        )}
      </div>

      {selectedPatient && isProfileModalOpen && (
        <PatientProfileModal 
            patient={selectedPatient}
            appointments={appointments.filter(a => a.patientId === selectedPatient.uid)}
            onClose={() => setIsProfileModalOpen(false)}
            getStatusLabel={getStatusLabel}
            getStatusVariant={getStatusVariant}
        />
      )}
    </div>
  );
}

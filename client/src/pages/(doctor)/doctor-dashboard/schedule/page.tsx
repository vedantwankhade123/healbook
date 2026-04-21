"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, updateDoc, doc, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { RescheduleModal } from "@/components/appointments/RescheduleModal";
import { useToast } from "@/context/ToastContext";
import { format, parse, isAfter } from "date-fns";

export default function AppointmentManagementPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const getStatusLabel = (appointment: Appointment) => {
    if (appointment.status === 'completed') return 'Appointment Done';
    if (appointment.status === 'cancelled') return 'Cancelled';
    if (appointment.status === 'expired') return 'Expired';

    const appointmentDateTime = parse(`${appointment.date} ${appointment.time}`, "yyyy-MM-dd hh:mm a", new Date());
    const isPast = isAfter(new Date(), appointmentDateTime);
    
    const isStale = (appointment.status === 'confirmed' || appointment.status === 'pending') && isPast;
    if (isStale) {
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientPhotos, setPatientPhotos] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"upcoming" | "past" | "cancelled">("upcoming");

  // Modals & States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
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

        // 2. Fetch appointments using mapped ID
        const q = query(
          collection(db, "appointments"),
          where("doctorId", "==", clinicalDoctorId)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        
        // Sort locally to avoid index requirement
        data.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
        
        setAppointments(data);

        // 3. Fetch patient profile photos
        const patientIds = Array.from(new Set(data.map(a => a.patientId).filter(Boolean)));
        if (patientIds.length > 0) {
          const photos: Record<string, string> = {};
          for (let i = 0; i < patientIds.length; i += 30) {
            const chunk = patientIds.slice(i, i + 30);
            const userSnap = await getDocs(query(
              collection(db, "users"),
              where(documentId(), "in", chunk)
            ));
            userSnap.docs.forEach(d => {
              const userData = d.data();
              if (userData.profilePhoto) photos[d.id] = userData.profilePhoto;
            });
          }
          setPatientPhotos(photos);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  const updateStatus = async (appointmentId: string, status: string) => {
    setIsActionLoading(true);
    try {
      await updateDoc(doc(db, "appointments", appointmentId), { 
        status,
        updatedAt: new Date()
      });
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...apt, status } as Appointment : apt));
      success(`Booking status changed to ${status}`);
    } catch (err: any) {
      toastError("Failed to update status: " + err.message);
    } finally {
      setIsActionLoading(false);
      setIsCancelModalOpen(false);
    }
  };

  const handleReschedule = async (newDate: string, newTime: string) => {
    if (!selectedAppointment) return;
    setIsActionLoading(true);
    try {
      await updateDoc(doc(db, "appointments", selectedAppointment.id!), {
        date: newDate,
        time: newTime,
        updatedAt: new Date()
      });
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id ? { ...apt, date: newDate, time: newTime } as Appointment : apt
      ));
      success("Booking time updated successfully");
      setIsRescheduleOpen(false);
    } catch (err: any) {
      toastError("Failed to reschedule: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const appointmentDateTime = parse(`${apt.date} ${apt.time}`, "yyyy-MM-dd hh:mm a", new Date());
    const isPast = isAfter(new Date(), appointmentDateTime);
    const isToday = apt.date === todayStr;
    
    if (filter === "cancelled") return apt.status === "cancelled";
    
    if (filter === "past") {
        const isFinishedStatus = apt.status === "completed" || apt.status === "cancelled" || apt.status === "expired";
        return isFinishedStatus || ((apt.status === "confirmed" || apt.status === "pending") && isPast);
    }
    
    if (filter === "upcoming") {
        return (apt.status === "confirmed" || apt.status === "pending") && !isPast;
    }
    
    return true;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 font-poppins tracking-tighter mb-2">
              My <span className="text-primary font-medium">schedule</span>
          </h1>
        </div>
        
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner overflow-x-auto hide-scrollbar max-w-full">
            {(["upcoming", "past", "cancelled"] as const).map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 sm:px-6 py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold font-poppins capitalize tracking-widest transition-all whitespace-nowrap ${
                        filter === f ? "bg-white text-primary shadow-md" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>
      </section>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-50 animate-pulse rounded-[2.5rem]" />)
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((apt) => (
            <Card key={apt.id} variant="outline" className="p-0 bg-gradient-to-br from-white via-white to-primary/10 border-slate-100 hover:border-primary/20 transition-all rounded-2xl sm:rounded-[3rem] flex flex-col md:flex-row items-stretch overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300">
              {/* Left - Portrait Sidebar (Consistent with Patients/Records) */}
              <div className="w-full md:w-48 min-h-[120px] md:min-h-0 bg-sky-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100/80 transition-colors py-4 md:py-8">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white shadow-2xl border-4 md:border-[6px] border-white overflow-hidden group-hover:scale-105 transition-transform flex items-center justify-center relative">
                    {patientPhotos[apt.patientId] ? (
                        <img src={patientPhotos[apt.patientId]} alt={apt.patientName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary text-xl md:text-3xl font-bold bg-primary/5 italic font-poppins">
                            {apt.patientName[0]}
                        </div>
                    )}
                </div>
              </div>
              
              <div className="flex-1 p-4 md:p-8 space-y-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg md:text-2xl font-bold font-poppins text-slate-900 leading-tight truncate">{apt.patientName}</h3>
                            <Badge 
                                variant={getStatusVariant(getStatusLabel(apt))} 
                                className={`text-[9px] font-bold tracking-widest uppercase border-none py-1 px-4 rounded-full ${
                                    getStatusLabel(apt) === 'Expired' 
                                    ? 'bg-amber-100 text-amber-700' 
                                    : getStatusLabel(apt) === 'Appointment Done'
                                    ? 'bg-slate-100 text-slate-500'
                                    : getStatusLabel(apt) === 'Pending'
                                    ? 'bg-secondary/10 text-secondary'
                                    : 'bg-primary/10 text-primary'
                                }`}
                            >
                                {getStatusLabel(apt)}
                            </Badge>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Booking ID: #{apt.id?.slice(-6).toUpperCase()}</p>
                    </div>

                    {filter === "upcoming" && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                             <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => { setSelectedAppointment(apt); setIsRescheduleOpen(true); }}
                                className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary transition-all font-bold text-[10px] tracking-widest uppercase flex-1 sm:flex-none"
                            >
                                RESCHEDULE
                            </Button>
                             <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => { setSelectedAppointment(apt); setIsCancelModalOpen(true); }}
                                className="w-11 h-11 p-0 rounded-xl border-slate-200 text-slate-400 hover:bg-error/5 hover:text-error transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="h-px bg-slate-100/80 w-full" />
                
                <div className="flex flex-wrap items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                            <p className="text-sm font-bold text-slate-700">{apt.date}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-600 border border-amber-500/10">
                            <span className="material-symbols-outlined text-lg">schedule</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Slot</p>
                            <p className="text-sm font-bold text-slate-700">{apt.time}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
                            <span className="material-symbols-outlined text-lg">medical_services</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visit Type</p>
                            <p className="text-sm font-bold text-slate-700 capitalize">{apt.visitType}</p>
                        </div>
                    </div>
                    {filter === "upcoming" && (
                        <div className="w-full md:w-auto md:ml-auto pt-2 md:pt-0">
                            <Button 
                                variant="primary" 
                                onClick={() => updateStatus(apt.id!, "completed")}
                                className="h-11 md:h-12 w-full md:w-auto px-6 md:px-8 rounded-2xl shadow-lg shadow-primary/20 font-bold text-xs tracking-widest uppercase"
                            >
                                Mark completed
                            </Button>
                        </div>
                    )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-24 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">calendar_view_day</span>
            <h3 className="text-lg font-bold text-slate-800">No appointments in this category</h3>
            <p className="text-sm text-slate-500 mt-2">Check other filters or wait for new bookings.</p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={() => selectedAppointment && updateStatus(selectedAppointment.id!, "cancelled")}
        title="Cancel Booking"
        message={`Are you sure you want to cancel the meeting with ${selectedAppointment?.patientName}?`}
        confirmText="Yes, Cancel"
        variant="danger"
        isLoading={isActionLoading}
      />

      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onConfirm={handleReschedule}
        appointment={selectedAppointment}
        isLoading={isActionLoading}
      />
    </div>
  );
}

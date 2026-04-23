"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  documentId,
  addDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Appointment, Doctor } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PrescriptionModal } from "@/components/dashboard/PrescriptionModal";
import { ViewPrescriptionModal } from "@/components/dashboard/ViewPrescriptionModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { RescheduleModal } from "@/components/appointments/RescheduleModal";
import { NotificationHub } from "@/components/notifications/NotificationHub";
import { useNotifications } from "@/context/NotificationContext";
import { format, parse, isAfter } from "date-fns";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientPhotos, setPatientPhotos] = useState<Record<string, string>>({});
  const [slideIndex, setSlideIndex] = useState(0);
  
  // Modals & States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedAppointmentForPrescription, setSelectedAppointmentForPrescription] = useState<Appointment | null>(null);
  const [selectedAppointmentForView, setSelectedAppointmentForView] = useState<string | null>(null);
  const [prescriptionsExist, setPrescriptionsExist] = useState<Set<string>>(new Set());
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const todayStr = format(new Date(), "yyyy-MM-dd");

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

        const dDoc = doctorSnapshot.docs[0];
        const dData = { id: dDoc.id, ...dDoc.data() } as Doctor;
        setDoctorProfile(dData);
        const clinicalDoctorId = dDoc.id;

        // 2. Fetch appointments using the correctly mapped clinicalDoctorId
        const q = query(
          collection(db, "appointments"),
          where("doctorId", "==", clinicalDoctorId)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        
        // Sort locally by date desc
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
              const ud = d.data();
              if (ud.profilePhoto) photos[d.id] = ud.profilePhoto;
            });
          }
          setPatientPhotos(photos);
        }

        // 4. Check for existing prescriptions
        const appointmentIds = data.map(a => a.id).filter(Boolean);
        if (appointmentIds.length > 0) {
          const existingSet = new Set<string>();
          for (let i = 0; i < appointmentIds.length; i += 30) {
            const chunk = appointmentIds.slice(i, i + 30);
            const presSnap = await getDocs(query(
              collection(db, "prescriptions"),
              where(documentId(), "in", chunk)
            ));
            presSnap.docs.forEach(d => existingSet.add(d.id));
          }
          setPrescriptionsExist(existingSet);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [user]);

  const updateStatus = async (appointmentId: string, status: string) => {
    setIsActionLoading(true);
    try {
      await apiJson(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...apt, status } as Appointment : apt));
      toast.success(`Check-up marked as ${status}`);
    } catch (error: any) {
      toast.error("Failed to update: " + error.message);
    } finally {
      setIsActionLoading(false);
      setIsCancelModalOpen(false);
    }
  };

  const handlePrescriptionSubmit = async (data: { notes: string; medicines: any[] }) => {
    if (!selectedAppointmentForPrescription || !doctorProfile) return;
    
    try {
      // 1. Save or update prescription record (using appointmentId as the doc ID)
      await setDoc(doc(db, "prescriptions", selectedAppointmentForPrescription.id), {
        appointmentId: selectedAppointmentForPrescription.id,
        patientId: selectedAppointmentForPrescription.patientId,
        doctorId: doctorProfile.id,
        doctorName: doctorProfile.name,
        clinicName: doctorProfile.clinicName,
        date: format(new Date(), "yyyy-MM-dd"),
        notes: data.notes,
        medicines: data.medicines,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 2. Update appointment status to completed (if not already)
      if (selectedAppointmentForPrescription.status !== "completed") {
        await updateStatus(selectedAppointmentForPrescription.id!, "completed");
      } else {
        toast.success("Prescription updated successfully");
      }
      
      
      setPrescriptionsExist(prev => new Set([...prev, selectedAppointmentForPrescription.id]));
      setSelectedAppointmentForPrescription(null);
    } catch (error: any) {
      toast.error("Failed to save prescription: " + error.message);
      throw error;
    }
  };

  const handleReschedule = async (newDate: string, newTime: string) => {
    if (!selectedAppointment) return;
    setIsActionLoading(true);
    try {
      await apiJson(`/api/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          date: newDate,
          time: newTime
        })
      });
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id ? { ...apt, date: newDate, time: newTime } as Appointment : apt
      ));
      toast.success("Time changed successfully");
      setIsRescheduleOpen(false);
    } catch (error: any) {
      toast.error("Failed to change time: " + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const activeToday = todayAppointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  
  // ALL upcoming appointments (confirmed/pending, not yet passed OR for today) across all dates
  const upcomingAppointments = appointments.filter(a => {
    if (a.status !== 'confirmed' && a.status !== 'pending') return false;
    const appointmentDateTime = parse(`${a.date} ${a.time}`, "yyyy-MM-dd hh:mm a", new Date());
    const isPast = isAfter(new Date(), appointmentDateTime);

    return !isPast;
  });

  // Refined history filter: show finished/cancelled/expired appointments
  const finishedRecently = appointments.filter(a => {
    const appointmentDateTime = parse(`${a.date} ${a.time}`, "yyyy-MM-dd hh:mm a", new Date());
    const isPast = isAfter(new Date(), appointmentDateTime);
    const isFinished = a.status === 'completed' || a.status === 'cancelled';
    const isExpiredStatus = a.status === 'expired';
    const isStale = (a.status === 'confirmed' || a.status === 'pending') && isPast;
    
    return isFinished || isExpiredStatus || isStale;
  }).slice(0, 5);
  
  // Find the next upcoming patient: first check today, then future dates
  // Sort upcoming by date+time ascending to get the nearest one
  const sortedUpcoming = [...upcomingAppointments].sort((a, b) => {
    const dtA = parse(`${a.date} ${a.time}`, "yyyy-MM-dd hh:mm a", new Date());
    const dtB = parse(`${b.date} ${b.time}`, "yyyy-MM-dd hh:mm a", new Date());
    return dtA.getTime() - dtB.getTime();
  });
  const currentPatient = sortedUpcoming[0] || null;

  const getStatusLabel = (appointment: Appointment) => {
    if (appointment.status === 'completed') return 'Appointment Done';
    if (appointment.status === 'cancelled') return 'Cancelled';
    if (appointment.status === 'expired') return 'Expired';
    
    // Date-based expired detection (fallback for items not yet synced)
    const appointmentDateTime = parse(`${appointment.date} ${appointment.time}`, "yyyy-MM-dd hh:mm a", new Date());
    const isPast = isAfter(new Date(), appointmentDateTime);
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

  // Compute real-time stats
  const totalBookings = appointments.length;
  const leftToSee = upcomingAppointments.length;
  const finishedCount = appointments.filter(a => a.status === 'completed' || a.status === 'expired').length;
  const totalEarnings = appointments.filter(a => a.paymentStatus === 'paid').reduce((sum, a) => sum + (a.fee || 0), 0);

  const stats = {
    bookings: totalBookings,
    today: leftToSee,
    done: finishedCount,
    money: totalEarnings,
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="w-full">
          <div className="flex items-start sm:items-center justify-between gap-3 mb-2">
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 font-poppins tracking-tighter">
                Today's <span className="text-primary font-medium">work</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all relative ${isNotificationsOpen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface group-hover:scale-110 transition-transform">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationHub 
                  isOpen={isNotificationsOpen} 
                  onClose={() => setIsNotificationsOpen(false)}
                  className="top-full right-0 mt-3 w-[calc(100vw-2rem)] md:w-[420px] origin-top-right"
                />
              </div>
              <div className="flex items-center bg-surface-container-high border border-outline-variant/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all gap-2 shadow-sm h-10 sm:h-12">
                  <span className="material-symbols-outlined text-slate-400 text-[16px] sm:text-[18px]">calendar_today</span>
                  <span className="text-xs sm:text-sm font-bold font-poppins whitespace-nowrap tracking-tight text-slate-900">{format(new Date(), "MMMM dd, yyyy")}</span>
              </div>
            </div>
          </div>
          <p className="text-slate-500 font-medium text-lg">Hello <span className="text-red-500 font-bold">Dr. {user?.name?.replace(/^Dr\.?\s+/i, '').split(" ")[0]}</span>, here is what your day looks like.</p>
        </div>
      </section>

      {/* Simple Stats Box */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="flat" className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 border-none rounded-[2rem] shadow-lg shadow-blue-500/20 text-white group hover:scale-[1.02] transition-transform">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl fill-1">calendar_month</span>
              </div>
              <span className="text-2xl font-bold block font-poppins tracking-tighter">{stats.bookings}</span>
              <span className="text-[10px] font-semibold opacity-80 tracking-widest">Total bookings</span>
          </Card>
          <Card variant="flat" className="p-5 bg-gradient-to-br from-amber-500 to-amber-600 border-none rounded-[2rem] shadow-lg shadow-amber-500/20 text-white group hover:scale-[1.02] transition-transform">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl fill-1">groups</span>
              </div>
              <span className="text-2xl font-bold block font-poppins tracking-tighter">{stats.today}</span>
              <span className="text-[10px] font-semibold opacity-80 tracking-widest">Left to see</span>
          </Card>
          <Card variant="flat" className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 border-none rounded-[2rem] shadow-lg shadow-emerald-500/20 text-white group hover:scale-[1.02] transition-transform">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl fill-1">check_circle</span>
              </div>
              <span className="text-2xl font-bold block font-poppins tracking-tighter">{stats.done}</span>
              <span className="text-[10px] font-semibold opacity-80 tracking-widest">Finished today</span>
          </Card>
          <Card variant="flat" className="p-5 bg-gradient-to-br from-purple-500 to-purple-600 border-none rounded-[2rem] shadow-lg shadow-purple-500/20 text-white group hover:scale-[1.02] transition-transform">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl fill-1">payments</span>
              </div>
              <span className="text-2xl font-bold block font-poppins tracking-tighter">₹{stats.money}</span>
              <span className="text-[10px] font-semibold opacity-80 tracking-widest">Total earnings</span>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Clinical Area */}
        <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-900 font-poppins tracking-tighter">
                    Next <span className="text-primary font-medium">patient</span>
                </h2>
                {sortedUpcoming.length > 1 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">{slideIndex + 1} / {sortedUpcoming.length}</span>
                        <button onClick={() => setSlideIndex(i => Math.max(0, i - 1))} disabled={slideIndex === 0} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button onClick={() => setSlideIndex(i => Math.min(sortedUpcoming.length - 1, i + 1))} disabled={slideIndex === sortedUpcoming.length - 1} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>
            
            {/* Sliding Patient Card */}
            {sortedUpcoming.length > 0 ? (
                <div className="overflow-hidden rounded-[3rem]">
                  <div className="transition-transform duration-500 ease-out" style={{ transform: `translateX(-${slideIndex * 100}%)`, display: 'flex' }}>
                    {sortedUpcoming.map((apt) => {
                      const dateBadge = apt.date === todayStr ? 'Today' : apt.date === format(new Date(new Date().setDate(new Date().getDate() + 1)), "yyyy-MM-dd") ? 'Tomorrow' : apt.date;
                      return (
                        <div key={apt.id} className="w-full flex-shrink-0">
                          <Card variant="elevated" className="p-0 overflow-hidden border-none rounded-2xl sm:rounded-[3rem] shadow-ambient bg-gradient-to-br from-primary to-blue-600 text-white relative">
                            <div className="p-6 sm:p-10 flex flex-col md:flex-row gap-6 sm:gap-8 items-center">
                                {/* Profile Photo */}
                                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-xl overflow-hidden flex-shrink-0">
                                    {patientPhotos[apt.patientId] ? (
                                        <img src={patientPhotos[apt.patientId]} alt={apt.patientName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-black">{apt.patientName[0]}</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-3 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                                        <Badge variant="secondary" className="bg-white/20 text-white border-none font-semibold text-[9px]">{dateBadge}</Badge>
                                        <Badge variant="secondary" className="bg-emerald-500/80 text-white border-none font-bold text-[9px]">{getStatusLabel(apt)}</Badge>
                                    </div>
                                    <h3 className="text-3xl font-bold font-poppins tracking-tighter">{apt.patientName}</h3>
                                    <p className="text-white/80 font-medium flex items-center justify-center md:justify-start gap-2 text-sm">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        {apt.time} · {apt.visitType}
                                    </p>
                                    {apt.reason && (
                                        <p className="text-white/60 text-sm italic">"{apt.reason}"</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-3 min-w-[180px]">
                                    {prescriptionsExist.has(apt.id) ? (
                                      <div className="flex flex-col gap-2">
                                        <Button 
                                          onClick={() => setSelectedAppointmentForView(apt.id)} 
                                          className="bg-white text-primary hover:bg-blue-50 h-12 rounded-2xl font-bold text-sm shadow-xl border-none"
                                        >
                                            View Prescription
                                        </Button>
                                        <Button 
                                          variant="ghost"
                                          onClick={() => setSelectedAppointmentForPrescription(apt)} 
                                          className="text-white hover:bg-white/10 h-10 rounded-xl font-bold text-[10px] tracking-widest uppercase border border-white/20"
                                        >
                                            Edit Record
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button 
                                        onClick={() => setSelectedAppointmentForPrescription(apt)} 
                                        className="bg-white text-primary hover:bg-blue-50 h-12 rounded-2xl font-bold text-sm shadow-xl border-none"
                                      >
                                          Finish Meeting
                                      </Button>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="ghost" onClick={() => { setSelectedAppointment(apt); setIsRescheduleOpen(true); }} className="border border-white/20 text-white hover:bg-white/10 h-10 text-[10px] font-bold rounded-xl">
                                            Reschedule
                                        </Button>
                                        <Button variant="ghost" onClick={() => { setSelectedAppointment(apt); setIsCancelModalOpen(true); }} className="border border-white/20 text-white hover:bg-white/10 h-10 text-[10px] font-bold rounded-xl">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
            ) : (
                <Card variant="flat" className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">event_available</span>
                    <h3 className="text-lg font-bold text-slate-800">No upcoming patients</h3>
                    <p className="text-sm text-slate-500 mt-2">Take a break or check your full schedule.</p>
                </Card>
            )}

            {/* Rest of the day list - show Recently Finished instead */}
            <div className="pt-4">
                <h3 className="text-xl font-bold font-poppins text-slate-800 mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">history</span>
                    Recently <span className="text-primary font-medium">Finished</span>
                </h3>
                
                <div className="space-y-4">
                    {finishedRecently.length > 0 ? (
                        finishedRecently.map((apt) => (
                            <Card key={apt.id} variant="outline" className="p-0 bg-gradient-to-br from-white via-white to-primary/10 border-slate-100 hover:border-primary/20 transition-all rounded-2xl md:rounded-[2.5rem] flex flex-col md:flex-row items-stretch overflow-hidden group shadow-sm">
                                <div className="w-full md:w-32 bg-sky-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100/80 transition-colors py-6 md:py-4">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center text-slate-400 text-xl font-black border-[4px] border-white shadow-xl group-hover:scale-110 transition-transform overflow-hidden relative">
                                        {patientPhotos[apt.patientId] ? (
                                            <img src={patientPhotos[apt.patientId]} alt={apt.patientName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-black">{apt.patientName[0]}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 p-5 md:p-6">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-bold text-slate-900 font-poppins">{apt.patientName}</h4>
                                        <Badge 
                                            variant={getStatusVariant(getStatusLabel(apt))} 
                                            className={`text-[8px] font-bold tracking-widest uppercase py-0.5 border-none ${
                                                getStatusLabel(apt) === 'Expired' 
                                                ? 'bg-amber-50 text-amber-600' 
                                                : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {getStatusLabel(apt)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                            {apt.date} at {apt.time}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">medical_services</span>
                                            {apt.visitType}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-row md:flex-col gap-2 p-4 md:p-4 justify-center bg-white/50 md:bg-transparent border-t md:border-t-0 border-slate-100">
                                    {prescriptionsExist.has(apt.id) ? (
                                      <>
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setSelectedAppointmentForView(apt.id)}
                                            className="flex-1 md:flex-none h-10 px-4 rounded-xl text-[10px] font-bold tracking-widest text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                            <span className="md:inline">View</span>
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setSelectedAppointmentForPrescription(apt)}
                                            className="flex-1 md:flex-none h-10 px-4 rounded-xl text-[10px] font-bold tracking-widest text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                            <span className="md:inline">Edit</span>
                                        </Button>
                                      </>
                                    ) : (
                                      <Button 
                                          variant="ghost" 
                                          onClick={() => setSelectedAppointmentForPrescription(apt)}
                                          className="flex-1 md:flex-none h-10 px-4 rounded-xl text-[10px] font-bold tracking-widest text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                      >
                                          <span className="material-symbols-outlined text-sm">edit_note</span>
                                          <span className="md:inline">Prescription</span>
                                      </Button>
                                    )}
                                    <Link to={`/doctor-dashboard/records?patientId=${apt.patientId}`} className="flex-1 md:flex-none">
                                        <Button variant="ghost" className="w-full h-10 px-4 rounded-xl text-[10px] font-bold tracking-widest opacity-60 hover:opacity-100 hover:bg-slate-100 transition-all">
                                            History
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <p className="text-slate-400 text-sm font-medium italic pl-2">No recently completed meetings found.</p>
                    )}
                </div>
            </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-900 font-poppins tracking-tighter mb-6">
                Quick <span className="text-primary font-medium">actions</span>
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
                {/* First Card - Clinic Status  */}
                <Card variant="flat" className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="font-bold font-poppins text-slate-900 text-lg">Clinic status</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] text-emerald-600 tracking-widest font-bold uppercase">Currently open</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-2 rounded-xl">door_open</span>
                    </div>
                    
                    <div className="space-y-3">
                        <Button variant="outline" className="w-full h-12 rounded-xl border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold text-xs shadow-none flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">pause_circle</span>
                            Go Offline (Break)
                        </Button>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold text-xs shadow-none flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">campaign</span>
                            Announce Delay
                        </Button>
                    </div>
                </Card>

                {/* Second Card - Sync Patient Records */}
                <Card variant="flat" className="p-8 bg-primary/5 border border-primary/10 rounded-[2.5rem] flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                        <span className="material-symbols-outlined text-3xl">clinical_notes</span>
                    </div>
                    <h4 className="font-bold font-poppins text-slate-900 mb-2 text-lg leading-tight">Sync patient records</h4>
                    <p className="text-xs text-slate-500 font-medium mb-6 px-4">Update medical files and prescriptions for seen patients.</p>
                    <Link to="/doctor-dashboard/records" className="w-full">
                        <Button variant="primary" className="w-full h-12 rounded-2xl font-bold text-xs shadow-lg shadow-primary/20">Open Records</Button>
                    </Link>
                </Card>
            </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={() => selectedAppointment && updateStatus(selectedAppointment.id!, "cancelled")}
        title="Cancel Patient"
        message={`Are you sure you want to cancel the meeting with ${selectedAppointment?.patientName}? They will be told about this.`}
        confirmText="Yes, Cancel"
        variant="danger"
        isLoading={isActionLoading}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onConfirm={handleReschedule}
        appointment={selectedAppointment}
        isLoading={isActionLoading}
      />

      {/* Prescription Modal */}
      {selectedAppointmentForPrescription && doctorProfile && (
        <PrescriptionModal
            isOpen={!!selectedAppointmentForPrescription}
            onClose={() => setSelectedAppointmentForPrescription(null)}
            appointment={selectedAppointmentForPrescription}
            doctor={doctorProfile}
            onSubmit={handlePrescriptionSubmit}
        />
      )}

      {/* View Prescription Modal */}
      <ViewPrescriptionModal
        isOpen={!!selectedAppointmentForView}
        onClose={() => setSelectedAppointmentForView(null)}
        appointmentId={selectedAppointmentForView || ""}
      />
    </div>
  );
}

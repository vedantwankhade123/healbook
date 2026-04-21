"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePrakriti } from "@/context/PrakritiContext";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "@/context/NotificationContext";
import { NotificationHub } from "@/components/notifications/NotificationHub";
import { apiJson } from "@/lib/api";
import { Doctor } from "@/types";
import { parse, isAfter } from "date-fns";

const symptoms = [
  { name: "Fever", icon: "device_thermostat" },
  { name: "Cough", icon: "airwave" },
  { name: "Headache", icon: "neurology" },
  { name: "Stomach Ache", icon: "gastroenterology" },
  { name: "Injury", icon: "healing" },
  { name: "Heart Pain", icon: "cardiology" },
];

const quickActions = [
  { title: "Find Doctor", icon: "person_search", color: "primary", gradient: "bg-gradient-ocean", href: "/doctors" },
  { title: "Book Appointment", icon: "event_available", color: "secondary", gradient: "bg-gradient-emerald", href: "/doctors" },
  { title: "AI Health Chat", icon: "smart_toy", color: "tertiary", gradient: "bg-gradient-sunset", href: "/health-ai" },
  { title: "My Records", icon: "clinical_notes", color: "accent", gradient: "bg-gradient-royal", href: "/records" },
];

export default function PatientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({ appointments: 0, files: 0 });
  const [loading, setLoading] = useState(true);
  const { chatWithPrakriti } = usePrakriti();
  const navigate = useNavigate();
  const [isSymptomDropdownOpen, setIsSymptomDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const symptomDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (symptomDropdownRef.current && !symptomDropdownRef.current.contains(event.target as Node)) {
        setIsSymptomDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === "doctor") {
      navigate("/doctor-dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [doctorList, apptList, statData] = await Promise.all([
          apiJson<Doctor[]>("/api/doctors?limit=4&orderBy=rating&orderDir=desc"),
          apiJson<Array<{ id: string; date?: string; time?: string } & Record<string, unknown>>>(
            `/api/appointments?patientId=${encodeURIComponent(user.uid)}`,
          ),
          apiJson<{ appointments: number; files: number }>("/api/patient/stats"),
        ]);
        setDoctors(doctorList);
        const sorted = [...apptList].sort((a, b) => {
          const dc = String(a.date || "").localeCompare(String(b.date || ""));
          if (dc !== 0) return dc;
          return String(a.time || "").localeCompare(String(b.time || ""));
        });
        setAppointments(sorted.slice(0, 1));
        setStats(statData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-on-surface font-headline tracking-tight">
              Hello, <span className="text-primary">{user?.name?.split(" ")[0] || "there"}!</span>
            </h1>
            <p className="text-on-surface-variant font-body mt-1 text-lg opacity-80">How are you feeling today?</p>
          </div>
          
          <div className="hidden md:flex items-center">
            <div className="relative">
              <button 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotificationsOpen(!isNotificationsOpen);
                }}
                className="w-9 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all group relative"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface animate-in zoom-in duration-300">
                    {unreadCount}
                  </span>
                )}
              </button>
              <NotificationHub 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
              />
            </div>
          </div>
        </div>

      </section>

      {/* Quick Actions Section */}
      <section className="space-y-6">
        <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">Quick <span className="text-primary">Actions</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {quickActions.map((action, i) => (
          <Link key={i} to={action.href}>
            <Card variant="elevated" className={`group h-full p-6 hover:shadow-xl transition-all border-none rounded-[2rem] overflow-hidden relative cursor-pointer ${action.gradient} animate-gradient`}>
              {/* Subtle Glass Overlay for text readability */}
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
              
              <div className="relative z-10">
                <div className="mb-6 w-12 h-12 flex items-center justify-start text-white">
                  <span className="material-symbols-outlined text-4xl font-light">{action.icon}</span>
                </div>
                <h3 className="font-headline font-bold text-sm text-white tracking-tight drop-shadow-sm">
                  {action.title}
                </h3>
              </div>
            </Card>
          </Link>
        ))}
        </div>
      </section>



      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Nearby Doctors */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">Recommended <span className="text-primary">for you</span></h2>
            <Link to="/doctors" className="text-sm font-bold text-primary hover:underline font-headline">Explore</Link>
          </div>

          <div className="space-y-4">
            {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-28 bg-surface-container-low animate-pulse rounded-2xl" />)
            ) : doctors.length > 0 ? (
                doctors.map((doctor) => (
                    <Card key={doctor.id} variant="outline" className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 hover:shadow-md transition-shadow rounded-2xl">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-surface-container flex-shrink-0 overflow-hidden">
                                <img src={doctor.profilePhoto} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface truncate">{doctor.name}</h3>
                                    <Badge variant="primary" size="sm" className="h-5 px-1.5">{doctor.rating}</Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-on-surface-variant font-medium truncate">{doctor.specialization} • Mumbai</p>
                            </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/10">
                            <div className="sm:hidden text-xs font-bold text-primary tracking-widest uppercase">Expert Care</div>
                            <Link to={`/doctors/${doctor.id}`}>
                                <Button variant="outline" size="sm" className="h-8 px-4 text-[11px] font-bold">Book</Button>
                            </Link>
                        </div>
                    </Card>
                ))
            ) : (
                <Card variant="flat" className="py-12 text-center border-2 border-dashed border-outline-variant/20 rounded-[2rem]">
                    <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">clinical_notes</span>
                    <h3 className="font-headline font-bold text-on-surface mb-1">No <span className="text-primary">Practitioners Found</span></h3>
                </Card>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="space-y-6">
          <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">Your <span className="text-primary">Schedule</span></h2>
          {appointments.length > 0 ? (
            (() => {
              const appt = appointments[0];
              const appointmentDateTime = parse(`${appt.date} ${appt.time}`, "yyyy-MM-dd hh:mm a", new Date());
              const isPassed = isAfter(new Date(), appointmentDateTime);
              const isExpired = appt.status === "confirmed" && isPassed;
              
              const statusLabel = isExpired ? "Expired" : appt.status === "confirmed" ? "Booked" : appt.status;
              const badgeVariant = appt.status === "completed" ? "secondary" : (appt.status === "cancelled" || isExpired) ? "neutral" : "primary";
              const secondaryStatus = isExpired ? "Lapsed" : appt.status === "confirmed" ? "Confirmed" : "";

              return (
                <Card variant="glass" className="p-0 overflow-hidden rounded-xl sm:rounded-[2rem]">
                  <div className={`p-6 border-b border-primary/10 ${isExpired ? 'bg-surface-container-low opacity-80' : 'bg-surface-container-low/40'}`}>
                      <div className="flex items-center justify-between mb-4">
                          <Badge variant={badgeVariant as any}>{statusLabel.toUpperCase()}</Badge>
                          {secondaryStatus && (
                            <span className={`text-[10px] font-black uppercase tracking-widest font-headline ${isExpired ? 'text-on-surface-variant' : 'text-primary'}`}>
                              {secondaryStatus}
                            </span>
                          )}
                      </div>
                      <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold font-headline shadow-sm ${isExpired ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary'}`}>
                              <span className={`text-xs uppercase opacity-70 leading-none mb-0.5 ${!isExpired ? "text-on-primary" : ""}`}>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(appt.date))}</span>
                              <span className={`text-lg leading-none ${!isExpired ? "text-on-primary" : ""}`}>{new Date(appt.date).getDate()}</span>
                          </div>
                          <div className="min-w-0">
                              <div className="font-bold text-on-surface font-headline truncate">{appt.doctorName}</div>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-2">
                      <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-wider" size="sm" onClick={() => navigate('/appointments')}>Reschedule</Button>
                      <Button variant="primary" className="w-full text-[10px] font-black uppercase tracking-wider shadow-none" size="sm" onClick={() => navigate('/appointments')}>Details</Button>
                  </div>
                </Card>
              );
            })()
          ) : (
            <Card variant="flat" className="p-8 text-center border-2 border-dashed border-outline-variant/20 rounded-xl sm:rounded-[2rem] flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mb-4 text-outline-variant">
                <span className="material-symbols-outlined text-3xl">event_busy</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface text-sm mb-1">No <span className="text-primary">Appointments</span></h3>
              <Link to="/doctors" className="w-full">
                <Button variant="outline" size="sm" className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary/5">Book Now</Button>
              </Link>
            </Card>
          )}

          {/* Health Hub Overview */}
          <div className="space-y-4">
            <h2 className="font-headline font-bold text-xl tracking-tight text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Health Hub <span className="text-primary">Overview</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
                <Card variant="flat" className="p-5 bg-surface-container-low border border-outline-variant/10 rounded-[1.5rem] flex flex-col items-center text-center transition-all hover:border-primary/20">
                    <span className="material-symbols-outlined text-primary text-xl mb-2">event_note</span>
                    <h3 className="text-2xl font-bold font-headline text-on-surface">
                      {loading ? ".." : stats.appointments.toString().padStart(2, '0')}
                    </h3>
                </Card>
                <Card variant="flat" className="p-5 bg-surface-container-low border border-outline-variant/10 rounded-[1.5rem] flex flex-col items-center text-center transition-all hover:border-blue-500/20">
                    <span className="material-symbols-outlined text-blue-500 text-xl mb-2">clinical_notes</span>
                    <h3 className="text-2xl font-bold font-headline text-on-surface">
                      {loading ? ".." : stats.files.toString().padStart(2, '0')}
                    </h3>
                </Card>
            </div>
          </div>

          <Card variant="flat" className="p-6 text-center rounded-[2rem] border border-outline-variant/10">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined">clinical_notes</span>
            </div>
            <h4 className="font-headline font-bold text-lg text-on-surface mb-1">Health <span className="text-primary">Records</span></h4>
            <Link to="/records">
              <Button variant="outline" className="w-full rounded-xl" size="sm">Open Records</Button>
            </Link>
          </Card>
        </div>
      </section>

    </div>
  );
}

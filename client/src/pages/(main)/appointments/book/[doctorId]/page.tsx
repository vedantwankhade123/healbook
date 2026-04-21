"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Doctor } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { format, addDays, startOfToday, parse, isAfter } from "date-fns";

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
  "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", 
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];

const visitTypes = [
  { id: "video", label: "Video Call", icon: "videocam", desc: "Consult from your home" },
  { id: "in-person", label: "In-Person", icon: "location_on", desc: "Visit the doctor's clinic" },
  { id: "home", label: "Home Visit", icon: "home", desc: "Doctor visits your location" },
];

export default function BookAppointmentPage() {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("video");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!doctorId) return;
      const docSnap = await getDoc(doc(db, "doctors", doctorId as string));
      if (docSnap.exists()) {
        setDoctor({ id: docSnap.id, ...docSnap.data() } as Doctor);
      }
    };
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!doctorId || !selectedDate) return;
      
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const q = query(
          collection(db, "appointments"),
          where("doctorId", "==", doctorId),
          where("date", "==", formattedDate),
          where("status", "in", ["pending", "confirmed"])
        );
        
        const snapshot = await getDocs(q);
        const booked = snapshot.docs.map(doc => doc.data().time);
        setBookedSlots(booked);
      } catch (error) {
        console.error("Error fetching booked slots:", error);
      }
    };

    fetchBookedSlots();
  }, [doctorId, selectedDate]);

  const handleBooking = async () => {
    if (!selectedTime || !reason) {
      toast.error("Please fill all details");
      return;
    }

    setIsProcessingPayment(true);
    
    // Simulate Payment Processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const appointmentData = {
        patientId: user?.uid,
        patientName: user?.name,
        doctorId: doctor?.id,
        doctorName: doctor?.name,
        doctorSpecialization: doctor?.specialization,
        doctorPhoto: doctor?.profilePhoto,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        visitType: selectedType,
        reason: reason,
        status: "confirmed",
        fee: doctor?.consultationFee,
        paymentStatus: "paid", // Set to paid for dummy payment
        createdAt: serverTimestamp(),
      };

      const appointmentId = `apt_${user?.uid}_${doctor?.id}_${format(selectedDate, "yyyy-MM-dd")}_${selectedTime.replace(/ /g, "_")}`;
      
      await setDoc(doc(db, "appointments", appointmentId), appointmentData, { merge: true });
      toast.success("Transaction successful! Appointment booked.");
      navigate("/appointments");
    } catch (error: any) {
      toast.error("Booking failed: " + error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!doctor) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4 md:px-8">
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface font-poppins tracking-tight mb-2">
            Complete Your <span className="text-primary">Booking</span>
        </h1>
        <p className="text-on-surface-variant font-body text-lg">You are booking an appointment with {doctor.name}.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <div className="lg:col-span-2 space-y-12 lg:pr-12">
          {/* Step 1: Visit Type */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
              <h3 className="text-xl font-bold font-poppins">Select Visit Type</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visitTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all group ${
                      selectedType === t.id 
                        ? "border-primary bg-primary/5 ring-4 ring-primary/5 shadow-sm" 
                        : "border-outline-variant/20 bg-surface-container-low/30 hover:border-primary/50"
                    }`}
                >
                  <span className={`material-symbols-outlined mb-4 block text-3xl ${selectedType === t.id ? "text-primary" : "text-outline"}`}>
                    {t.icon}
                  </span>
                  <div className={`font-poppins font-bold tracking-wide mb-1 ${selectedType === t.id ? "text-primary" : "text-on-surface"}`}>
                    {t.label}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-outline-variant tracking-widest">{t.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: Date & Time */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</div>
              <h3 className="text-xl font-bold font-poppins">Schedule Your Visit</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                  const date = addDays(new Date(), offset);
                  const isSelected = format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
                  return (
                    <button
                      key={offset}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 w-20 h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all snap-start ${
                        isSelected 
                          ? "border-primary bg-primary text-white shadow-lg scale-105" 
                          : "border-outline-variant/20 bg-surface-container-low/30 text-on-surface hover:border-primary/50"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{format(date, "EEE")}</span>
                      <span className="text-2xl font-bold font-poppins tracking-tighter">{format(date, "dd")}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {timeSlots.map((time) => {
                  const isBooked = bookedSlots.includes(time);
                  
                  // Past Slot Check for Today
                  const slotDateTime = parse(time, "hh:mm a", selectedDate);
                  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  const isPast = isToday && isAfter(new Date(), slotDateTime);
                  
                  const isDisabled = isBooked || isPast;

                  return (
                    <button
                      key={time}
                      disabled={isDisabled}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 rounded-xl border-2 font-bold text-sm transition-all relative ${
                        isDisabled
                          ? "border-outline-variant/10 bg-surface-container-low text-outline-variant/40 cursor-not-allowed"
                          : selectedTime === time 
                          ? "border-primary bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                          : "border-outline-variant/20 bg-surface-container-low/30 text-on-surface hover:border-primary/50 whitespace-nowrap"
                      }`}
                    >
                      {time}
                      {isBooked && (
                        <span className="absolute -top-2 -right-1 bg-error text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Taken</span>
                      )}
                      {isPast && !isBooked && (
                        <span className="absolute -top-2 -right-1 bg-outline text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Passed</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Step 3: Additional Info */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">3</div>
              <h3 className="text-xl font-bold font-poppins">Reason for Visit</h3>
            </div>
            <textarea
                placeholder="Briefly describe your symptoms or concern..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full min-h-[150px] p-6 rounded-2xl bg-surface-container-low/30 border border-outline-variant/20 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-body text-on-surface placeholder:text-outline"
            />
          </section>
        </div>

        {/* Sidebar Summary - Stationary Fixed Positioning */}
        <aside className="hidden lg:block w-full">
          <div className="fixed top-28 right-8 w-[340px] z-20">
            <Card variant="glass" className="p-0 overflow-hidden bg-white/40 backdrop-blur-md border border-white/40 shadow-ambient transition-none">
            <div className="p-8 bg-primary/5 space-y-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                  <img src={doctor.profilePhoto} alt={doctor.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold font-poppins text-lg">{doctor.name}</h4>
                  <p className="text-sm text-primary font-bold uppercase tracking-tight">{doctor.specialization}</p>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-primary/10">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Type</span>
                    <span className="font-bold text-on-surface uppercase tracking-tight">{selectedType.replace("-", " ")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Date</span>
                    <span className="font-bold text-on-surface">{format(selectedDate, "MMMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Time</span>
                    <span className="font-bold text-on-surface">{selectedTime || "Not Selected"}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-primary/10 flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest block mb-1">Consultation Fee</span>
                    <span className="text-3xl font-bold text-primary font-poppins tracking-tighter">₹{doctor.consultationFee}</span>
                </div>
                <Badge variant="tertiary">All Inclusive</Badge>
              </div>
            </div>
            
            <div className="p-6">
              <Button size="lg" className="w-full py-5 rounded-2xl shadow-xl shadow-primary/20" onClick={handleBooking} isLoading={loading}>
                Confirm & Pay
              </Button>
            </div>
          </Card>
        </div>
      </aside>
    </div>

      {/* Payment Processing Overlay - Re-designed for Premium Integrated Look */}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-110 duration-700">
            <div className="w-full max-w-xl text-center space-y-12">
                {/* Main Pulsing Indicator */}
                <div className="relative w-40 h-40 mx-auto">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-[ping_3s_infinite]"></div>
                    <div className="absolute inset-0 border-[6px] border-primary/40 rounded-full"></div>
                    <div className="absolute inset-0 border-[6px] border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-6xl text-white drop-shadow-[0_0_15px_rgba(var(--color-primary),0.8)]">
                            verified_user
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-white font-poppins tracking-tighter">
                        Securely <span className="text-primary-container">Processing</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-md mx-auto">
                        We are verifying your clinical transaction. <br className="hidden md:block" /> Please do not refresh this page.
                    </p>
                </div>

                <div className="w-full max-w-sm mx-auto space-y-5">
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden p-[2px]">
                        <div className="h-full bg-linear-to-r from-primary to-primary-container rounded-full animate-[shimmer_1.5s_infinite] w-full origin-left"></div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Verification in Progress</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

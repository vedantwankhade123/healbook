"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/types";
import { Card } from "@/components/ui/Card";
import { safeParseDate } from "@/lib/date-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { useNotifications } from "@/context/NotificationContext";
import { apiJson, apiFetch } from "@/lib/api";
import { ReceiptModal } from "@/components/appointments/ReceiptModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ViewPrescriptionModal } from "@/components/dashboard/ViewPrescriptionModal";
import { parse, isAfter, subHours, differenceInHours } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const { refreshNotifications } = useNotifications();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<{id: string, date: string, time: string} | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      try {
        const list = await apiJson<Appointment[]>(
          `/api/appointments?patientId=${encodeURIComponent(user.uid)}`,
        );
        list.sort((a, b) => {
          const ca = safeParseDate(a.createdAt).getTime();
          const cb = safeParseDate(b.createdAt).getTime();
          return cb - ca;
        });
        setAppointments(list);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchAppointments();
  }, [user]);

  const handleCancelClick = (id: string, date: string, time: string) => {
    // 4-Hour Cancellation Rule Check
    const appointmentDateTime = parse(`${date} ${time}`, "yyyy-MM-dd hh:mm a", new Date());
    const now = new Date();
    
    if (differenceInHours(appointmentDateTime, now) < 4) {
      error("Appointments cannot be cancelled within 4 hours of the slot.");
      return;
    }

    setAppointmentToCancel({ id, date, time });
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel) return;
    
    setIsCancelling(true);
    try {
      await apiFetch(`/api/appointments/${appointmentToCancel.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
      });

      setAppointments((prev) => prev.map((a) => (a.id === appointmentToCancel.id ? { ...a, status: "cancelled" } : a)));
      void refreshNotifications();
      success("Appointment cancelled successfully.");
    } catch {
      error("Failed to cancel appointment.");
    } finally {
      setIsCancelling(false);
      setIsCancelModalOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const openReceipt = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsReceiptOpen(true);
  };

  const handlePayFee = async (apt: Appointment) => {
    if (!apt.id) return;
    setPayingId(apt.id);
    try {
      const updated = await apiJson<Appointment>(`/api/appointments/${apt.id}/pay`, {
        method: "POST",
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, ...updated, id: apt.id } : a)),
      );
      void refreshNotifications();
      success("Payment successful. Your appointment is confirmed.");
    } catch {
      error("Could not process payment. Please try again.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface font-poppins tracking-tight mb-2">
            My <span className="text-primary">Appointments</span>
        </h1>
      </section>

      <div className="space-y-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-40 bg-surface-container-low animate-pulse rounded-2xl" />)
        ) : appointments.length > 0 ? (
          appointments.map((apt) => (
            <Card key={apt.id} variant="outline" className="p-4 md:p-8 rounded-xl md:rounded-2xl hover:border-primary/30 transition-all flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
              <div className="w-full flex items-start gap-3 md:gap-4 md:flex-1 min-w-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                  <img src={apt.doctorPhoto} alt={apt.doctorName} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2 text-left">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
                    <h3 className="text-lg md:text-xl font-bold font-headline truncate">{apt.doctorName}</h3>
                    {(() => {
                      const appointmentDateTime = parse(`${apt.date} ${apt.time}`, "yyyy-MM-dd hh:mm a", new Date());
                      const isPassed = isAfter(new Date(), appointmentDateTime);
                      const isExpired = apt.status === "confirmed" && isPassed;

                      return (
                          <Badge variant={apt.status === "completed" ? "secondary" : apt.status === "cancelled" ? "neutral" : isExpired ? "neutral" : apt.status === "pending" ? "secondary" : "primary"}>
                            {isExpired ? "Expired" : apt.status === "confirmed" ? "Confirmed" : apt.status === "pending" ? "Pending" : apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </Badge>
                      );
                    })()}
                  </div>
                  <p className="text-primary font-bold text-sm font-headline uppercase tracking-tight">{apt.doctorSpecialization}</p>
                  <div className="flex flex-wrap justify-start gap-3 md:gap-6 text-sm text-on-surface-variant font-medium pt-1 md:pt-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">calendar_today</span>
                      {apt.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      {apt.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">info</span>
                      {apt.visitType.replace("-", " ")}
                    </div>
                  </div>
                </div>
              </div>

                {(() => {
                  const appointmentDateTime = parse(`${apt.date} ${apt.time}`, "yyyy-MM-dd hh:mm a", new Date());
                  const isPassed = isAfter(new Date(), appointmentDateTime);
                  const isExpired = apt.status === "confirmed" && isPassed;

                  return (
                    <div className="grid grid-cols-2 md:flex md:flex-col gap-2 md:gap-3 w-full md:w-auto min-w-0 md:min-w-[150px]">
                      {apt.status === "pending" && apt.paymentStatus !== "paid" && (
                          <Button
                            variant="primary"
                            className="w-full col-span-2 md:col-span-1"
                            onClick={() => void handlePayFee(apt)}
                            disabled={payingId === apt.id}
                          >
                            {payingId === apt.id ? "Processing…" : `Pay Fee (₹${apt.fee})`}
                          </Button>
                      )}
                      {apt.paymentStatus === "paid" && apt.status === "confirmed" && (
                        <div className="flex w-full col-span-2 md:col-span-1 items-center justify-center gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-low/80 py-3 text-sm font-bold text-on-surface-variant opacity-70">
                          <span className="material-symbols-outlined text-primary text-lg">verified</span>
                          Paid — confirmed
                        </div>
                      )}
                      {apt.status === "confirmed" && apt.visitType === "video" && !isExpired && (
                          <Button variant="primary" className="w-full col-span-2 md:col-span-1 font-headline font-bold">Join Call</Button>
                      )}
                      {apt.status !== "cancelled" && apt.status !== "completed" && (
                          <Button 
                            variant="outline" 
                            className={`w-full ${isExpired ? "opacity-30 grayscale cursor-not-allowed" : "text-error border-error/20 hover:bg-error/5"}`}
                            onClick={() => !isExpired && handleCancelClick(apt.id!, apt.date, apt.time)}
                            disabled={isExpired}
                          >
                            Cancel
                          </Button>
                      )}
                      {apt.status === "completed" && (
                        <Button 
                          variant="primary" 
                          className="w-full bg-emerald-500 hover:bg-emerald-600 border-none" 
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setIsPrescriptionOpen(true);
                          }}
                        >
                          View Prescription
                        </Button>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => openReceipt(apt)}>View Receipt</Button>
                    </div>
                  );
                })()}
            </Card>
          ))
        ) : (
          <div className="text-center py-24 bg-surface-container-low rounded-[2.5rem] border border-dashed border-outline-variant/30">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">event_busy</span>
            <h3 className="text-xl font-bold font-headline">No Appointments Found</h3>
            <p className="text-on-surface-variant mt-2 mb-8">You haven't booked any medical consultations yet.</p>
            <Button size="lg" onClick={() => navigate("/doctors")}>Find a Doctor</Button>
          </div>
        )}
      </div>

      {isReceiptOpen && selectedAppointment && (
        <ReceiptModal 
          appointment={selectedAppointment} 
          onClose={() => setIsReceiptOpen(false)} 
          />
      )}

      {isPrescriptionOpen && selectedAppointment && (
        <ViewPrescriptionModal
            isOpen={isPrescriptionOpen}
            onClose={() => setIsPrescriptionOpen(false)}
            appointmentId={selectedAppointment.id}
        />
      )}

      {/* Cancellation Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Cancel Appointment"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
}

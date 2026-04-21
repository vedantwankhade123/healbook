"use client";

import React, { useState } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { Appointment } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDate: string, newTime: string) => void;
  appointment: Appointment | null;
  isLoading?: boolean;
}

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
  "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", 
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];

export const RescheduleModal = ({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  isLoading = false
}: RescheduleModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState("");

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold font-headline text-slate-900">
              Reschedule Appointment
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Patient: {appointment.patientName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center transition-colors shadow-sm">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Date Picker */}
          <section className="space-y-4">
            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Select New Date</h4>
            <div className="flex gap-3 overflow-x-auto pb-4 slim-scrollbar snap-x">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((offset) => {
                const date = addDays(new Date(), offset);
                const isSelected = format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
                return (
                  <button
                    key={offset}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 w-16 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all snap-start ${
                      isSelected 
                        ? "border-primary bg-primary text-white shadow-lg scale-105" 
                        : "border-slate-100 bg-slate-50 text-slate-600 hover:border-primary/30"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{format(date, "EEE")}</span>
                    <span className="text-xl font-bold font-poppins">{format(date, "dd")}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Time Slots */}
          <section className="space-y-4">
            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Select New Time</h4>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                    selectedTime === time 
                      ? "border-primary bg-primary text-white shadow-md" 
                      : "border-slate-100 bg-slate-50 text-slate-600 hover:border-primary/30"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </section>
        </div>
        
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={() => onConfirm(format(selectedDate, "yyyy-MM-dd"), selectedTime)}
            isLoading={isLoading}
            disabled={!selectedTime}
            className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            Confirm Reschedule
          </Button>
        </div>
      </div>
    </div>
  );
};

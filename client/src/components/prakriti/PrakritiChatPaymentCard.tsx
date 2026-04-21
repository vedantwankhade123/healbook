"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiJson } from "@/lib/api";
import type { Appointment } from "@/types";

export type ChatPaymentPrompt = {
  appointmentId: string;
  fee: number;
  doctorName: string;
  date: string;
  time: string;
  visitType?: string;
};

type Props = {
  prompt: ChatPaymentPrompt;
  onPaid: (appointmentId: string) => void;
  onError: (message: string) => void;
  isPaid: boolean;
};

export function PrakritiChatPaymentCard({ prompt, onPaid, onError, isPaid }: Props) {
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    if (isPaid || loading) return;
    setLoading(true);
    try {
      await apiJson<Appointment>(`/api/appointments/${prompt.appointmentId}/pay`, {
        method: "POST",
      });
      onPaid(prompt.appointmentId);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`mt-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-surface-container-low p-4 shadow-sm transition-opacity ${
        isPaid ? "opacity-60" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80">Consultation fee</p>
          <p className="font-headline text-base font-bold text-on-surface">{prompt.doctorName}</p>
          <p className="text-xs text-on-surface-variant">
            {prompt.date} · {prompt.time}
            {prompt.visitType ? ` · ${String(prompt.visitType).replace("-", " ")}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-primary">₹{prompt.fee}</p>
        </div>
      </div>
      {isPaid ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low py-3 text-sm font-bold text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
          Paid — booking confirmed
        </div>
      ) : (
        <Button
          type="button"
          variant="primary"
          className="w-full rounded-xl font-headline font-bold shadow-md shadow-primary/10"
          onClick={() => void pay()}
          disabled={loading}
        >
          {loading ? "Processing…" : `Pay now · ₹${prompt.fee}`}
        </Button>
      )}
    </div>
  );
}

"use client";

import React from "react";

export type PrakritiUiCard =
  | {
      kind: "doctor";
      id: string;
      name: string;
      specialization?: string;
      hospitalOrClinic?: string;
      fee?: number;
      rating?: number;
    }
  | {
      kind: "hospital";
      id: string;
      name: string;
      location?: string;
    }
  | {
      kind: "appointment";
      id: string;
      doctorName?: string;
      date?: string;
      time?: string;
      status?: string;
      paymentStatus?: string;
      fee?: number;
    }
  | {
      kind: "status";
      id: string;
      title: string;
      value: string;
      tone?: "neutral" | "success" | "warning";
    };

export function PrakritiGeneratedCards({ cards }: { cards: PrakritiUiCard[] }) {
  if (!cards.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {cards.map((card) => {
        if (card.kind === "doctor") {
          return (
            <div key={`${card.kind}-${card.id}`} className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-3">
              <div className="text-sm font-bold text-on-surface">{card.name}</div>
              <div className="text-xs text-on-surface-variant">
                {card.specialization || "General"}{card.hospitalOrClinic ? ` · ${card.hospitalOrClinic}` : ""}
              </div>
              <div className="mt-1 text-xs text-primary/80">
                {card.fee !== undefined ? `Fee: ₹${card.fee}` : "Fee: N/A"}
                {card.rating !== undefined ? ` · Rating: ${card.rating.toFixed(1)}` : ""}
              </div>
            </div>
          );
        }
        if (card.kind === "hospital") {
          return (
            <div key={`${card.kind}-${card.id}`} className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-primary/80">Hospital / Clinic</div>
              <div className="text-sm font-bold text-on-surface">{card.name}</div>
              {card.location ? <div className="text-xs text-on-surface-variant">{card.location}</div> : null}
            </div>
          );
        }
        if (card.kind === "appointment") {
          return (
            <div key={`${card.kind}-${card.id}`} className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-primary/80">Appointment</div>
              <div className="text-sm font-bold text-on-surface">{card.doctorName || "Doctor"}</div>
              <div className="text-xs text-on-surface-variant">
                {card.date || "Date TBD"} · {card.time || "Time TBD"}
              </div>
              <div className="mt-1 text-xs text-on-surface-variant">
                Status: <span className="font-semibold">{card.status || "pending"}</span>
                {card.paymentStatus ? ` · Payment: ${card.paymentStatus}` : ""}
                {card.fee !== undefined ? ` · ₹${card.fee}` : ""}
              </div>
            </div>
          );
        }
        const toneClass =
          card.tone === "success"
            ? "text-green-700 bg-green-50 border-green-200"
            : card.tone === "warning"
              ? "text-amber-700 bg-amber-50 border-amber-200"
              : "text-on-surface bg-surface-container-low border-outline-variant/15";
        return (
          <div key={`${card.kind}-${card.id}`} className={`rounded-2xl border p-3 ${toneClass}`}>
            <div className="text-[10px] font-bold uppercase tracking-wide">{card.title}</div>
            <div className="text-sm font-bold">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
}


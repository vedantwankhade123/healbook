"use client";

import React from 'react';
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";

// Tool 1: DoctorSearchCard
export const DoctorSearchCard = ({ result }: { result: any }) => {
  const navigate = useNavigate();
  
  if (!result || !result.success) {
    return <div className="p-4 bg-error-container text-on-error-container text-xs rounded-xl">Failed to search database.</div>;
  }

  if (result.count === 0) {
    return <div className="p-4 bg-surface-container text-on-surface-variant text-xs rounded-xl">No specialists found matching this requirement.</div>;
  }

  return (
    <div className="space-y-3 w-full my-2">
      <div className="text-[10px] uppercase font-bold text-outline tracking-widest pl-2">
         {result.reason || "Recommended Specialists"}
      </div>
      <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar snap-x">
        {result.doctors.map((doc: any) => (
          <Card key={doc.id} className="min-w-[240px] flex-shrink-0 snap-center p-4 flex flex-col gap-3 shadow-none border border-outline-variant/20 hover:border-primary/30 transition-all">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 flex-shrink-0">
                <img src={doc.profilePhoto || "https://ui-avatars.com/api/?name="+doc.name} alt={doc.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-poppins font-bold text-sm text-on-surface leading-tight">{doc.name}</h4>
                <div className="text-[10px] font-bold text-primary tracking-wide">{doc.specialization}</div>
                <div className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                   {doc.rating} <span className="material-symbols-outlined text-[10px] text-tertiary fill-1">star</span> • {doc.experience}y exp
                </div>
              </div>
            </div>
            <Button size="sm" className="w-full rounded-lg text-xs py-2" onClick={() => navigate(`/doctors/${doc.id}`)}>
              View Profile
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Tool 2: SymptomChecklist
export const SymptomChecklist = ({ parameters, addMessage }: { parameters: any, addMessage: (text: string) => Promise<boolean> }) => {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (submitted || isSubmitting) return;

    setIsSubmitting(true);
    const wasSent = await addMessage(`I am experiencing: ${selected.length > 0 ? selected.join(", ") : "None of these"}.`);
    if (wasSent) {
      setSubmitted(true);
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="p-4 my-2 border-l-4 border-l-primary shadow-sm bg-surface-container-lowest">
      <h4 className="font-poppins font-bold text-sm mb-3">{parameters.title}</h4>
      <div className="space-y-2 mb-4">
        {parameters.options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              disabled={submitted}
              className="w-4 h-4 rounded-md border-outline-variant/30 text-primary focus:ring-primary/20 transition-all"
              onChange={(e) => {
                if (e.target.checked) setSelected([...selected, opt]);
                else setSelected(selected.filter(s => s !== opt));
              }}
            />
            <span className="text-sm font-poppins text-on-surface-variant group-hover:text-on-surface">{opt}</span>
          </label>
        ))}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={handleSubmit} className="w-full rounded-lg text-xs" variant="primary" isLoading={isSubmitting}>
            Confirm Selection
        </Button>
      ) : (
        <div className="text-xs text-primary font-bold text-center">Submitted</div>
      )}
    </Card>
  );
};

// Tool 3: EmergencyWarning
export const EmergencyWarning = ({ parameters }: { parameters: any }) => {
  return (
    <div className="my-3 p-4 rounded-2xl bg-error-container text-on-error-container border border-error/20 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center gap-2 text-error">
        <span className="material-symbols-outlined fill-1">warning</span>
        <span className="font-poppins font-bold text-sm tracking-widest uppercase">Emergency Action Required</span>
      </div>
      <p className="text-xs font-poppins leading-relaxed">{parameters.reason}</p>
      <Button variant="outline" className="w-full bg-white text-error border-transparent hover:bg-error/10 rounded-xl text-xs py-2">
        {parameters.action}
      </Button>
    </div>
  );
};

// Tool 4: PriceEstimator
export const PriceEstimator = ({ parameters }: { parameters: any }) => {
  return (
    <Card className="my-2 p-4 flex flex-col gap-2 bg-gradient-to-br from-surface to-surface-container-high border-outline-variant/10">
        <div className="text-[10px] uppercase font-bold text-outline tracking-widest">Price Estimate</div>
        <div className="font-poppins font-bold text-sm text-on-surface">{parameters.service}</div>
        <div className="text-2xl font-black text-primary font-poppins tracking-tighter mt-1">
            {parameters.currency}{parameters.lowRange} <span className="text-sm text-outline-variant font-medium">to</span> {parameters.currency}{parameters.highRange}
        </div>
    </Card>
  );
};

// Tool 5: AppointmentCard
export const AppointmentCard = ({ parameters }: { parameters: any }) => {
    const navigate = useNavigate();
    return (
      <Card className="my-2 p-4 border-2 border-primary/10 flex items-center justify-between bg-primary/5">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Quick Book</span>
          <span className="font-poppins font-bold text-sm text-on-surface">{parameters.doctorName}</span>
        </div>
        <Button size="sm" onClick={() => navigate(`/appointments/book/${parameters.doctorId}`)} className="rounded-xl shadow-lg shadow-primary/20">
          Book Now
        </Button>
      </Card>
    );
};

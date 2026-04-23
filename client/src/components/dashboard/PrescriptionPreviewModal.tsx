import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { Appointment, Doctor } from "@/types";

interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  timing: string;
}

interface PrescriptionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  doctor: Doctor;
  notes: string;
  medicines: Medicine[];
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const PrescriptionPreviewModal: React.FC<PrescriptionPreviewModalProps> = ({
  isOpen,
  onClose,
  appointment,
  doctor,
  notes,
  medicines,
  onConfirm,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card variant="elevated" className="w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[95vh] overflow-hidden flex flex-col !rounded-none sm:!rounded-[2.5rem] border-none shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-white border-b border-slate-100 flex items-center justify-between">
           <div>
              <h2 className="text-xl font-black text-slate-900 font-poppins tracking-tighter">
                Final <span className="text-primary">Review</span>
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify clinical details before authorization</p>
           </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
               <span className="text-xs font-bold uppercase tracking-widest">Close</span>
            </button>
        </div>

        {/* Prescription Paper Content */}
        <div className="flex-1 overflow-y-auto py-6 px-0 sm:p-10 bg-slate-50/30 custom-scrollbar">
           <div className="w-full sm:max-w-2xl mx-auto bg-white shadow-xl rounded-none sm:rounded-3xl border-y sm:border border-x-0 sm:border-x border-slate-100 flex flex-col overflow-hidden min-h-[700px]">
                {/* Paper Header */}
                <div className="p-8 sm:p-10 border-b-2 border-slate-50 bg-gradient-to-br from-white to-slate-50/30">
                   <div className="flex justify-between items-start mb-8 sm:mb-12">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-lg font-black text-slate-900 font-poppins tracking-tighter">HealBook <span className="text-primary">Clinical</span></h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Digital Health Document</p>
                      </div>
                      <div className="text-right">
                         <div className="font-bold text-slate-900 text-base">{doctor.name}</div>
                         <p className="text-[10px] text-slate-400 font-medium">{doctor.clinicName}</p>
                         <div className="mt-3 flex flex-col items-end">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-md">Verified Digital Copy</span>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 sm:gap-10">
                      <div className="space-y-1">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Patient Name</span>
                         <div className="font-bold text-slate-900 text-sm">{appointment.patientName}</div>
                      </div>
                      <div className="space-y-1 text-right">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Document Date</span>
                         <div className="font-bold text-slate-900 text-sm">{format(new Date(), "dd MMM, yyyy")}</div>
                      </div>
                   </div>
                </div>

                {/* Paper Content */}
                <div className="p-8 sm:p-12 flex-1 space-y-10 relative">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                      <span className="text-[150px] font-black select-none">Rx</span>
                   </div>

                   {/* Observations */}
                    <div className="space-y-3">
                       <div className="text-slate-900 font-black text-[10px] uppercase tracking-widest">
                          Observations
                       </div>
                      <div className="text-sm text-slate-600 leading-relaxed min-h-[80px] font-medium italic">
                         {notes || "No clinical observations recorded."}
                      </div>
                   </div>

                   {/* Meds */}
                    <div className="space-y-5">
                       <div className="text-slate-900 font-black text-[10px] uppercase tracking-widest">
                          Medications
                       </div>
                      <div className="space-y-3">
                         {medicines.some(m => m.name) ? (
                            medicines.filter(m => m.name).map((med, i) => (
                               <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50">
                                  <div className="flex flex-col">
                                     <div className="font-bold text-slate-900 text-sm">{med.name}</div>
                                     <div className="text-[11px] text-slate-400 font-medium">{med.dosage} · {med.duration}</div>
                                  </div>
                                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                     {med.timing}
                                  </div>
                               </div>
                            ))
                         ) : (
                            <div className="text-slate-300 text-xs font-medium py-8 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                               No medications prescribed
                            </div>
                         )}
                      </div>
                   </div>
                </div>

                {/* Paper Footer */}
                 <div className="p-8 bg-slate-50/50 flex justify-between items-end border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2 opacity-30">
                       <div className="text-[7px] font-black uppercase tracking-widest leading-tight">Digital <br /> Auth</div>
                    </div>
                   <div className="text-right">
                      <div className="w-24 h-0.5 bg-slate-200 ml-auto mb-2 opacity-50"></div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Signature Verified</div>
                   </div>
                </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 sm:p-10 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
           <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase">
             By clicking authorize, you certify these clinical details.
           </p>
           <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button onClick={onClose} variant="ghost" className="flex-1 sm:flex-none h-12 px-8 rounded-xl font-bold text-slate-500">
                Edit
              </Button>
               <Button 
                 onClick={onConfirm} 
                 disabled={isSubmitting}
                 className="flex-1 sm:flex-none h-14 px-12 rounded-2xl font-bold bg-primary shadow-xl shadow-primary/20 text-white"
               >
                 {isSubmitting ? "Completing..." : "Complete"}
               </Button>
           </div>
        </div>
      </Card>
    </div>
  );
};

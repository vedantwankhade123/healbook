import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";

interface ViewPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
}

export const ViewPrescriptionModal: React.FC<ViewPrescriptionModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
}) => {
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescription = async () => {
      if (!appointmentId || !isOpen) return;
      setLoading(true);
      try {
        const docRef = doc(db, "prescriptions", appointmentId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setPrescription(snap.data());
        }
      } catch (error) {
        console.error("Error fetching prescription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [appointmentId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Card variant="elevated" className="w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col !rounded-none sm:!rounded-[2.5rem] border-none shadow-2xl animate-in zoom-in-95 duration-300">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-20 min-h-[400px]">
             <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest text-center">Loading Digital Prescription...</p>
          </div>
        ) : prescription ? (
          <>
            <div className="p-6 sm:p-10 bg-white border-b border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6">
                    <div className="space-y-1 text-center sm:text-left">
                        <h2 className="text-xl sm:text-3xl font-black text-slate-900 font-poppins tracking-tighter">
                            Digital <span className="text-primary">Prescription</span>
                        </h2>
                        <p className="text-slate-400 font-medium text-xs">Verified by HealBook Clinical Network</p>
                    </div>
                    <div className="text-center sm:text-right flex flex-col items-center sm:items-end w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50">
                        <div className="font-bold text-slate-900 font-poppins text-lg">{prescription.doctorName}</div>
                        <div className="text-slate-400 text-xs font-medium">{prescription.clinicName}</div>
                        <div className="text-primary font-bold text-[9px] uppercase tracking-widest mt-1 bg-primary/5 px-2 py-1 rounded-md">Regd. Practitioner</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 sm:space-y-10 custom-scrollbar bg-slate-50/50">
                {/* Patient Detail Header */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 p-4 sm:p-6 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl shadow-sm">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Issue Date</span>
                        <div className="font-bold text-slate-900 text-sm">{format(new Date(prescription.date), "dd MMM yyyy")}</div>
                    </div>
                    <div className="space-y-1 col-span-1 md:col-span-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Appointment Ref</span>
                        <div className="font-bold text-slate-900 text-sm truncate uppercase">{appointmentId}</div>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                        <div className="text-emerald-500 font-black text-[10px] uppercase tracking-widest text-right">
                            Verified Active
                        </div>
                    </div>
                </div>

                {/* Clinical Notes */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                        Clinical Notes
                    </h3>
                    <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 shadow-sm leading-relaxed text-slate-600 font-medium text-sm sm:text-base">
                        {prescription.notes || "No clinical notes provided."}
                    </div>
                </section>

                {/* Medications */}
                {prescription.medicines && prescription.medicines.length > 0 && (
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                            Medications (Rx)
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {prescription.medicines.map((med: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 sm:p-6 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl shadow-sm group hover:border-primary/20 transition-all">
                                    <div className="space-y-1">
                                        <div className="font-bold text-slate-900">
                                            {med.name}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium">{med.dosage} · {med.duration}</div>
                                    </div>
                                    <div className="px-4 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100">
                                        {med.timing}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <div className="p-6 sm:p-10 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="hidden sm:block">
                    <div className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40 leading-tight">
                        Authenticity <br /> Confirmed
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button onClick={() => window.print()} variant="outline" className="flex-1 sm:flex-none h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl border-slate-100 text-slate-600 flex items-center justify-center p-0">
                        <span className="material-symbols-outlined text-xl sm:text-2xl">download</span>
                    </Button>
                    <Button onClick={onClose} className="flex-[3] sm:flex-none h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-primary font-bold px-8">Close</Button>
                </div>
            </div>
          </>
        ) : (
          <div className="p-20 text-center space-y-4">
             <span className="material-symbols-outlined text-6xl text-slate-200">description_off</span>
             <h3 className="text-lg font-bold text-slate-900 font-poppins">No digital prescription found</h3>
             <p className="text-slate-400 text-sm max-w-xs mx-auto">The doctor may not have uploaded a digital prescription for this session yet.</p>
             <Button onClick={onClose} variant="ghost" className="mt-4">Go Back</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

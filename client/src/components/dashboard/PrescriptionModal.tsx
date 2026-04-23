import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Appointment, Doctor } from "@/types";
import { format } from "date-fns";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { PrescriptionPreviewModal } from "./PrescriptionPreviewModal";

interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  timing: string;
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  doctor: Doctor;
  onSubmit: (data: { notes: string; medicines: Medicine[] }) => Promise<void>;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  appointment,
  doctor,
  onSubmit,
}) => {
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: "", dosage: "", duration: "", timing: "After Food" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNotesVisible, setIsNotesVisible] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchExisting = async () => {
      if (!appointment.id || !isOpen) return;
      setIsLoading(true);
      try {
        const docRef = doc(db, "prescriptions", appointment.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setNotes(data.notes || "");
          if (data.notes) setIsNotesVisible(true);
          if (data.medicines && data.medicines.length > 0) {
            setMedicines(data.medicines);
          }
        } else {
          setNotes("");
          setMedicines([{ name: "", dosage: "", duration: "", timing: "After Food" }]);
          setIsNotesVisible(false);
        }
      } catch (error) {
        console.error("Error fetching existing prescription:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExisting();
  }, [appointment.id, isOpen]);

  if (!isOpen) return null;

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "", duration: "", timing: "After Food" }]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const newMedicines = [...medicines];
    newMedicines[index] = { ...newMedicines[index], [field]: value };
    setMedicines(newMedicines);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ notes, medicines: medicines.filter(m => m.name.trim() !== "") });
      setIsPreviewOpen(false);
      onClose();
    } catch (error) {
      console.error("Prescription submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <Card variant="elevated" className="w-full sm:max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col !rounded-none sm:!rounded-[2.5rem] border-none shadow-2xl animate-in zoom-in-95 duration-300 bg-slate-50 sm:bg-white">
          {/* Header - Prescription Pad Style */}
          <div className="p-5 sm:p-10 bg-transparent sm:bg-white border-b border-slate-100 flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 sm:gap-6">
              <div className="space-y-1 w-full sm:w-auto text-center sm:text-left">
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 font-poppins tracking-tighter flex items-center justify-center sm:justify-start gap-2 sm:ml-0">
                <span className="hidden sm:inline">Medical </span>Prescription
              </h2>
                <div className="flex items-center justify-center sm:justify-start gap-x-2 text-slate-500 font-medium text-[10px] sm:text-sm sm:ml-0 mt-1 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    {format(new Date(), "MMM dd")}
                  </div>
                  <div className="text-slate-300">•</div>
                  <div className="flex items-center gap-1">
                    ID: <span className="font-bold text-slate-700">{appointment.id.split('_').pop()?.toUpperCase() || 'HB-NEW'}</span>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right flex flex-col sm:items-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                <div className="font-bold text-slate-900 font-poppins text-base sm:text-lg leading-tight">{doctor.name}</div>
                <div className="text-primary font-black text-[9px] sm:text-[10px] uppercase tracking-widest mt-0.5">{doctor.specialization}</div>
                <div className="text-slate-400 text-[10px] sm:text-xs font-medium mt-1">{doctor.clinicName}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5 sm:mt-10 pt-4 pb-4 pl-0 pr-4 sm:p-6 bg-transparent sm:bg-slate-50/50 rounded-none sm:rounded-3xl border border-slate-100/50 sm:border-slate-100/50 border-x-0 sm:border-x">
              <div className="space-y-0.5 ml-0.5 sm:ml-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Patient Name</span>
                <div className="font-bold text-slate-900 text-sm sm:text-lg truncate">{appointment.patientName}</div>
              </div>
              <div className="space-y-0.5 text-right px-4 sm:px-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Consultation</span>
                <div className="font-bold text-primary text-sm sm:text-lg capitalize truncate">{appointment.visitType} Visit</div>
              </div>
            </div>
          </div>

          {/* Content - Scrollable Form */}
          <div className="flex-1 overflow-y-auto py-6 px-0 sm:px-10 space-y-8 sm:space-y-10 custom-scrollbar">
            {isLoading ? (
              <div className="p-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Checking Clinical History...</p>
              </div>
            ) : (
              <>
                {!isNotesVisible ? (
                  <div 
                    onClick={() => setIsNotesVisible(true)}
                    className="mx-5 sm:mx-0 p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-all">Click to add clinical observations</p>
                  </div>
                ) : (
                  <section className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-5 sm:px-0">
                      Clinical Notes & Diagnosis
                    </h3>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter clinical observations, diagnosis, or advice for the patient..."
                      className="w-full min-h-[180px] p-5 sm:p-6 rounded-none sm:rounded-3xl bg-transparent sm:bg-slate-50 border-y sm:border border-x-0 sm:border-x border-slate-100 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-body text-slate-700 placeholder:text-slate-400 text-sm sm:text-base"
                    />
                  </section>
                )}

                {/* Medicines */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between px-5 sm:px-0">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                      Medications (Rx)
                    </h3>

                    <Button
                      type="button"
                      onClick={addMedicine}
                      variant="outline"
                      className="h-9 px-4 rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-widest"
                    >
                      Add Medicine
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {medicines.map((med, index) => (
                      <div key={index} className="group relative p-5 sm:p-6 bg-transparent sm:bg-white border-y sm:border border-x-0 sm:border-x border-slate-100 rounded-none sm:rounded-3xl hover:shadow-md transition-all space-y-4 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-4">
                        <div className="sm:col-span-4 px-1 sm:px-0">
                          <label className="block sm:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Medicine Name</label>
                          <input
                            placeholder="Medicine Name"
                            value={med.name}
                            onChange={(e) => updateMedicine(index, "name", e.target.value)}
                            className="w-full bg-transparent p-3 sm:p-0 rounded-none sm:rounded-none font-bold text-slate-900 placeholder:text-slate-300 outline-none text-sm sm:text-base"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block sm:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dosage</label>
                          <input
                            placeholder="Dosage"
                            value={med.dosage}
                            onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                            className="w-full bg-transparent p-3 sm:p-0 rounded-none sm:rounded-none text-sm text-slate-600 placeholder:text-slate-300 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block sm:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</label>
                          <input
                            placeholder="Duration"
                            value={med.duration}
                            onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                            className="w-full bg-transparent p-3 sm:p-0 rounded-none sm:rounded-none text-sm text-slate-600 placeholder:text-slate-300 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block sm:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timing</label>
                          <div className="relative">
                            <select
                              value={med.timing}
                              onChange={(e) => updateMedicine(index, "timing", e.target.value)}
                              className="w-full bg-transparent p-3 sm:p-0 rounded-none sm:rounded-none text-sm text-slate-600 outline-none appearance-none cursor-pointer pr-8"
                            >
                              <option>Before Food</option>
                              <option>After Food</option>
                              <option>Empty Stomach</option>
                              <option>At Bedtime</option>
                            </select>
                          </div>
                        </div>
                        <div className="sm:col-span-1 flex justify-end items-center pt-2 sm:pt-0">
                          <button
                            onClick={() => removeMedicine(index)}
                            className="w-full sm:w-auto h-10 sm:h-auto flex items-center justify-center bg-transparent sm:bg-transparent rounded-none sm:rounded-none text-red-500 sm:text-slate-300 sm:hover:text-red-500 transition-colors font-bold text-xs uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 sm:p-10 bg-transparent sm:bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 flex-shrink-0">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-tight text-center sm:text-left uppercase">
              Review & preview before <span className="text-emerald-500">Finishing</span>.
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                onClick={onClose}
                variant="ghost"
                className="hidden sm:flex flex-1 sm:flex-none h-12 sm:h-14 px-8 rounded-xl sm:rounded-2xl font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setIsPreviewOpen(true)}
                className="flex-1 sm:flex-none h-12 sm:h-14 px-10 rounded-xl sm:rounded-2xl font-bold bg-primary shadow-xl shadow-primary/20 w-full sm:w-auto"
              >
                Preview<span className="hidden sm:inline"> & Finalize</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <PrescriptionPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        appointment={appointment}
        doctor={doctor}
        notes={notes}
        medicines={medicines}
        onConfirm={handleFinalSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

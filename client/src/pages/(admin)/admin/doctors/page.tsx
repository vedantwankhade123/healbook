"use client";

import React, { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Doctor } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CloudinaryUpload } from "@/components/ui/CloudinaryUpload";
import { useToast } from "@/context/ToastContext";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { loading: toastLoading, success, error, dismiss } = useToast();

  const [newDoctor, setNewDoctor] = useState({
      name: "",
      email: "",
      specialization: "",
      clinicName: "",
      profilePhoto: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "doctors"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setDoctors(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Doctor)));
    } catch (e) {
      console.error("Error fetching doctors:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Pagination Logic
  const totalPages = Math.ceil(doctors.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDoctors = doctors.slice(indexOfFirstItem, indexOfLastItem);

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newDoctor.profilePhoto) {
          error("Please upload a profile photo.");
          return;
      }

      setLoading(true);
      try {
          await addDoc(collection(db, "doctors"), {
              ...newDoctor,
              rating: 4.5,
              createdAt: serverTimestamp(),
          });
          success("Practitioner registered successfully!");
          setIsModalOpen(false);
          setNewDoctor({ name: "", email: "", specialization: "", clinicName: "", profilePhoto: "" });
          fetchDoctors();
      } catch (err) {
          error("Failed to register practitioner.");
      } finally {
          setLoading(false);
      }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "doctors", deleteId));
      setDoctors(prev => prev.filter(d => d.id !== deleteId));
      success("Doctor removed from registry");
      setDeleteId(null);
    } catch (e) {
      error("Deletion failed");
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const id = toastLoading("Syncing 220+ clinical profiles... this will create active user accounts.");
    try {
      const res = await fetch("/api/seed/doctors", { 
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.results) {
        dismiss(id);
        success(`Sync complete: ${data.results.success} active doctor accounts created.`);
        fetchDoctors();
      } else {
        throw new Error(data.error || "Sync failed");
      }
    } catch (err: any) {
      dismiss(id);
      error(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 font-poppins tracking-tight flex items-center gap-4">
              Doctor Registry
              {doctors.length > 0 && (
                <Badge variant="primary" className="h-8 px-4 rounded-full text-base font-black shadow-lg shadow-primary/10">
                  {doctors.length}
                </Badge>
              )}
          </h1>
          <p className="text-slate-500 font-body text-sm mt-2">Manage the verified practitioner network for the ecosystem.</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={handleSeed} isLoading={isSeeding} className="rounded-2xl h-12 border-slate-200 hover:bg-slate-50 text-[10px] font-semibold">
                Bulk Sync Doctors
            </Button>
            <Button size="lg" className="rounded-2xl h-12 px-8 shadow-lg shadow-primary/20" onClick={() => setIsModalOpen(true)}>
                Onboard Doctors
            </Button>
        </div>
      </section>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 lg:p-10 shadow-2xl relative border border-slate-200">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h2 className="font-poppins font-bold text-3xl text-slate-900 mb-2">New Practitioner</h2>
                <p className="text-slate-500 font-body text-sm mb-8 italic">Credential verification and onboarding</p>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="flex flex-col sm:flex-row gap-6 mb-4">
                        <div className="flex-1 space-y-4">
                            <Input 
                                label="Full Name" 
                                placeholder="Dr. Sameer Patil" 
                                required 
                                value={newDoctor.name}
                                onChange={e => setNewDoctor({...newDoctor, name: e.target.value})}
                                icon="person"
                                className="rounded-2xl border-slate-200"
                            />
                            <Input 
                                label="Email" 
                                type="email" 
                                placeholder="doctor@healbook.in" 
                                required 
                                value={newDoctor.email}
                                onChange={e => setNewDoctor({...newDoctor, email: e.target.value})}
                                icon="mail"
                                className="rounded-2xl border-slate-200"
                            />
                        </div>
                        <div className="flex flex-col items-center justify-center w-36 gap-3">
                            <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group">
                                {newDoctor.profilePhoto ? (
                                    <img src={newDoctor.profilePhoto} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <span className="material-symbols-outlined text-slate-300 text-4xl">add_a_photo</span>
                                )}
                            </div>
                            <CloudinaryUpload 
                                label={newDoctor.profilePhoto ? "Update Photo" : "Upload ID"} 
                                folder="doctors" 
                                icon="upload"
                                className="text-[9px] h-8 px-4 font-headline font-semibold"
                                onSuccess={(url) => setNewDoctor({...newDoctor, profilePhoto: url})} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <Input 
                            label="Specialization" 
                            placeholder="e.g. Cardiologist" 
                            required 
                            value={newDoctor.specialization}
                            onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})}
                            icon="stethoscope"
                            className="rounded-2xl border-slate-200"
                        />
                        <Input 
                            label="Clinic Name" 
                            placeholder="e.g. City Care" 
                            required 
                            value={newDoctor.clinicName}
                            onChange={e => setNewDoctor({...newDoctor, clinicName: e.target.value})}
                            icon="home_health"
                            className="rounded-2xl border-slate-200"
                        />
                    </div>

                    <div className="pt-6">
                        <Button type="submit" className="w-full h-14 rounded-2xl text-base font-headline font-semibold shadow-xl shadow-primary/10" isLoading={loading}>
                            Finalize Onboarding
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <Card variant="flat" className="p-0 overflow-hidden border-none rounded-none bg-transparent shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-transparent">
                <th className="px-8 py-4 text-xs font-bold text-slate-500 font-poppins">Practitioner</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 font-poppins">Specialization</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 font-poppins text-center">Cloud ID</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 font-poppins text-right">Registry Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-0 bg-transparent">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-10 h-24 bg-white/50 rounded-3xl" />
                  </tr>
                ))
              ) : currentDoctors.length > 0 ? (
                currentDoctors.map((doctor) => (
                  <tr key={doctor.id} className="group bg-white hover:bg-slate-50 transition-all border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                    <td className="px-8 py-6 rounded-l-3xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                            <img src={doctor.profilePhoto} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 font-poppins">{doctor.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium font-body truncate max-w-[150px]">{doctor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                             <Badge variant="primary" size="sm" className="font-poppins text-[10px] w-fit italic">{doctor.specialization}</Badge>
                            <span className="text-[10px] text-slate-400 font-semibold ml-1">{doctor.clinicName}</span>
                        </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                            <span className="text-xs font-mono text-slate-500">{doctor.id.substring(0, 8)}</span>
                        </div>
                    </td>
                    <td className="px-8 py-6 text-right rounded-r-3xl">
                      <div className="flex justify-end gap-2 text-right">
                        <Button variant="ghost" size="sm" className="h-9 px-4 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-xl">Edit</Button>
                        <Button variant="outline" size="sm" className="h-9 px-4 text-red-500 border-none bg-red-50 hover:bg-red-100 rounded-xl font-bold" onClick={() => setDeleteId(doctor.id)}>Revoke</Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="max-w-xs mx-auto">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">medical_information</span>
                        <h3 className="font-headline font-bold text-slate-800">Registry Empty</h3>
                        <p className="text-xs text-slate-400">Initialize the clinical dataset using the sync tool on the dashboard.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && doctors.length > itemsPerPage && (
          <div className="px-8 py-6 flex justify-between items-center border-t border-slate-50 bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-poppins">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, doctors.length)} of {doctors.length} Doctors
            </p>
            <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-6 rounded-xl border-slate-200 bg-white text-slate-600 font-bold text-xs"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-6 rounded-xl border-slate-200 bg-white text-slate-600 font-bold text-xs"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmationModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Revoke Credentials"
        message="Are you sure you want to remove this practitioner from the registry? This action will disable their access to the clinical ecosystem."
        confirmText="Revoke"
        variant="danger"
      />
    </div>
  );
}

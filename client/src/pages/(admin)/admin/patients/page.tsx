"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { User } from "@/types";
import { useToast } from "@/context/ToastContext";

export default function PatientDirectoryPage() {
  const [patients, setPatients] = useState<User[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const toast = useToast();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "patient"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        setPatients(data);
        setFilteredPatients(data);
      } catch (error: any) {
        console.error("Error fetching patients:", error);
        toast.error("Failed to load patient directory");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 font-poppins tracking-tight">
              Patient Directory
          </h1>
          <p className="text-slate-500 font-poppins text-sm mt-2">Manage the registered health seekers on the platform.</p>
        </div>
        
        <div className="w-full md:w-80">
          <Input 
            placeholder="Search by name or email..." 
            icon="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-2xl bg-white border-slate-200"
          />
        </div>
      </section>

      <Card variant="flat" className="p-0 overflow-hidden border-none rounded-none bg-transparent shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-transparent">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 font-poppins">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 font-poppins">Email Address</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 font-poppins">Joined Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 font-poppins text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-8 h-20 bg-white/50 rounded-3xl" />
                  </tr>
                ))
              ) : currentPatients.length > 0 ? (
                currentPatients.map((patient) => (
                  <tr key={patient.uid} className="bg-white hover:bg-slate-50 transition-all border border-slate-100 shadow-sm rounded-3xl overflow-hidden group">
                    <td className="px-6 py-5 rounded-l-3xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/5 group-hover:scale-110 transition-transform">
                            {patient.profilePhoto ? (
                                <img src={patient.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : patient.name[0]}
                        </div>
                        <span className="font-semibold text-slate-800 font-poppins">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium font-poppins">{patient.email}</td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                        {patient.createdAt?.toDate ? patient.createdAt.toDate().toLocaleDateString() : "New User"}
                    </td>
                    <td className="px-6 py-5 text-right space-x-2 rounded-r-3xl">
                        <Button variant="ghost" size="sm" className="text-primary font-bold text-xs h-9 hover:bg-primary/5 rounded-xl">View Records</Button>
                        <Button variant="outline" size="sm" className="text-slate-500 font-bold text-xs h-9 border-none bg-slate-50 hover:bg-slate-100 rounded-xl">Manage</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="max-w-xs mx-auto">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-4">search_off</span>
                        <h3 className="font-poppins font-bold text-slate-800">No Patients Found</h3>
                        <p className="text-xs text-slate-400 font-poppins">Try adjusting your search criteria or check the database sync status.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && filteredPatients.length > itemsPerPage && (
          <div className="px-8 py-6 flex justify-between items-center border-t border-slate-50 bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-poppins">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length} Patients
            </p>
            <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-6 rounded-xl border-slate-200 bg-white text-slate-600 font-bold text-xs font-poppins"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-6 rounded-xl border-slate-200 bg-white text-slate-600 font-bold text-xs font-poppins"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

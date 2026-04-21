"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MedicalRecord } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CloudinaryUpload } from "@/components/ui/CloudinaryUpload";
import { addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

const recordTypes = ["All", "Report", "Prescription", "Lab Result", "Other"];

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isSelectAllPromptOpen, setIsSelectAllPromptOpen] = useState(false);
  const [isUploadMetaModalOpen, setIsUploadMetaModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("Other");
  const [pendingUpload, setPendingUpload] = useState<{ url: string; publicId?: string } | null>(null);
  const [isSavingUploadMeta, setIsSavingUploadMeta] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user) return;
      try {
        let q = query(
          collection(db, "medical_records"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord)));
      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [user]);

  const filteredRecords = filter === "All" 
    ? records 
    : records.filter(r => r.type.toLowerCase() === filter.toLowerCase().replace(" ", "_"));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => r.id!));
    }
  };

  const handleDelete = async () => {
    if (!deletingId && selectedIds.length === 0) return;
    setIsActionLoading(true);
    try {
      if (deletingId) {
        await deleteDoc(doc(db, "medical_records", deletingId));
        setRecords(prev => prev.filter(r => r.id !== deletingId));
        toast.success("Record deleted successfully");
      } else {
        await Promise.all(selectedIds.map(id => deleteDoc(doc(db, "medical_records", id))));
        setRecords(prev => prev.filter(r => !selectedIds.includes(r.id!)));
        setSelectedIds([]);
        toast.success(`${selectedIds.length} records deleted successfully`);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record(s)");
    } finally {
      setIsActionLoading(false);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const handleUploadSuccess = (url: string, publicId?: string) => {
    setPendingUpload({ url, publicId });
    setUploadTitle("");
    setUploadType("Other");
    setIsUploadMetaModalOpen(true);
  };

  const handleSaveUploadMeta = async () => {
    if (!user || !pendingUpload) return;

    const title = uploadTitle.trim() || "New Medical Record";
    const type = uploadType.toLowerCase().replace(" ", "_");

    setIsSavingUploadMeta(true);
    try {
      await addDoc(collection(db, "medical_records"), {
        userId: user.uid,
        title,
        type,
        fileUrl: pendingUpload.url,
        publicId: pendingUpload.publicId,
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        createdAt: serverTimestamp(),
      });
      toast.success("Record uploaded and archived successfully!");
      setIsUploadMetaModalOpen(false);
      setPendingUpload(null);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to save record metadata.");
    } finally {
      setIsSavingUploadMeta(false);
    }
  };

  return (
    <>
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-on-surface font-poppins tracking-tight mb-2">
              Medical <span className="text-primary">Archives</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {filteredRecords.length > 0 && (
            <Button
              variant="error"
              size="sm"
              className="!h-11 !rounded-full !px-6 !py-0 bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20"
              onClick={() => {
                if (selectedIds.length > 0) {
                  setIsDeleteModalOpen(true);
                } else {
                  setIsSelectAllPromptOpen(true);
                }
              }}
            >
              <span className="material-symbols-outlined text-[18px] mr-2 text-white">delete</span>
              Delete{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
            </Button>
          )}
          <CloudinaryUpload 
              label="Upload Archives"
              icon="upload_file"
              className="shadow-xl shadow-primary/20"
              onSuccess={(url, publicId) => {
                handleUploadSuccess(url, publicId);
              }}
          />
        </div>
      </section>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2">
        <div className="w-full md:w-auto">
          <div className="md:hidden">
            <label htmlFor="records-filter" className="sr-only">Filter records</label>
            <div className="relative">
              <select
                id="records-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full h-11 appearance-none rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 pr-10 text-sm font-semibold text-on-surface-variant outline-none transition-all focus:border-primary"
              >
                {recordTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant">
                expand_more
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-wrap gap-2">
          {recordTypes.map(t => (
              <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-6 py-2.5 rounded-full text-xs font-semibold transition-all border ${
                      filter === t 
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                          : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-primary/50"
                  }`}
              >
                  {t}
              </button>
          ))}
          </div>
        </div>

        {filteredRecords.length > 0 && <div className="hidden md:block" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-48 bg-surface-container-low animate-pulse rounded-2xl" />)
        ) : filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <Card key={record.id} variant="outline" className={`group p-0 overflow-hidden hover:border-primary/40 transition-all flex flex-col relative ${selectedIds.includes(record.id!) ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.02]' : ''}`}>
              {/* Individual Delete Action */}
              <button 
                onClick={() => { setDeletingId(record.id!); setIsDeleteModalOpen(true); }}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-outline-variant/50 text-on-surface-variant hover:text-red-500 hover:border-red-500/50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>

              <div className="p-6 pt-12 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">
                            {record.type === 'prescription' ? 'prescriptions' : 'description'}
                        </span>
                    </div>
                    <Badge variant={record.type === 'report' ? 'primary' : 'secondary'}>
                        {record.type.replace("_", " ")}
                    </Badge>
                </div>
                <div>
                    <h3 className="font-headline font-bold text-lg text-on-surface truncate">{record.title}</h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">Uploaded on {record.date}</p>
                </div>
                {record.doctorName && (
                    <div className="pt-2 border-t border-outline-variant/5">
                        <p className="text-[10px] font-semibold text-outline-variant mb-1">Doctor</p>
                        <p className="text-xs font-medium text-on-surface truncate">{record.doctorName}</p>
                    </div>
                )}
              </div>
              
              <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/10 flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 text-[10px] font-black uppercase tracking-wider" onClick={() => window.open(record.fileUrl, '_blank')}>View</Button>
                <Button variant="outline" size="sm" className="flex-1 text-[10px] font-black uppercase tracking-wider" onClick={() => window.open(record.fileUrl, '_blank')}>Download</Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-24 bg-surface-container-low rounded-[2.5rem] border border-dashed border-outline-variant/30">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">folder_off</span>
            <h3 className="text-xl font-bold font-headline">No <span className="text-primary">Records Found</span></h3>
            <p className="text-on-surface-variant mt-2">Start by uploading your first medical document.</p>
          </div>
        )}
      </div>
    </div>
    <ConfirmationModal 
      isOpen={isDeleteModalOpen}
      onClose={() => { setIsDeleteModalOpen(false); setDeletingId(null); }}
      onConfirm={handleDelete}
      title={deletingId ? "Delete Record" : "Delete Selected Records"}
      message={deletingId ? "Are you sure you want to delete this medical archive? This action cannot be undone." : `Are you sure you want to delete ${selectedIds.length} medical records? This action cannot be undone.`}
      confirmText="Delete Permanently"
      variant="danger"
      isLoading={isActionLoading}
    />
    <ConfirmationModal
      isOpen={isSelectAllPromptOpen}
      onClose={() => setIsSelectAllPromptOpen(false)}
      onConfirm={() => {
        toggleSelectAll();
        setIsSelectAllPromptOpen(false);
        setIsDeleteModalOpen(true);
      }}
      title="Select records to delete"
      message="No records are selected. Do you want to select all records in this filter and delete them?"
      confirmText="Select all"
      cancelText="Cancel"
      variant="warning"
    />
    {isUploadMetaModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
        <div
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 sm:p-8">
            <h3 className="text-xl font-bold font-headline text-slate-900 mb-2">Add Record Details</h3>
            <p className="text-sm text-slate-500 font-body leading-relaxed mb-6">
              Add a title and select the category before archiving this file.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="record-title" className="text-xs font-bold text-slate-600 tracking-wide">Title</label>
                <input
                  id="record-title"
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Blood Test Report - March"
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30"
                />
              </div>

              <div>
                <label htmlFor="record-type" className="text-xs font-bold text-slate-600 tracking-wide">Type</label>
                <select
                  id="record-type"
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 bg-white"
                >
                  {recordTypes.filter((t) => t !== "All").map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadMetaModalOpen(false);
                  setPendingUpload(null);
                }}
                className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                disabled={isSavingUploadMeta}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveUploadMeta}
                isLoading={isSavingUploadMeta}
                className="flex-1 h-12 rounded-xl font-bold text-xs shadow-none"
              >
                Save Record
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

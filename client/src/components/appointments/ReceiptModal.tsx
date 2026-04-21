"use client";

import React, { useRef } from "react";
import { format } from "date-fns";
import { Appointment } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";

interface ReceiptModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export const ReceiptModal = ({ appointment, onClose }: ReceiptModalProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const downloadJPG = async () => {
    if (receiptRef.current === null) return;
    const dataUrl = await toJpeg(receiptRef.current, { quality: 0.95, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `receipt-${appointment.id}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const downloadPDF = async () => {
    if (receiptRef.current === null) return;
    const dataUrl = await toJpeg(receiptRef.current, { quality: 0.95, backgroundColor: "#ffffff" });
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`receipt-${appointment.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[92vh] md:max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <Card className="p-0 overflow-hidden shadow-2xl bg-white border-0 flex flex-col h-full">
          {/* Header Actions */}
          <div className="flex justify-between items-center p-3 md:p-6 border-b border-surface-container-low bg-surface-container-lowest">
            <h3 className="font-bold font-poppins text-base md:text-lg">Receipt<span className="hidden md:inline"> Appointment</span></h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadJPG} className="gap-1 md:gap-2 px-2.5 md:px-3">
                <span className="material-symbols-outlined text-sm">image</span>
                <span className="hidden sm:inline">JPG</span>
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPDF} className="gap-1 md:gap-2 px-2.5 md:px-3">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <button 
                onClick={onClose}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Receipt Content - This is what gets captured for download */}
          <div className="flex-1 overflow-y-auto slim-scrollbar">
            <div ref={receiptRef} className="p-4 md:p-12 bg-white space-y-6 md:space-y-10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="space-y-2">
                <div className="text-xl md:text-2xl font-black text-primary font-headline tracking-tighter">HealBook</div>
                <div className="text-xs text-outline font-bold tracking-widest">Medical Consultation Receipt</div>
              </div>
              <div className="text-left sm:text-right space-y-1">
                <div className="text-sm font-bold text-on-surface">Receipt #: {appointment.id?.slice(-8)}</div>
                <div className="text-sm text-outline-variant font-medium">Issued: {format(new Date(), "MMMM dd, yyyy")}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 border-y border-surface-container py-6 md:py-8">
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-outline tracking-widest">Patient Details</div>
                <div className="space-y-1">
                    <div className="font-bold text-on-surface text-lg">{appointment.patientName}</div>
                    <div className="text-sm text-on-surface-variant line-clamp-1">Ref: {appointment.patientId}</div>
                </div>
              </div>
              <div className="space-y-4 text-left md:text-right">
                <div className="text-[10px] font-bold text-outline tracking-widest">Consulting Doctor</div>
                <div className="space-y-1">
                    <div className="font-bold text-on-surface text-lg">{appointment.doctorName}</div>
                    <div className="text-sm text-primary font-bold tracking-tight">{appointment.doctorSpecialization}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
                <div className="text-[10px] font-bold text-outline tracking-widest">Consultation Info</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 bg-surface-container-low/50 p-4 md:p-6 rounded-2xl">
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-outline-variant">Date</div>
                        <div className="font-bold text-on-surface text-sm">{appointment.date}</div>
                    </div>
                    <div className="space-y-1 md:border-x border-outline-variant/20 md:px-6 text-left md:text-center">
                        <div className="text-[10px] font-bold text-outline-variant">Time</div>
                        <div className="font-bold text-on-surface text-sm">{appointment.time}</div>
                    </div>
                    <div className="space-y-1 text-left md:text-right">
                        <div className="text-[10px] font-bold text-outline-variant">Type</div>
                        <div className="font-bold text-on-surface text-sm capitalize">{appointment.visitType.replace("-", " ")}</div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="text-[10px] font-bold text-outline tracking-widest">Clinical Reason</div>
                <div className="p-4 md:p-6 rounded-2xl border border-surface-container italic text-on-surface-variant font-medium leading-relaxed bg-surface-container-lowest">
                    "{appointment.reason}"
                </div>
            </div>

            <div className="pt-8 border-t-2 border-dashed border-surface-container space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-primary/5 p-4 md:p-6 rounded-2xl">
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-primary tracking-widest">Payment Status</div>
                        <Badge variant="secondary" className="px-3 py-1">Online Payment Verified</Badge>
                    </div>
                    <div className="text-left sm:text-right">
                        <div className="text-[10px] font-bold text-outline-variant tracking-widest mb-1">Total Fee Paid</div>
                        <div className="text-2xl md:text-3xl font-black text-primary font-poppins tracking-tighter">₹{appointment.fee}</div>
                    </div>
                </div>
                <div className="text-[10px] text-center text-outline font-bold tracking-[0.2em] pt-4">This is a digital consultation receipt generated by HealBook</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

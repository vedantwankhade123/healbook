"use client";

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiJson } from "@/lib/api";
import { Facility, Doctor } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function FacilityDetailPage() {
  const { id } = useParams();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [f, d] = await Promise.all([
          apiJson<Facility>(`/api/facilities/${encodeURIComponent(id)}`),
          apiJson<Doctor[]>(`/api/facilities/${encodeURIComponent(id)}/doctors`)
        ]);
        setFacility(f);
        setDoctors(d);
      } catch (error) {
        console.error("Error fetching facility data:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id]);

  if (loading) return (
    <div className="animate-pulse space-y-10">
        <div className="h-96 bg-surface-container-low rounded-[3rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="h-64 bg-surface-container-low rounded-3xl" />
            </div>
            <div className="h-96 bg-surface-container-low rounded-3xl" />
        </div>
    </div>
  );

  if (!facility) return <div className="text-center py-20 font-poppins font-bold">Facility not found.</div>;

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <section className="relative h-[24rem] md:h-[30rem] rounded-xl md:rounded-[3rem] overflow-hidden shadow-2xl">
        <img 
            src={facility.image} 
            alt={facility.name} 
            className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-4 right-4 md:bottom-12 md:left-12 md:right-12 text-white">
            <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary" className="bg-primary text-white border-none px-4 py-1.5 capitalize font-bold text-xs">
                    {facility.type}
                </Badge>
                <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                    <span className="material-symbols-outlined text-tertiary text-sm fill-1">star</span>
                    <span className="text-xs font-bold font-poppins">{facility.rating} Patient Rating</span>
                </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-poppins tracking-tighter mb-3 md:mb-4">{facility.name}</h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-6 opacity-90">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-fixed">location_on</span>
                    <span className="text-sm font-medium font-poppins">{facility.address}, {facility.city}</span>
                </div>
                {facility.contact && (
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-fixed">call</span>
                        <span className="text-sm font-medium font-poppins">{facility.contact}</span>
                    </div>
                )}
            </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
                <h2 className="text-2xl font-bold font-poppins text-on-surface">About the Facility</h2>
                <p className="text-on-surface-variant font-body text-xl leading-relaxed italic opacity-80 border-l-4 border-primary pl-8 py-2">
                    {facility.description}
                </p>
                <div className="flex flex-wrap gap-3 pt-4">
                    {facility.specializations.map(s => (
                        <span key={s} className="px-6 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/10 font-poppins font-bold text-xs text-primary">
                            {s}
                        </span>
                    ))}
                </div>
            </section>

            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-poppins text-on-surface">Affiliated Specialists</h2>
                    <Badge variant="neutral" className="bg-surface-container text-on-surface-variant h-8 px-4 font-black">
                        {doctors.length} Experts
                    </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {doctors.map(doctor => (
                        <Card key={doctor.id} variant="outline" className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all rounded-[2rem] bg-white border-outline-variant/10">
                            <div className="flex gap-4 items-center mb-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
                                    <img src={doctor.profilePhoto} alt={doctor.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-on-surface font-poppins truncate">{doctor.name}</h4>
                                    <p className="text-xs font-bold text-primary font-poppins truncate capitalize">{doctor.specialization}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/5">
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-tertiary text-sm fill-1">star</span>
                                    <span className="text-xs font-bold text-on-surface font-poppins">{doctor.rating}</span>
                                </div>
                                <div className="text-sm font-black text-on-surface-variant font-poppins">₹{doctor.consultationFee}</div>
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <Link to={`/doctors/${doctor.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full h-10 rounded-xl font-poppins font-bold text-xs">
                                        Profile
                                    </Button>
                                </Link>
                                <Link to={`/appointments/book/${doctor.id}`} className="flex-1">
                                    <Button variant="primary" className="w-full h-10 rounded-xl font-poppins font-bold text-xs">
                                        Book
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
                
                {doctors.length === 0 && (
                    <div className="text-center py-20 bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant/20 italic opacity-60">
                        No doctors currently listed for this facility.
                    </div>
                )}
            </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
            <Card className="p-8 space-y-6 bg-surface-container-high rounded-[2.5rem] border-none">
                <h3 className="font-bold text-lg font-poppins">Clinic Information</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        <div>
                            <p className="text-[10px] font-bold text-outline-variant">Opening Hours</p>
                            <p className="text-xs font-bold text-on-surface mt-1">Mon - Sat: 09:00 AM - 08:00 PM</p>
                            <p className="text-xs font-bold text-on-surface">Sun: 10:00 AM - 02:00 PM</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary">verified</span>
                        <div>
                            <p className="text-[10px] font-bold text-outline-variant">Accreditation</p>
                            <p className="text-xs font-bold text-on-surface mt-1">NABH Certified Facility</p>
                        </div>
                    </div>
                </div>
                <Button variant="outline" className="w-full rounded-2xl h-14 border-primary text-primary hover:bg-primary/5 font-poppins font-bold">
                    Add to Favorites
                </Button>
            </Card>

            <Card className="p-8 space-y-4 bg-tertiary-container text-on-tertiary-container border-none rounded-[2rem] shadow-2xl shadow-tertiary/10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">emergency</span>
                </div>
                <h3 className="text-xl font-bold font-poppins">Emergency Care</h3>
                <p className="text-sm font-body opacity-90 leading-relaxed">This facility provides 24/7 emergency response and trauma care services.</p>
                <div className="font-black text-2xl tracking-tighter font-poppins mt-2">1800-HEAL-123</div>
            </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiJson } from "@/lib/api";
import { Doctor, Facility } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { OSMMap } from "@/components/ui/Map";

export default function DoctorProfilePage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) return;
      try {
        const d = await apiJson<Doctor>(`/api/doctors/${encodeURIComponent(id)}`);
        setDoctor(d);
        if (d.facilityId) {
          const f = await apiJson<Facility>(`/api/facilities/${encodeURIComponent(d.facilityId)}`);
          setFacility(f);
        }
      } catch (error) {
        console.error("Error fetching doctor/facility:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchDoctor();
  }, [id]);

  if (loading) return (
    <div className="animate-pulse space-y-8">
        <div className="h-64 bg-surface-container-low rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-surface-container-low rounded-3xl" />
            <div className="h-96 bg-surface-container-low rounded-3xl" />
        </div>
    </div>
  );

  if (!doctor) return <div className="text-center py-20 font-headline font-bold">Doctor not found.</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-surface-container-low p-8 md:p-12">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/5 to-transparent"></div>
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          <div className="w-40 h-40 rounded-3xl overflow-hidden shadow-2xl border-4 border-white flex-shrink-0">
            <img src={doctor.profilePhoto} alt={doctor.name} className="w-full h-full object-cover" />
          </div>
          <div className="text-center md:text-left space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl md:text-5xl font-bold text-on-surface font-poppins tracking-tight">{doctor.name}</h1>
              <Badge variant="primary" size="md">Verified Specialist</Badge>
            </div>
            <p className="text-xl font-semibold text-primary font-poppins tracking-wide">{doctor.specialization}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-outline tracking-widest mb-1">Experience</span>
                <span className="text-lg font-bold text-on-surface font-poppins">{doctor.experience}+ Years</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-outline tracking-widest mb-1">Rating</span>
                <span className="text-lg font-bold text-on-surface font-poppins flex items-center gap-1">
                  {doctor.rating} <span className="material-symbols-outlined text-tertiary fill-1">star</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-outline tracking-widest mb-1">Satisfied Patients</span>
                <span className="text-lg font-bold text-on-surface font-poppins">500+</span>
              </div>
            </div>
          </div>
          <div className="md:ml-auto flex flex-col items-center md:items-end gap-3 self-center">
            <div className="text-3xl font-bold text-primary font-poppins tracking-tighter">₹{doctor.consultationFee}</div>
            <Button size="lg" className="rounded-2xl shadow-xl shadow-primary/20" onClick={() => navigate(`/appointments/book/${doctor.id}`)}>
              Book Appointment
            </Button>
          </div>
        </div>
      </section>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-10 space-y-6">
            <h2 className="text-2xl font-bold font-poppins tracking-tight text-on-surface">About {doctor.name}</h2>
            <p className="text-on-surface-variant leading-relaxed font-body text-lg italic">
              "{doctor.bio}"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-outline-variant/10">
              <div className="space-y-4">
                <h3 className="font-poppins font-semibold text-sm tracking-widest text-outline">Education</h3>
                <p className="text-on-surface font-medium font-body leading-relaxed">{doctor.education}</p>
              </div>
              <div className="space-y-4">
                <h3 className="font-poppins font-semibold text-sm tracking-widest text-outline">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.languages.map(l => <Badge key={l} variant="secondary">{l}</Badge>)}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-10 space-y-6">
            <h2 className="text-2xl font-bold font-poppins tracking-tight text-on-surface">Specialized Care</h2>
            <p className="text-on-surface-variant font-body">Common symptoms and conditions treated:</p>
            <div className="flex flex-wrap gap-3">
              {doctor.treats.map(t => (
                <div key={t} className="px-6 py-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center gap-3 group hover:border-primary/30 transition-all">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">check_circle</span>
                  <span className="font-poppins font-semibold text-sm tracking-tight">{t}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8 space-y-6 bg-surface-container-high relative overflow-hidden group">
            <h2 className="text-xl font-bold font-poppins tracking-tight">Clinical Facility</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary text-3xl shrink-0">medical_services</span>
                <div className="min-w-0">
                  <h4 className="font-bold text-on-surface font-poppins text-lg leading-tight group-hover:text-primary transition-colors truncate">
                    {facility ? facility.name : doctor.clinicName}
                  </h4>
                  <p className="text-sm text-on-surface-variant font-body mt-1 leading-relaxed opacity-80">
                    {facility ? facility.address : "Apollo Hospitals, Sector 21, Navi Mumbai, India 400706"}
                  </p>
                </div>
              </div>

              {facility && (
                <Link to={`/hospitals/${facility.id}`}>
                  <div className="rounded-2xl overflow-hidden h-32 mb-4 border border-outline-variant/10 relative group/img">
                    <img src={facility.image} alt={facility.name} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                    <div className="absolute inset-0 bg-black/20 group-hover/img:bg-black/0 transition-colors" />
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-primary">
                      View Facility Detail
                    </div>
                  </div>
                </Link>
              )}

              <div className="h-44 w-full cursor-pointer relative rounded-2xl overflow-hidden border border-outline-variant/10">
                <OSMMap address={facility ? `${facility.name}, ${facility.address}` : doctor.clinicName} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="rounded-xl border-primary text-primary font-bold text-xs" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility ? facility.name : doctor.clinicName)}`, '_blank')}>Get Directions</Button>
                {facility && (
                  <Link to={`/hospitals/${facility.id}`}>
                    <Button variant="primary" className="w-full rounded-xl font-bold text-xs">About Hospital</Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-8 space-y-4 bg-tertiary-container text-on-tertiary-container border-none">
            <span className="material-symbols-outlined text-4xl">verified</span>
            <h3 className="text-xl font-bold font-poppins tracking-tight">HealBook Select</h3>
            <p className="text-sm font-body opacity-90 leading-relaxed">This doctor is part of HealBook Select, meeting our highest standards of patient care and clinical excellence.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

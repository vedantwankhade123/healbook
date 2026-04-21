"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "@/lib/api";
import { Facility } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function FacilityListingPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const data = await apiJson<Facility[]>("/api/facilities");
        setFacilities(data);
      } catch (error) {
        console.error("Error fetching facilities:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchFacilities();
  }, []);

  const filtered = facilities.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-bold text-on-surface font-poppins tracking-tighter">
                    Healthcare <span className="text-primary">Facilities</span>
                </h1>
            </div>
            <div className="w-full md:w-96">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
                    <input 
                        type="text"
                        placeholder="Search hospital or city..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-14 pl-12 pr-6 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 font-poppins text-sm italic"
                    />
                </div>
            </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-surface-container-low animate-pulse rounded-[2.5rem]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {filtered.map((facility) => (
            <Link key={facility.id} to={`/hospitals/${facility.id}`}>
                <Card variant="outline" className="group p-0 overflow-hidden rounded-[2rem] border-none shadow-xl hover:shadow-2xl transition-all duration-500 aspect-[1.58/1] relative">
                    {/* Background Image */}
                    <img 
                        src={facility.image} 
                        alt={facility.name} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    />
                    
                    {/* Gradients for Readability */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/40 to-transparent opacity-60" />
                    
                    {/* Top Left Info */}
                    <div className="absolute top-5 left-5 space-y-0.5 max-w-[65%]">
                        <h3 className="text-lg md:text-xl font-bold text-white font-poppins leading-tight drop-shadow-md line-clamp-2">
                            {facility.name}
                        </h3>
                        <div className="flex items-center gap-1 text-white/90">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            <span className="text-xs font-medium font-poppins drop-shadow-md">{facility.city}</span>
                        </div>
                    </div>

                    {/* Top Right Badges */}
                    <div className="absolute top-5 right-5 flex flex-col items-end gap-1.5">
                        <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-lg border border-white/20">
                            <span className="material-symbols-outlined text-tertiary text-[16px] fill-1">star</span>
                            <span className="text-[11px] font-bold text-on-surface font-poppins">{facility.rating}</span>
                        </div>
                        <Badge variant={facility.type === 'hospital' ? 'primary' : 'secondary'} className="capitalize backdrop-blur-md bg-white/90 border-none shadow-md text-[9px] px-3 h-6">
                            {facility.type}
                        </Badge>
                    </div>
                    
                    {/* Bottom Options Overlay */}
                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex gap-1.5 overflow-hidden">
                                {facility.specializations.slice(0, 2).map(s => (
                                    <span key={s} className="text-[9px] font-bold text-white bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 whitespace-nowrap">
                                        {s}
                                    </span>
                                ))}
                            </div>
                            
                            <Button variant="primary" className="h-9 px-4 rounded-xl bg-white text-primary hover:bg-primary hover:text-white border-none shadow-xl transition-all font-poppins font-bold text-[11px] whitespace-nowrap shrink-0 group-hover:scale-105">
                                View Specialists
                            </Button>
                        </div>
                    </div>
                </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

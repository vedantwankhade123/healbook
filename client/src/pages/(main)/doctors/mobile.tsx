"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "@/lib/api";
import { Doctor } from "@/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { symptomsList } from "./page";
import { SYMPTOM_TO_SPECIALIZATION } from "@/data/symptom-mapping";

export default function MobileDoctorListingPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "experience" | "price_low" | "price_high">("rating");
  const [activeChip, setActiveChip] = useState<"All" | "Top Rated" | "Affordable" | "Veteran">("All");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [selectedGender, setSelectedGender] = useState<"All" | "Male" | "Female" | "Other">("All");
  const [minRating, setMinRating] = useState(0);
  const [maxFee, setMaxFee] = useState(10000);
  const [minExperience, setMinExperience] = useState(0);
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSearch, setSymptomSearch] = useState("");

  useEffect(() => {
    const prevHtmlOverflowX = document.documentElement.style.overflowX;
    const prevBodyOverflowX = document.body.style.overflowX;
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";
    return () => {
      document.documentElement.style.overflowX = prevHtmlOverflowX;
      document.body.style.overflowX = prevBodyOverflowX;
    };
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const docs = await apiJson<Doctor[]>("/api/doctors?limit=500&orderBy=rating&orderDir=desc");
        setDoctors(docs);
      } catch (e) {
        console.error("Error fetching doctors:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetchDoctors();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = doctors.filter((d) => {
      if (!term) return true;
      return (
        d.name.toLowerCase().includes(term) ||
        d.specialization.toLowerCase().includes(term) ||
        d.clinicName.toLowerCase().includes(term) ||
        (d.location?.address || "").toLowerCase().includes(term)
      );
    });

    if (activeChip === "Top Rated") list = list.filter((d) => d.rating >= 4.5);
    if (activeChip === "Affordable") list = list.filter((d) => d.consultationFee <= 500);
    if (activeChip === "Veteran") list = list.filter((d) => d.experience >= 15);

    if (selectedGender !== "All") {
      list = list.filter((d) => (d.gender || "").toLowerCase() === selectedGender.toLowerCase());
    }
    if (minRating > 0) list = list.filter((d) => d.rating >= minRating);
    if (maxFee < 10000) list = list.filter((d) => d.consultationFee <= maxFee);
    if (minExperience > 0) list = list.filter((d) => d.experience >= minExperience);
    if (availableTodayOnly) list = list.filter((d) => d.availabilityStatus === "available_today");

    list = [...list].sort((a, b) => {
      if (sortBy === "experience") return b.experience - a.experience;
      if (sortBy === "price_low") return a.consultationFee - b.consultationFee;
      if (sortBy === "price_high") return b.consultationFee - a.consultationFee;
      return b.rating - a.rating;
    });

    // Symptoms Filter (Smart Mapping)
    if (selectedSymptoms.length > 0) {
      list = list.filter((doctor) => 
        selectedSymptoms.some((s) => {
          const symptomName = s.toLowerCase();
          const directMatch = doctor.treats?.some((t) => t.toLowerCase() === symptomName);
          const relevantSpecs = SYMPTOM_TO_SPECIALIZATION[s] || [];
          const specMatch = relevantSpecs.some((spec) => doctor.specialization.toLowerCase() === spec.toLowerCase());
          return directMatch || specMatch;
        })
      );
    }

    return list;
  }, [
    doctors,
    search,
    sortBy,
    activeChip,
    selectedGender,
    minRating,
    maxFee,
    minExperience,
    availableTodayOnly,
    selectedSymptoms,
  ]);

  return (
    <div className="space-y-4 pb-20 mx-auto w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-x-hidden box-border">
      <section className="space-y-4 max-w-full overflow-x-hidden">
        <div className="space-y-3 max-w-full">
          <h1 className="text-3xl font-bold text-on-surface font-poppins tracking-tight">
            Find <span className="text-primary">Doctors</span>
          </h1>

          <Input
            placeholder="Search doctor, specialization, city..."
            icon="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-container border-none h-12 shadow-inner rounded-2xl text-sm font-poppins"
          />

          <div className="flex flex-col gap-2 min-w-0">
            <div className="w-full overflow-x-auto hide-scrollbar">
              <div className="flex gap-2 pb-1">
                {(["All", "Top Rated", "Affordable", "Veteran"] as const).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setActiveChip(chip)}
                    className={`whitespace-nowrap h-9 px-3.5 rounded-full text-xs font-bold font-poppins transition-all border ${
                      activeChip === chip
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                        : "bg-white text-on-surface-variant border-outline-variant/20"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full min-w-0">
              <label htmlFor="doctor-sort" className="sr-only">
                Sort doctors
              </label>
              <select
                id="doctor-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full min-w-0 h-9 rounded-xl border border-outline-variant/20 bg-white px-3 text-xs font-bold font-poppins text-on-surface"
              >
                <option value="rating">Best rating</option>
                <option value="experience">Most experienced</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowMoreFilters((prev) => !prev)}
              className="w-full h-9 rounded-xl border border-outline-variant/20 bg-white px-3 text-xs font-bold font-poppins text-on-surface flex items-center justify-between"
            >
              <span>More Filters</span>
              <span className={`material-symbols-outlined text-base transition-transform ${showMoreFilters ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>

            {showMoreFilters && (
              <div className="rounded-2xl border border-outline-variant/20 bg-white p-3 space-y-3 max-w-full overflow-x-hidden">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value as any)}
                    className="w-full min-w-0 h-9 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 text-xs font-semibold"
                  >
                    <option value="All">Any gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>

                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full min-w-0 h-9 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 text-xs font-semibold"
                  >
                    <option value={0}>Any rating</option>
                    <option value={4}>4.0+</option>
                    <option value={4.5}>4.5+</option>
                    <option value={4.8}>4.8+</option>
                  </select>

                  <select
                    value={maxFee}
                    onChange={(e) => setMaxFee(Number(e.target.value))}
                    className="w-full min-w-0 h-9 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 text-xs font-semibold"
                  >
                    <option value={10000}>Any budget</option>
                    <option value={500}>Under ₹500</option>
                    <option value={1000}>Under ₹1000</option>
                    <option value={1500}>Under ₹1500</option>
                  </select>

                  <select
                    value={minExperience}
                    onChange={(e) => setMinExperience(Number(e.target.value))}
                    className="w-full min-w-0 h-9 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 text-xs font-semibold"
                  >
                    <option value={0}>Any experience</option>
                    <option value={5}>5+ years</option>
                    <option value={10}>10+ years</option>
                    <option value={15}>15+ years</option>
                  </select>
                </div>

                  <button
                    type="button"
                    onClick={() => setAvailableTodayOnly((prev) => !prev)}
                    className={`w-full h-9 rounded-xl border text-xs font-bold font-poppins ${
                      availableTodayOnly
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant/20"
                    }`}
                  >
                    Available Today
                  </button>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Filter Symptoms</span>
                      {selectedSymptoms.length > 0 && (
                        <button onClick={() => setSelectedSymptoms([])} className="text-[10px] font-bold text-primary uppercase">Clear</button>
                      )}
                    </div>
                    <Input
                      placeholder="Search symptoms..."
                      value={symptomSearch}
                      onChange={(e) => setSymptomSearch(e.target.value)}
                      className="bg-surface-container-low h-9 text-xs rounded-xl border-outline-variant/10"
                    />
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pt-1">
                      {symptomsList
                        .filter(s => s.name.toLowerCase().includes(symptomSearch.toLowerCase()))
                        .map((s) => {
                          const isSelected = selectedSymptoms.includes(s.name);
                          return (
                            <button
                              key={s.name}
                              onClick={() => setSelectedSymptoms(prev => isSelected ? prev.filter(x => x !== s.name) : [...prev, s.name])}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                                isSelected 
                                  ? "bg-primary text-white border-primary" 
                                  : "bg-white text-on-surface-variant border-outline-variant/20"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                              {s.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3 max-w-full overflow-x-hidden min-w-0">
        <div className="flex items-center justify-between min-w-0 gap-2">
          <h2 className="text-lg font-bold font-poppins text-on-surface min-w-0 truncate">
            Available <span className="text-primary">Practitioners</span>
          </h2>
          <Badge variant="neutral" className="bg-surface-container/50 text-on-surface-variant border-none text-[10px] font-black h-6 flex-shrink-0">
            {filtered.length}
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface-container-low animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((doctor) => (
              <Card
                key={doctor.id}
                variant="outline"
                className="w-full max-w-full p-2.5 rounded-2xl bg-white border-outline-variant/20 overflow-hidden"
              >
                <div className="flex items-start gap-2.5 min-w-0 max-w-full">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container overflow-hidden flex-shrink-0 ring-1 ring-outline-variant/10">
                    <img src={doctor.profilePhoto} alt={doctor.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 max-w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-poppins font-extrabold text-base text-on-surface truncate">{doctor.name}</h3>
                        <p className="text-primary font-bold text-[11px] font-poppins truncate">{doctor.specialization}</p>
                      </div>
                      <Badge variant="tertiary" size="sm" className="font-poppins bg-tertiary-container/40 text-tertiary-fixed-variant border-none h-6 px-2 flex-shrink-0">
                        <span className="material-symbols-outlined text-[12px] mr-0.5">star</span>
                        {doctor.rating}
                      </Badge>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-[12px] text-primary">work_history</span>
                        {doctor.experience} Yrs
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-[12px] text-primary">payments</span>
                        ₹{doctor.consultationFee}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md min-w-0 max-w-full">
                        <span className="material-symbols-outlined text-[12px] text-primary">location_on</span>
                        <span className="truncate">{doctor.clinicName}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 grid grid-cols-1 gap-2 max-w-full">
                  <Link to={`/doctors/${doctor.id}`} className="w-full min-w-0">
                    <Button variant="outline" size="sm" className="w-full h-10 rounded-xl font-poppins font-bold text-xs bg-white">
                      Profile
                    </Button>
                  </Link>
                  <Link to={`/appointments/book/${doctor.id}`} className="w-full min-w-0">
                    <Button variant="primary" size="sm" className="w-full h-10 rounded-xl font-poppins font-bold text-xs">
                      Book
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="flat" className="py-12 text-center border-2 border-dashed border-outline-variant/20 rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">search_off</span>
            <h3 className="font-headline font-bold text-on-surface mb-1">No <span className="text-primary">Doctors Found</span></h3>
          </Card>
        )}
      </section>
    </div>
  );
}


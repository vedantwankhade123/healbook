"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiJson } from "@/lib/api";
import { Doctor } from "@/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { usePrakriti } from "@/context/PrakritiContext";
import { SYMPTOM_TO_SPECIALIZATION } from "@/data/symptom-mapping";
import MobileDoctorListingPage from "./mobile";

export default function DoctorListingPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileDoctorListingPage />
      </div>
      <div className="hidden md:block">
        <DesktopDoctorListingPage />
      </div>
    </>
  );
}

const specializations = [
    "All",
    "General Physician",
    "Internal Medicine",
    "Pediatrician",
    "Gastroenterologist",
    "Cardiologist",
    "Dermatologist",
    "Neurologist",
    "Orthopedic",
    "Gynecologist",
    "Psychiatrist",
    "ENT Specialist",
    "Endocrinologist",
    "Urologist",
    "Dentist",
    "Ophthalmologist",
    "General Surgeon",
    "Physiotherapist",
    "Ayurvedic Doctor",
    "Homeopathy",
    "Dietician"
];

export const symptomsList = [
    { name: "Fever", icon: "device_thermostat", category: "General" },
    { name: "Fatigue", icon: "battery_alert", category: "General" },
    { name: "Headache", icon: "psychology", category: "Neurological" },
    { name: "Migraine", icon: "personal_injury", category: "Neurological" },
    { name: "Cough", icon: "airwave", category: "Respiratory" },
    { name: "Sore Throat", icon: "medical_mask", category: "Respiratory" },
    { name: "Chest Pain", icon: "heart_broken", category: "Cardiovascular" },
    { name: "Palpitations", icon: "heart_check", category: "Cardiovascular" },
    { name: "Stomach Pain", icon: "nutrition", category: "Digestive" },
    { name: "Nausea", icon: "sick", category: "Digestive" },
    { name: "Acidity", icon: "water", category: "Digestive" },
    { name: "Jaundice", icon: "opacity", category: "Digestive" },
    { name: "Back Pain", icon: "accessibility_new", category: "Musculoskeletal" },
    { name: "Joint Pain", icon: "healing", category: "Musculoskeletal" },
    { name: "Acne", icon: "face", category: "Dermatological" },
    { name: "Hair Loss", icon: "content_cut", category: "Dermatological" },
    { name: "Blurred Vision", icon: "visibility_off", category: "Ocular" },
    { name: "Anxiety", icon: "psychology", category: "Mental Health" },
    { name: "PCOS", icon: "female", category: "Women's Health" },
    { name: "Pregnancy", icon: "pregnant_woman", category: "Women's Health" },
    { name: "Toothache", icon: "dentistry", category: "Dental" },
    { name: "Sleep Problems", icon: "bedtime", category: "Mental Health" },
    { name: "Ear Pain", icon: "hearing", category: "ENT" },
    { name: "Dizziness", icon: "cyclone", category: "Neurological" },
    { name: "Diabetes", icon: "opacity", category: "Endocrine" },
];

function DesktopDoctorListingPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedSpec, setSelectedSpec] = useState("All");
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [symptomSearch, setSymptomSearch] = useState("");
    const { chatWithPrakriti, isOpen } = usePrakriti();

    // New Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [minExperience, setMinExperience] = useState<number>(0);
    const [minRating, setMinRating] = useState<number>(0);
    const [maxFee, setMaxFee] = useState<number>(10000);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [selectedGender, setSelectedGender] = useState<string>("All");
    const [availabilityFilter, setAvailabilityFilter] = useState<string>("All");
    const [expandedSection, setExpandedSection] = useState<string | null>("experience");
    const [sortBy, setSortBy] = useState<"rating" | "experience" | "price_low" | "price_high">("rating");
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Dropdown States
    const [isSpecOpen, setIsSpecOpen] = useState(false);
    const [isSymptomsOpen, setIsSymptomsOpen] = useState(false);
    const [specSearch, setSpecSearch] = useState("");
    const specRef = useRef<HTMLDivElement>(null);
    const symptomsRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (specRef.current && !specRef.current.contains(event.target as Node)) {
                setIsSpecOpen(false);
            }
            if (symptomsRef.current && !symptomsRef.current.contains(event.target as Node)) {
                setIsSymptomsOpen(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchDoctors = async () => {
            setLoading(true);
            try {
                const docs = await apiJson<Doctor[]>("/api/doctors?limit=500&orderBy=rating&orderDir=desc");
                setDoctors(docs);
            } catch (error) {
                console.error("Error fetching doctors:", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchDoctors();
    }, []);

    // Unified Filtering Logic (Dual Search + Parameters)
    const filteredDoctors = useMemo(() => {
        return doctors.filter(doctor => {
            // 1. Dual Search (Name, Specialization, Clinic, or Location)
            const searchTerm = search.toLowerCase();
            const matchesSearch = !search ||
                doctor.name.toLowerCase().includes(searchTerm) ||
                doctor.specialization.toLowerCase().includes(searchTerm) ||
                doctor.clinicName.toLowerCase().includes(searchTerm) ||
                (doctor.location?.address && doctor.location.address.toLowerCase().includes(searchTerm));

            // 2. Experience Filter
            const matchesExperience = doctor.experience >= minExperience;

            // 3. Rating Filter
            const matchesRating = doctor.rating >= minRating;

            // 4. Fee Filter
            const matchesFee = doctor.consultationFee <= maxFee;

            // 5. Languages Filter
            const matchesLanguages = selectedLanguages.length === 0 ||
                selectedLanguages.some(l => doctor.languages.includes(l));

            // 6. Gender Filter
            const matchesGender = selectedGender === "All" ||
                doctor.gender?.toLowerCase() === selectedGender.toLowerCase();

            // 7. Availability Filter
            const matchesAvailability = availabilityFilter === "All" ||
                doctor.availabilityStatus === availabilityFilter;

            // 8. Symptoms Filter (Smart Mapping)
            const matchesSymptoms = selectedSymptoms.length === 0 ||
                selectedSymptoms.some(s => {
                    const symptomName = s.toLowerCase();
                    // Case-insensitive direct match in treats array
                    const directMatch = doctor.treats?.some(t => t.toLowerCase() === symptomName);

                    // Check if doctor's specialization is linked to this symptom
                    const relevantSpecs = SYMPTOM_TO_SPECIALIZATION[s] || [];
                    const specMatch = relevantSpecs.some(spec => doctor.specialization.toLowerCase() === spec.toLowerCase());

                    return directMatch || specMatch;
                });

            // 9. Extra Search Broadness (Check treats array during main search)
            const matchesSearchWithTreats = !search || matchesSearch ||
                doctor.treats?.some(t => t.toLowerCase().includes(searchTerm));

            const matchesSpec = selectedSpec === "All" || doctor.specialization === selectedSpec;

            return matchesSpec && matchesSearchWithTreats && matchesExperience && matchesRating && matchesFee &&
                matchesLanguages && matchesGender && matchesAvailability && matchesSymptoms;
        }).sort((a, b) => {
            if (sortBy === "rating") return b.rating - a.rating;
            if (sortBy === "experience") return b.experience - a.experience;
            if (sortBy === "price_low") return a.consultationFee - b.consultationFee;
            if (sortBy === "price_high") return b.consultationFee - a.consultationFee;
            return 0;
        });
    }, [doctors, search, minExperience, minRating, maxFee, selectedLanguages, selectedGender, availabilityFilter, selectedSymptoms, selectedSpec, sortBy]);

    const activeFilterCount = (minExperience > 0 ? 1 : 0) +
        (minRating > 0 ? 1 : 0) +
        (maxFee < 10000 ? 1 : 0) +
        (selectedLanguages.length > 0 ? 1 : 0) +
        (selectedGender !== "All" ? 1 : 0) +
        (availabilityFilter !== "All" ? 1 : 0);



    return (
        <div className="flex flex-row gap-0 min-h-[calc(100vh+2rem)] bg-surface -mt-2 lg:-mt-6 -mx-4 md:-mx-8 lg:-mx-12">
            {/* 1. Main Content Area */}
            <div className={`flex-1 min-w-0 p-8 pt-6 transition-all duration-500 ${showFilters ? 'mr-0' : 'mr-0'} scroll-smooth hide-scrollbar overflow-x-hidden`}>
                <div className="max-w-7xl mx-auto space-y-8">
                    <section className="space-y-6 pb-8 border-b border-outline-variant/10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-on-surface font-poppins tracking-tight">
                                    Find <span className="text-primary">Doctors</span>
                                </h1>
                            </div>

                            {/* Unified Dual Search Bar */}
                            <div className="w-full md:w-96 flex flex-col gap-2">
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-xs font-semibold text-on-surface-variant font-poppins">Search specialist or city</p>
                                    {(search || activeFilterCount > 0 || selectedSpec !== "All" || selectedSymptoms.length > 0) && (
                                        <button
                                            onClick={() => { setSearch(""); setSelectedSpec("All"); setSelectedSymptoms([]); setMinExperience(0); setMinRating(0); setMaxFee(10000); setSelectedLanguages([]); setSelectedGender("All"); setAvailabilityFilter("All"); }}
                                            className="text-[10px] font-black text-primary uppercase tracking-tighter hover:underline"
                                        >
                                            Reset All
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g. Cardiologist Delhi..."
                                        icon="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="bg-surface-container border-none h-12 shadow-inner rounded-2xl text-sm font-poppins"
                                    />
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`h-12 px-6 rounded-2xl flex items-center justify-center transition-all ${showFilters ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high relative'}`}
                                    >
                                        <span className="material-symbols-outlined">{showFilters ? 'close' : 'tune'}</span>
                                        {!showFilters && activeFilterCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <section className="space-y-4">
                            {/* Advanced Quick Filters */}
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex-shrink-0 mr-2">Quick filter</span>

                                <button
                                    onClick={() => setAvailabilityFilter(availabilityFilter === "available_today" ? "All" : "available_today")}
                                    className={`flex-shrink-0 h-9 px-5 rounded-full text-xs font-bold font-poppins transition-all flex items-center gap-2 border ${availabilityFilter === "available_today" ? "bg-primary text-white border-primary shadow-md" : "bg-white text-on-surface-variant border-outline-variant/20 hover:border-primary/40"}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                                    Available Today
                                </button>

                                <button
                                    onClick={() => setMinRating(minRating === 4.5 ? 0 : 4.5)}
                                    className={`flex-shrink-0 h-9 px-5 rounded-full text-xs font-bold font-poppins transition-all flex items-center gap-2 border ${minRating === 4.5 ? "bg-primary text-white border-primary shadow-md" : "bg-white text-on-surface-variant border-outline-variant/20 hover:border-primary/40"}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">star</span>
                                    Top Rated (4.5+)
                                </button>

                                <button
                                    onClick={() => setMaxFee(maxFee === 500 ? 10000 : 500)}
                                    className={`flex-shrink-0 h-9 px-5 rounded-full text-xs font-bold font-poppins transition-all flex items-center gap-2 border ${maxFee === 500 ? "bg-primary text-white border-primary shadow-md" : "bg-white text-on-surface-variant border-outline-variant/20 hover:border-primary/40"}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">payments</span>
                                    Affordable (≤ ₹500)
                                </button>

                                <button
                                    onClick={() => setMinExperience(minExperience === 15 ? 0 : 15)}
                                    className={`flex-shrink-0 h-9 px-5 rounded-full text-xs font-bold font-poppins transition-all flex items-center gap-2 border ${minExperience === 15 ? "bg-primary text-white border-primary shadow-md" : "bg-white text-on-surface-variant border-outline-variant/20 hover:border-primary/40"}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                                    Veteran (15+ Yrs)
                                </button>

                                <button
                                    onClick={() => setSelectedGender(selectedGender === "Female" ? "All" : "Female")}
                                    className={`flex-shrink-0 h-9 px-5 rounded-full text-xs font-bold font-poppins transition-all flex items-center gap-2 border ${selectedGender === "Female" ? "bg-primary text-white border-primary shadow-md" : "bg-white text-on-surface-variant border-outline-variant/20 hover:border-primary/40"}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">female</span>
                                    Female Practitioners
                                </button>
                            </div>
                            <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
                                {/* Symptoms Dropdown */}
                                <div className="flex-1 space-y-2 min-w-[240px] relative" ref={symptomsRef}>
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-xs font-semibold text-on-surface-variant font-poppins">Identify Symptoms</p>
                                        {selectedSymptoms.length > 0 && (
                                            <button
                                                onClick={() => setSelectedSymptoms([])}
                                                className="text-[10px] font-black text-primary uppercase tracking-tighter hover:underline"
                                            >
                                                Clear ({selectedSymptoms.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsSymptomsOpen(!isSymptomsOpen)}
                                            className={`w-full h-12 bg-surface-container rounded-2xl px-5 flex items-center justify-between hover:bg-white transition-all shadow-inner ${isSymptomsOpen ? 'ring-2 ring-primary/20 bg-white' : ''}`}
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <span className="material-symbols-outlined text-primary text-xl">medical_information</span>
                                                <span className="font-poppins font-bold text-sm text-on-surface truncate">
                                                    {selectedSymptoms.length === 0
                                                        ? "All Symptoms"
                                                        : selectedSymptoms.join(", ")}
                                                </span>
                                            </div>
                                            <span className={`material-symbols-outlined text-outline text-lg transition-transform ${isSymptomsOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                        </button>
                                        {isSymptomsOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-outline-variant/10 shadow-2xl rounded-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="p-4 border-b border-outline-variant/10">
                                                    <Input
                                                        placeholder="Search symptoms..."
                                                        value={symptomSearch}
                                                        onChange={(e) => setSymptomSearch(e.target.value)}
                                                        className="w-full bg-surface-container-low rounded-xl px-4 py-2 text-sm outline-none font-poppins border-none"
                                                    />
                                                </div>
                                                <div className="p-4 pt-2 max-h-64 overflow-y-auto slim-scrollbar flex flex-col gap-1">
                                                    {symptomsList.filter(s => s.name.toLowerCase().includes(symptomSearch.toLowerCase())).map(symptom => {
                                                        const isActive = selectedSymptoms.includes(symptom.name);
                                                        return (
                                                            <button
                                                                key={symptom.name}
                                                                onClick={() => setSelectedSymptoms(prev =>
                                                                    isActive ? prev.filter(x => x !== symptom.name) : [...prev, symptom.name]
                                                                )}
                                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-poppins font-medium transition-all flex items-center justify-between ${isActive ? "bg-primary/10 text-primary" : "hover:bg-surface-container-low text-on-surface-variant"}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="material-symbols-outlined text-lg">{symptom.icon}</span>
                                                                    {symptom.name}
                                                                </div>
                                                                {isActive && <span className="material-symbols-outlined text-sm">check_circle</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Specializations Dropdown */}
                                <div className="flex-1 space-y-2 min-w-[240px] relative" ref={specRef}>
                                    <p className="text-xs font-semibold text-on-surface-variant ml-1 font-poppins">Specialization</p>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsSpecOpen(!isSpecOpen)}
                                            className={`w-full h-12 bg-surface-container rounded-2xl px-5 flex items-center justify-between hover:bg-white transition-all shadow-inner ${isSpecOpen ? 'ring-2 ring-primary/20 bg-white' : ''}`}
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <span className="material-symbols-outlined text-primary text-xl">medical_services</span>
                                                <span className="font-poppins font-bold text-sm text-on-surface truncate">{selectedSpec}</span>
                                            </div>
                                            <span className={`material-symbols-outlined text-outline text-lg transition-transform ${isSpecOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                        </button>
                                        {isSpecOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-outline-variant/10 shadow-2xl rounded-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="p-4 border-b border-outline-variant/10">
                                                    <Input placeholder="Search Specialization..." value={specSearch} onChange={(e) => setSpecSearch(e.target.value)} className="w-full bg-surface-container-low rounded-xl px-4 py-2 text-sm outline-none font-poppins border-none" />
                                                </div>
                                                <div className="p-4 pt-2 max-h-64 overflow-y-auto slim-scrollbar flex flex-col gap-1">
                                                    {specializations.filter(s => s.toLowerCase().includes(specSearch.toLowerCase())).map(spec => (
                                                        <button
                                                            key={spec}
                                                            onClick={() => { setSelectedSpec(spec); setIsSpecOpen(false); setSpecSearch(""); }}
                                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-poppins font-medium transition-all ${selectedSpec === spec ? "bg-primary text-white" : "hover:bg-surface-container-low text-on-surface-variant"}`}
                                                        >
                                                            {spec}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </section>

                    {/* Doctor Grid */}
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="font-poppins font-bold text-xl text-on-surface flex items-center gap-2">
                                Available <span className="text-primary">{selectedSpec === 'All' ? 'Practitioners' : selectedSpec + 's'}</span>
                                <Badge variant="neutral" className="bg-surface-container/50 text-on-surface-variant border-none text-[10px] font-black h-6">
                                    {filteredDoctors.length}
                                </Badge>
                            </h2>

                            <div className="flex items-center gap-3 relative" ref={sortRef}>
                                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest font-poppins">Sort by:</span>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsSortOpen(!isSortOpen)}
                                        className={`flex items-center gap-2 bg-white border border-outline-variant/20 rounded-xl px-4 py-2 text-xs font-bold font-poppins text-on-surface outline-none transition-all hover:bg-surface-container-low ${isSortOpen ? 'ring-2 ring-primary/20 border-primary/20' : ''}`}
                                    >
                                        {sortBy === 'rating' && "Best Rating"}
                                        {sortBy === 'experience' && "Most Experienced"}
                                        {sortBy === 'price_low' && "Price: Low to High"}
                                        {sortBy === 'price_high' && "Price: High to Low"}
                                        <span className={`material-symbols-outlined text-sm transition-transform ${isSortOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>

                                    {isSortOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-outline-variant/10 shadow-2xl rounded-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-1.5 flex flex-col gap-0.5">
                                                {[
                                                    { id: 'rating', name: 'Best Rating' },
                                                    { id: 'experience', name: 'Most Experienced' },
                                                    { id: 'price_low', name: 'Price: Low to High' },
                                                    { id: 'price_high', name: 'Price: High to Low' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => { setSortBy(opt.id as any); setIsSortOpen(false); }}
                                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-poppins font-semibold transition-all ${sortBy === opt.id ? "bg-primary text-white" : "hover:bg-surface-container-low text-on-surface-variant"}`}
                                                    >
                                                        {opt.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className={`grid grid-cols-1 ${isOpen || showFilters ? 'lg:grid-cols-1 xl:grid-cols-1' : 'lg:grid-cols-2 xl:grid-cols-2'} gap-8 pb-12`}>
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-surface-container-low animate-pulse rounded-3xl" />)}
                            </div>
                        ) : filteredDoctors.length > 0 ? (
                            <div className={`grid grid-cols-1 ${isOpen || showFilters ? 'md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2'} gap-8 transition-all duration-500`}>
                                {filteredDoctors.map(doctor => (
                                    <Card key={doctor.id} variant="outline" className="p-0 overflow-hidden group hover:border-primary/20 transition-all rounded-[1.5rem] bg-white border-outline-variant/20 hover:shadow-xl hover:shadow-primary/5 relative">
                                        <div className="p-5 sm:p-6 text-left">
                                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                <div className="flex gap-4 items-start flex-1 min-w-0 w-full">
                                                {/* Avatar */}
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-container overflow-hidden flex-shrink-0 ring-1 ring-outline-variant/10">
                                                    <img src={doctor.profilePhoto} alt={doctor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                </div>

                                                {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-poppins font-extrabold text-base sm:text-lg text-on-surface truncate">{doctor.name}</h3>
                                                        <p className="text-primary font-bold text-[11px] sm:text-xs font-poppins flex items-center gap-1 mt-0.5">
                                                            <span className="material-symbols-outlined text-[14px] flex-shrink-0">stethoscope</span>
                                                            <span className="truncate">{doctor.specialization}</span>
                                                        </p>

                                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-md">
                                                                <span className="material-symbols-outlined text-[12px] text-primary">work_history</span>
                                                                {doctor.experience} Yrs
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-md truncate max-w-[120px] sm:max-w-[140px]">
                                                                <span className="material-symbols-outlined text-[12px] text-primary">location_on</span>
                                                                <span className="truncate">{doctor.clinicName}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Price & Rating (right side) */}
                                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-2 sm:gap-1 flex-shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/5">
                                                    <Badge variant="tertiary" size="sm" className="font-poppins bg-tertiary-container/40 text-tertiary-fixed-variant border-none h-6 px-2">
                                                        <span className="material-symbols-outlined text-[12px] mr-0.5">star</span>
                                                        {doctor.rating}
                                                    </Badge>
                                                    <p className="text-lg font-black font-poppins text-on-surface">₹{doctor.consultationFee}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="px-5 py-3 sm:px-6 bg-surface-container-lowest border-t border-outline-variant/10 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                                                {doctor.rating >= 4.8 && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-tighter border border-amber-100 flex-shrink-0">
                                                        <span className="material-symbols-outlined text-[11px]">workspace_premium</span>
                                                        Top Rated
                                                    </span>
                                                )}
                                                {doctor.experience >= 15 && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-tighter border border-blue-100 flex-shrink-0">
                                                        <span className="material-symbols-outlined text-[11px]">military_tech</span>
                                                        Veteran
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 justify-end">
                                                <Link to={`/doctors/${doctor.id}`} className="flex-1 xs:flex-none">
                                                    <Button variant="outline" className="h-9 w-full xs:w-auto px-4 text-xs font-bold rounded-xl font-poppins bg-white hover:bg-surface-container-low text-on-surface">Profile</Button>
                                                </Link>
                                                <Link to={`/appointments/book/${doctor.id}`} className="flex-1 xs:flex-none">
                                                    <Button className="h-9 w-full xs:w-auto px-5 text-xs font-bold rounded-xl font-poppins shadow-lg shadow-primary/20">Book</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-surface-container-low rounded-[3rem] border border-dashed border-outline-variant/30">
                                <span className="material-symbols-outlined text-7xl text-outline-variant mb-4">search_off</span>
                                <h3 className="font-poppins font-bold text-2xl text-on-surface">No Specialists Found</h3>
                                <p className="text-on-surface-variant mt-2 max-w-sm mx-auto font-poppins">Try refining your filters or search terms.</p>
                                <Button variant="outline" className="mt-8 rounded-2xl px-10 font-poppins" onClick={() => { setSelectedSpec("All"); setSearch(""); setMinExperience(0); setMinRating(0); setMaxFee(10000); setSelectedSymptoms([]); setSelectedLanguages([]); setSelectedGender("All"); setAvailabilityFilter("All"); }}>Clear All Filters</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Side Panel Filters (Integrated Flow) */}
            <div className={`transition-all duration-500 ease-in-out border-l border-outline-variant/10 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] flex flex-col sticky top-0 h-screen overflow-hidden ${showFilters ? 'w-96 opacity-100 pointer-events-auto' : 'w-0 opacity-0 pointer-events-none'}`}>
                <div className="min-w-96 h-full flex flex-col">
                    {/* Panel Header */}
                    <div className="p-8 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-2xl">tune</span>
                            </div>
                            <div>
                                <h2 className="font-poppins font-bold text-xl text-on-surface">Refine Matches</h2>
                                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60 font-poppins">Advanced Parameters</p>
                            </div>
                        </div>
                    </div>

                    {/* Panel Content (Vertical Columns) */}
                    <div className="flex-1 overflow-y-auto slim-scrollbar p-6 space-y-6">
                        {/* Accordion List */}
                        {[
                            {
                                id: 'experience',
                                label: 'Professional Experience',
                                icon: 'work_history',
                                value: minExperience > 0 ? `${minExperience}+ Yrs` : null,
                                options: [0, 2, 5, 8, 12, 15, 20].map(e => ({ id: e, name: e === 0 ? 'Any Experience' : `${e}+ Years`, isActive: minExperience === e, setter: () => setMinExperience(e) }))
                            },
                            {
                                id: 'rating',
                                label: 'Patient Rating',
                                icon: 'star',
                                value: minRating > 0 ? `${minRating}+ ★` : null,
                                options: [0, 3.5, 4.0, 4.2, 4.5, 4.8].map(r => ({ id: r, name: r === 0 ? 'Any Rating' : `${r}+ Stars`, isActive: minRating === r, setter: () => setMinRating(r) }))
                            },
                            {
                                id: 'fee',
                                label: 'Consultation Fee',
                                icon: 'payments',
                                value: maxFee < 10000 ? `≤ ₹${maxFee}` : null,
                                options: [10000, 300, 500, 800, 1000, 1500, 2000].map(f => ({ id: f, name: f === 10000 ? 'Any Budget' : `Under ₹${f}`, isActive: maxFee === f, setter: () => setMaxFee(f) }))
                            },
                            {
                                id: 'gender',
                                label: 'Doctor Gender',
                                icon: 'wc',
                                value: selectedGender !== 'All' ? selectedGender : null,
                                options: ["All", "Male", "Female", "Other"].map(g => ({ id: g, name: g, isActive: selectedGender === g, setter: () => setSelectedGender(g) }))
                            },
                            {
                                id: 'languages',
                                label: 'Language Support',
                                icon: 'translate',
                                value: selectedLanguages.length > 0 ? `${selectedLanguages.length} Selected` : null,
                                options: ["English", "Hindi", "Marathi", "Bengali", "Telugu", "Tamil", "Gujarati", "Kannada", "Urdu"].map(l => {
                                    const active = selectedLanguages.includes(l);
                                    return { id: l, name: l, isActive: active, setter: () => setSelectedLanguages(prev => active ? prev.filter(x => x !== l) : [...prev, l]), multi: true };
                                })
                            },
                            {
                                id: 'availability',
                                label: 'Availability',
                                icon: 'event_available',
                                value: availabilityFilter !== 'All' ? 'Active' : null,
                                options: [
                                    { id: "All", name: "Any Time" },
                                    { id: "available_today", name: "Available Today" },
                                    { id: "available_tomorrow", name: "Available Tomorrow" },
                                    { id: "weekend", name: "Weekend Visits" }
                                ].map(a => ({ id: a.id, name: a.name, isActive: availabilityFilter === a.id, setter: () => setAvailabilityFilter(a.id) }))
                            }
                        ].map(section => (
                            <div key={section.id} className={`border border-outline-variant/10 rounded-2xl transition-all ${expandedSection === section.id ? 'bg-surface-container-lowest ring-1 ring-primary/10' : 'bg-white hover:bg-surface'}`}>
                                <button onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)} className="w-full px-6 py-5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-xl text-primary">{section.icon}</span>
                                        <span className="text-xs font-semibold text-on-surface font-poppins tracking-wide">{section.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {section.value && <Badge variant="primary" size="sm" className="h-5 px-2 font-poppins">{section.value}</Badge>}
                                        <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${expandedSection === section.id ? 'rotate-180' : ''}`}>expand_more</span>
                                    </div>
                                </button>
                                <div className={`grid transition-all duration-300 ease-in-out ${expandedSection === section.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="p-6 pt-0 flex flex-col gap-2">
                                            {section.options.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={opt.setter}
                                                    className={`w-full px-5 py-4 rounded-xl text-base font-medium transition-all border text-left flex justify-between items-center font-poppins ${opt.isActive ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface-container-low text-on-surface-variant border-transparent hover:border-primary/20'}`}
                                                >
                                                    {opt.name}
                                                    {(opt.isActive || ('multi' in opt && opt.multi && opt.isActive)) ? <span className="material-symbols-outlined text-xl">{'multi' in opt && opt.multi ? 'check_box' : 'check_circle'}</span> : null}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Panel Footer */}
                    <div className="p-8 border-t border-outline-variant/10 bg-surface-container-lowest grid grid-cols-2 gap-4">
                        <Button variant="outline" className="rounded-2xl h-14 font-bold text-sm font-poppins" onClick={() => { setMinExperience(0); setMinRating(0); setMaxFee(10000); setSelectedLanguages([]); setSelectedGender("All"); setAvailabilityFilter("All"); setSelectedSymptoms([]); setSearch(""); }}>Reset</Button>
                        <Button variant="primary" className="rounded-2xl h-14 font-bold text-sm font-poppins shadow-xl shadow-primary/20" onClick={() => setShowFilters(false)}>Close</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import React from "react";

const famousDoctors = [
  {
    name: "Dr. Naresh Trehan",
    specialty: "Cardio surgeon",
    hospital: "Medanta - The Medicity",
    info: "Performed over 50,000 successful open-heart surgeries.",
    img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop"
  },
  {
    name: "Dr. Devi Prasad Shetty",
    specialty: "Cardiac Surgeon",
    hospital: "Narayana Health",
    info: "Icon in making high-quality cardiac surgery affordable.",
    img: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=2070&auto=format&fit=crop"
  },
  {
    name: "Dr. Suresh H. Advani",
    specialty: "Oncologist",
    hospital: "Jaslok Hospital",
    info: "Pioneer in bone marrow transplants in India.",
    img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1974&auto=format&fit=crop"
  },
  {
    name: "Dr. Sandeep Vaishya",
    specialty: "Neurosurgeon",
    hospital: "Fortis Memorial",
    info: "Known for complex brain and spine surgeries.",
    img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop"
  },
  {
    name: "Dr. V. Mohan",
    specialty: "Diabetologist",
    hospital: "MDRF, Chennai",
    info: "World-renowned researcher in diabetes care.",
    img: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?q=80&w=1974&auto=format&fit=crop"
  },
  {
    name: "Dr. Arvinder Soin",
    specialty: "Liver Transplant",
    hospital: "Medanta",
    info: "Leading liver transplant surgeon in India.",
    img: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1974&auto=format&fit=crop"
  },
  {
    name: "Dr. Randeep Guleria",
    specialty: "Pulmonologist",
    hospital: "AIIMS New Delhi",
    info: "Expert in respiratory care and former Director of AIIMS.",
    img: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?q=80&w=1974&auto=format&fit=crop"
  }
];

// Duplicate the list to ensure seamless transition
const duplicatedDoctors = [...famousDoctors, ...famousDoctors];

export const DoctorCarousel = () => {
  return (
    <section className="py-24 overflow-hidden bg-surface-container-low/30 border-y border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-4 font-headline tracking-tight">
          Trusted by India's Top Experts
        </h2>
        <p className="text-on-surface-variant max-w-2xl mx-auto font-body text-lg">
          Connecting you with the clinical excellence of the nation's most respected medical pioneers.
        </p>
      </div>

      <div className="relative group flex overflow-hidden">
        <div className="flex gap-8 animate-infinite-scroll group-hover:[animation-play-state:paused] py-4">
          {duplicatedDoctors.map((doc, idx) => (
            <div 
              key={idx} 
              className="flex-shrink-0 w-80 flex flex-col items-center gap-6 p-6 transition-all duration-300 transform"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20 p-1 shadow-sm">
                <img 
                  src={doc.img} 
                  alt={doc.name} 
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform" 
                />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-lg text-on-surface font-headline mb-1">{doc.name}</h4>
                <div className="text-primary text-xs font-bold font-headline tracking-widest mb-3">
                  {doc.specialty}
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-2 font-body italic opacity-80">
                  "{doc.info}"
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Absolute mask gradient for edges */}
        <div className="absolute inset-0 pointer-events-none bg-linear-to-r from-surface-container-low via-transparent to-surface-container-low opacity-0 md:opacity-100"></div>
      </div>
    </section>
  );
};

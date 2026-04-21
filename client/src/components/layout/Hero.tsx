"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

const words = [
  { text: "Intelligence.", color: "text-primary" },
  { text: "Care.", color: "text-secondary" },
  { text: "Precision.", color: "text-tertiary" },
  { text: "Compassion.", color: "text-error" },
];

export const Hero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[100dvh] lg:h-screen flex items-center pt-24 lg:pt-20 pb-0 overflow-hidden bg-surface">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full h-full">
        <div className="relative z-10 py-4 lg:py-10 flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="inline-block py-1 px-3 mb-6 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest">
            Digital Sanctuary
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-on-surface leading-[1.1] tracking-tight mb-6 font-headline">
            Healthcare, <br/>Simplified with <br/>
            <span 
              className={`inline-block transition-all duration-700 ease-in-out ${words[index].color}`}
              key={words[index].text}
              style={{
                animation: "fadeIn 0.8s ease-out forwards"
              }}
            >
              {words[index].text}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 font-body">
            Connect with top-rated doctors, check your symptoms with AI, and manage your health journey all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full sm:w-auto">
            <Link to="/doctors">
              <Button size="lg" className="w-full sm:w-auto">
                Find a Doctor
              </Button>
            </Link>
            <Link to="/symptoms">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Try Ai Assistant
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative hidden lg:flex items-end justify-center h-full min-h-[300px] lg:min-h-0">
          {/* Decorative Blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary-fixed/20 rounded-full blur-3xl animate-pulse"></div>
          
          <img 
            src="/Image-Assets/hero_doctors.png" 
            alt="Verified Doctors"
            className="relative z-10 w-full h-auto object-contain max-h-[90vh] lg:scale-[1.35] origin-bottom transition-transform duration-700"
          />
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

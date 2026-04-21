"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { usePrakriti } from "@/context/PrakritiContext";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  const { chatWithPrakriti } = usePrakriti();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/80 backdrop-blur-md shadow-sm h-20" 
          : "bg-transparent h-24"
      } flex items-center justify-between transition-all`}
    >
      <nav className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">health_and_safety</span>
          <span className="text-2xl font-black text-primary tracking-tighter font-headline">HealBook</span>
        </Link>

        <div className="hidden md:flex items-center space-x-10">
          <Link to="/doctors" className="font-headline font-bold text-sm tracking-tight text-on-surface-variant hover:text-primary transition-colors">
            Doctors
          </Link>
          <button 
            onClick={() => chatWithPrakriti()}
            className="font-headline font-bold text-sm tracking-tight text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            Ask AI
          </button>
          <Link to="/health-ai" className="font-headline font-bold text-sm tracking-tight text-on-surface-variant hover:text-primary transition-colors">
            Health AI
          </Link>
          <Link to="/records" className="font-headline font-bold text-sm tracking-tight text-on-surface-variant hover:text-primary transition-colors">
            Records
          </Link>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <Link to="/login" className="hidden md:block">
            <Button variant="ghost" className="px-2 md:px-4">Log In</Button>
          </Link>
          <Link to="/register">
            <Button className="px-3 py-1.5 md:px-4 md:py-2 text-sm">Get Started</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
};

import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-surface-container-low w-full py-20 border-t border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-6 group">
            <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">health_and_safety</span>
            <span className="text-2xl font-black text-primary font-headline tracking-tighter">HealBook</span>
          </Link>
          <p className="text-on-surface-variant font-body text-sm leading-relaxed max-w-xs">
            Pioneering the future of intelligent wellness and digital medical care. Made for modern healthcare.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <h4 className="font-headline font-bold text-on-surface text-sm tracking-widest">Services</h4>
          <Link to="/doctors" className="text-on-surface-variant font-body text-sm hover:text-primary transition-colors">Doctors</Link>
          <Link to="/symptoms" className="text-on-surface-variant font-body text-sm hover:text-primary transition-colors">Symptom Checker</Link>
          <Link to="/ai-chat" className="text-on-surface-variant font-body text-sm hover:text-primary transition-colors">AI Health Assistant</Link>
        </div>

        <div className="flex flex-col space-y-4">
          <h4 className="font-headline font-bold text-on-surface text-sm tracking-widest">Company</h4>
          <Link to="/about" className="text-on-surface-variant font-body text-sm hover:text-primary transition-colors">About Us</Link>
          <Link to="/contact" className="text-on-surface-variant font-body text-sm hover:text-primary transition-colors">Contact Us</Link>
          <Link to="/partners" className="text-on-surface-variant font-body text-sm hover:text-primary transition-colors">Partner with Us</Link>
        </div>

        <div className="flex flex-col space-y-4">
          <h4 className="font-headline font-bold text-on-surface text-sm tracking-widest">Legal</h4>
          <Link to="/privacy" className="text-on-surface-variant font-body text-sm hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-on-surface-variant font-body text-sm hover:text-primary transition-colors">Terms of Service</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-on-surface-variant font-body text-sm">
          © 2024 HealBook. All rights reserved.
        </p>
        <div className="flex space-x-6">
            <span className="text-xs font-bold text-outline tracking-widest">CityHealth</span>
            <span className="text-xs font-bold text-outline tracking-widest">Medipremium</span>
            <span className="text-xs font-bold text-outline tracking-widest">Vitalitynet</span>
        </div>
      </div>
    </footer>
  );
};

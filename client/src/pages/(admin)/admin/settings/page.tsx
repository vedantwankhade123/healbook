"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    aiDiagnostics: true,
    publicRegistration: true,
    maintenanceMode: false,
    emailNotifications: true,
  });
  const toast = useToast();

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success(`${key} setting updated successfully.`);
  };

  const services = [
    { name: "Firebase (Firestore)", status: "Active", latency: "24ms", health: "GOOD" },
    { name: "Cloudinary (CDN)", status: "Connected", latency: "112ms", health: "GOOD" },
    { name: "Gemini AI Engine", status: "Active", latency: "450ms", health: "OPTIMAL" },
    { name: "Vercel Analytics", status: "Tracking", latency: "8ms", health: "GOOD" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section>
        <h1 className="text-4xl font-bold text-slate-900 font-headline">
            System <span className="text-primary italic">Settings</span>
        </h1>
        <p className="text-slate-500 font-body text-sm mt-2">Configure system-wide parameters and monitor module health.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feature Toggles */}
          <div className="space-y-6">
              <h2 className="text-xl font-bold font-headline tracking-tight text-slate-800">Module Configuration</h2>
              <Card variant="outline" className="p-8 space-y-8 bg-white border-slate-200 rounded-[2.5rem] shadow-sm">
                  {[
                      { id: 'aiDiagnostics', title: 'AI Diagnostics', desc: 'Enable patient symptom matching via Google Gemini AI.', icon: 'smart_toy' },
                      { id: 'publicRegistration', title: 'Public Registration', desc: 'Allow new patients to create accounts via the web portal.', icon: 'public' },
                      { id: 'maintenanceMode', title: 'Maintenance Mode', desc: 'Take the platform offline for scheduled infrastructure updates.', icon: 'construction' },
                      { id: 'emailNotifications', title: 'System Alerts', desc: 'Send automated email notifications for appointments and syncs.', icon: 'notifications_active' },
                  ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all flex items-center justify-center">
                                  <span className="material-symbols-outlined">{item.icon}</span>
                              </div>
                              <div>
                                  <h4 className="font-bold text-slate-800 font-headline">{item.title}</h4>
                                  <p className="text-xs text-slate-400 max-w-xs">{item.desc}</p>
                              </div>
                          </div>
                          <button 
                            onClick={() => toggleSetting(item.id as any)}
                            className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${
                                settings[item.id as keyof typeof settings] ? 'bg-primary justify-end' : 'bg-slate-200 justify-start'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
                          </button>
                      </div>
                  ))}
              </Card>
          </div>

          {/* Infrastructure Health */}
          <div className="space-y-6">
              <h2 className="text-xl font-bold font-headline tracking-tight text-slate-800">Infrastructure Health</h2>
              <div className="grid gap-4">
                  {services.map((service) => (
                      <Card key={service.name} variant="flat" className="p-6 border border-slate-100 bg-white rounded-3xl flex items-center justify-between hover:border-primary/20 transition-all shadow-sm">
                          <div className="flex items-center gap-4">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              <div>
                                  <h4 className="font-bold text-slate-800 font-headline text-sm">{service.name}</h4>
                                  <p className="text-[10px] text-slate-400 font-semibold tracking-tight">Latency: {service.latency}</p>
                              </div>
                          </div>
                          <Badge variant={service.health === 'OPTIMAL' ? 'tertiary' : 'primary'}>{service.health}</Badge>
                      </Card>
                  ))}
              </div>

              <Card className="bg-[#0F172A] border-none rounded-[2rem] p-8 text-white">
                  <h4 className="text-lg font-bold font-headline mb-2">Cloud Deployment</h4>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">System is executing on Vercel Production Edge. All security headers are active and SSL/TLS encryption is enforced.</p>
                  <div className="flex items-center gap-4">
                      <Button variant="outline" className="text-[10px] font-bold h-10 px-6 border-white/10 hover:bg-white/5 shadow-none">Flush Cache</Button>
                      <Button variant="ghost" className="text-[10px] font-bold h-10 px-6 text-primary shadow-none">Restart Services</Button>
                  </div>
              </Card>
          </div>
      </div>
    </div>
  );
}

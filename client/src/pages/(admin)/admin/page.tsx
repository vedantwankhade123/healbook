"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { apiJson, apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Link } from "react-router-dom";
import { useToast } from "@/context/ToastContext";

interface ActivityLog {
  id: string;
  type: "doctor" | "patient" | "appointment" | "sync";
  title: string;
  message: string;
  timestamp: any;
  icon: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    appointments: 0
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [healthStatus, setHealthStatus] = useState({ db: "Connecting...", auth: "Active" });
  const { loading: toastLoading, success, error, dismiss } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiJson<{
        stats: { doctors: number; patients: number; appointments: number };
        activities: ActivityLog[];
      }>("/api/admin/overview");

      setStats(data.stats);
      setActivities(data.activities.slice(0, 8));
      setHealthStatus((prev) => ({ ...prev, db: "Operational" }));
    } catch (e) {
      console.error("Error fetching stats:", e);
      setHealthStatus((prev) => ({ ...prev, db: "Interrupted" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    const id = toastLoading("Syncing 36 Indian Doctors... this will create active user accounts.");
    try {
      const res = await apiFetch("/api/seed/doctors", { method: "POST" });
      const data = await res.json();
      if (data.results) {
        dismiss(id);
        success(`Sync complete: ${data.results.success} active doctor accounts created.`);
        fetchStats(); // Refresh stats
      } else {
        throw new Error(data.error || "Sync failed");
      }
    } catch (err: any) {
      dismiss(id);
      error(err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Platform Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Platform Overview
          </div>
          <h1 className="text-4xl font-bold text-slate-900 font-poppins tracking-tight">
              Admin Dashboard
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold text-slate-400">System Status</span>
                <span className={`text-sm font-semibold ${healthStatus.db === 'Operational' ? 'text-green-600' : 'text-orange-500'}`}>
                  {healthStatus.db === 'Operational' ? 'All Modules Operational' : 'Latency Detected'}
                </span>
            </div>
            <button 
              onClick={fetchStats}
              className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm hover:text-primary transition-colors"
            >
                <span className="material-symbols-outlined">refresh</span>
            </button>
        </div>
      </section>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-none bg-white shadow-sm ring-1 ring-slate-200 hover:ring-primary/20 transition-all rounded-3xl">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">medical_services</span>
                </div>
                <Badge variant="primary" size="sm">+4.8%</Badge>
            </div>
            <h3 className="text-xs font-bold text-slate-500 mb-1 font-poppins">Practitioners</h3>
            <div className="text-3xl font-bold text-slate-900 font-poppins">
                {loading ? "..." : stats.doctors}
            </div>
        </Card>

        <Card className="p-6 border-none bg-white shadow-sm ring-1 ring-slate-200 hover:ring-primary/20 transition-all rounded-3xl">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/5 text-green-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">person</span>
                </div>
                <Badge variant="secondary" size="sm">+12%</Badge>
            </div>
            <h3 className="text-xs font-bold text-slate-500 mb-1 font-poppins">Total Patients</h3>
            <div className="text-3xl font-bold text-slate-900 font-poppins">
                {loading ? "..." : stats.patients}
            </div>
        </Card>

        <Card className="p-6 border-none bg-white shadow-sm ring-1 ring-slate-200 hover:ring-primary/20 transition-all rounded-3xl">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/5 text-orange-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">event_available</span>
                </div>
                <Badge variant="primary" size="sm">High</Badge>
            </div>
            <h3 className="text-xs font-bold text-slate-500 mb-1 font-poppins">Active Bookings</h3>
            <div className="text-3xl font-bold text-slate-900 font-poppins">
                {loading ? "..." : stats.appointments}
            </div>
        </Card>

        <Card className="p-6 border-none bg-[#0F172A] shadow-lg shadow-slate-200 rounded-3xl text-white">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">database</span>
                </div>
            </div>
            <h3 className="text-xs font-bold text-slate-400 mb-1 font-poppins">Sync Status</h3>
            <Button size="sm" onClick={handleSeed} isLoading={isSeeding} className="w-full mt-2 h-10 rounded-xl text-[10px] font-bold tracking-tight shadow-none border border-white/10 hover:bg-white/5">
                Execute Bulk Sync
            </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold font-poppins text-slate-800">Operational Log</h2>
                  <Link to="/admin/audit">
                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary">View Full Audit</Button>
                  </Link>
              </div>

              <Card variant="outline" className="p-0 overflow-hidden border-slate-200 rounded-3xl bg-white">
                  <div className="divide-y divide-slate-100">
                      {loading ? (
                          [1, 2, 3].map((i) => (
                              <div key={i} className="p-5 animate-pulse flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                                  <div className="flex-1 space-y-2">
                                      <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                  </div>
                              </div>
                          ))
                      ) : activities.length > 0 ? (
                          activities.map((log) => (
                              <div key={log.id} className="p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary">
                                    <span className="material-symbols-outlined text-lg">
                                        {log.icon}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800 font-poppins">
                                        {log.title}
                                    </p>
                                    <p className="text-[11px] text-slate-500 font-medium">{log.message} • {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'Recently'}</p>
                                </div>
                                <Badge variant="secondary" size="sm" className="capitalize">{log.type}</Badge>
                              </div>
                          ))
                      ) : (
                          <div className="p-10 text-center">
                              <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">history</span>
                              <p className="text-xs text-slate-400">No system activity recorded yet.</p>
                          </div>
                      )}
                  </div>
              </Card>
          </div>

          {/* Service Health */}
          <div className="space-y-6">
              <h2 className="text-xl font-bold font-poppins tracking-tight text-slate-800">Module Health</h2>
              <div className="space-y-4">
                  {[
                      { name: "Auth Engine", status: healthStatus.auth, health: 100 },
                      { name: "Clinical DB", status: healthStatus.db, health: healthStatus.db === 'Operational' ? 100 : 45 },
                      { name: "Storage (Cloudinary)", status: "Connected", health: 100 },
                      { name: "AI Diagnostics", status: "Active", health: 100 },
                  ].map((service) => (
                      <Card key={service.name} variant="flat" className="p-5 border border-slate-100 rounded-3xl bg-white shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-bold text-slate-800 font-poppins">{service.name}</h4>
                              <span className="text-[10px] font-bold text-green-600">{service.status}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${service.health}%` }}></div>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
}

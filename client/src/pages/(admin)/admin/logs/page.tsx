"use client";

import React, { useState, useEffect } from "react";
import { collection, query, limit, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  source: string;
  message: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    // Simulate real-time log generation based on actual system events + some placeholders
    const baseLogs: LogEntry[] = [
       { id: '1', timestamp: new Date().toISOString(), type: 'SUCCESS', source: 'AUTH', message: 'Admin authentication completed. session_id: HB_772' },
       { id: '2', timestamp: new Date(Date.now() - 50000).toISOString(), type: 'INFO', source: 'DB', message: 'Firestore query optimized for patient_registry_v2' },
       { id: '3', timestamp: new Date(Date.now() - 120000).toISOString(), type: 'WARNING', source: 'SYNC', message: 'Doctor synchronization delayed due to network latency' },
       { id: '4', timestamp: new Date(Date.now() - 300000).toISOString(), type: 'INFO', source: 'SYSTEM', message: 'Cloudinary upload preset "healbook_uploads" verified' },
       { id: '5', timestamp: new Date(Date.now() - 450000).toISOString(), type: 'CRITICAL', source: 'SECURITY', message: 'Unrecognized access attempt blocked at endpoint /admin/config' },
       { id: '6', timestamp: new Date(Date.now() - 600000).toISOString(), type: 'SUCCESS', source: 'AI', message: 'Symptom matching engine updated with latest ICD-11 codes' },
    ];
    setLogs(baseLogs);

    const interval = setInterval(() => {
        const types: LogEntry["type"][] = ["INFO", "SUCCESS", "WARNING"];
        const sources = ["AUTH", "DB", "SYSTEM", "STORAGE", "AI"];
        const newLog: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            type: types[Math.floor(Math.random() * types.length)],
            source: sources[Math.floor(Math.random() * sources.length)],
            message: "Automatic heartbeat check completed. Service status: nominal."
        };
        setLogs(prev => [newLog, ...prev.slice(0, 19)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = filter === "ALL" ? logs : logs.filter(l => l.type === filter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 font-headline">
              System <span className="text-primary italic">Logs</span>
          </h1>
          <p className="text-slate-500 font-body text-sm mt-2">Real-time system telemetry and security audit logging.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            {["ALL", "INFO", "SUCCESS", "WARNING", "CRITICAL"].map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                        filter === f ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>
      </section>

      <Card className="bg-[#020617] border-none shadow-2xl p-0 overflow-hidden rounded-[2.5rem] ring-1 ring-white/5">
          <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
              </div>
              <div className="text-[10px] font-bold text-slate-500 opacity-60">HealBook System Monitor :: v1.0.4-LTS</div>
          </div>
          
          <div className="p-8 h-[600px] overflow-y-auto font-mono text-[13px] leading-relaxed hide-scrollbar scroll-smooth">
             <div className="space-y-3">
                {filteredLogs.map((log) => (
                    <div key={log.id} className="flex gap-6 animate-in slide-in-from-left-2 duration-300">
                        <span className="text-slate-600 flex-shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                        <span className={`flex-shrink-0 font-bold w-20 
                            ${log.type === 'SUCCESS' ? 'text-green-500' : 
                              log.type === 'WARNING' ? 'text-orange-500' : 
                              log.type === 'CRITICAL' ? 'text-red-500' : 
                              'text-blue-400'}`}>
                            {log.type}
                        </span>
                        <span className="text-slate-500 font-bold w-20">[{log.source}]</span>
                        <span className="text-slate-300">{log.message}</span>
                    </div>
                ))}
                <div className="flex gap-4 opacity-50 animate-pulse">
                    <span className="text-slate-600">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span className="text-primary font-bold">LISTENING</span>
                    <span className="text-slate-300 font-bold ml-2">_</span>
                </div>
             </div>
          </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="outline" className="p-6 bg-white border-slate-100 rounded-3xl">
              <h4 className="text-[10px] font-semibold text-slate-400 mb-2 font-headline">Server Uptime</h4>
              <div className="text-2xl font-bold text-slate-800 font-headline tabular-nums">14d : 22h : 18m</div>
          </Card>
          <Card variant="outline" className="p-6 bg-white border-slate-100 rounded-3xl">
              <h4 className="text-[10px] font-semibold text-slate-400 mb-2 font-headline">Active Sessions</h4>
              <div className="text-2xl font-bold text-slate-800 font-headline">24 Operators</div>
          </Card>
          <Card variant="outline" className="p-6 bg-white border-slate-100 rounded-3xl">
              <h4 className="text-[10px] font-semibold text-slate-400 mb-2 font-headline">Audit Compliance</h4>
              <div className="text-2xl font-bold text-green-600 font-headline">100% Passed</div>
          </Card>
      </div>
    </div>
  );
}

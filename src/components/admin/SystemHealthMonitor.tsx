"use client";

import { Activity, Database, Zap, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  activeUsers: number;
}

export function SystemHealthMonitor({ activeUsers }: Props) {
  const [load, setLoad] = useState(15);
  const [latency, setLatency] = useState(24);

  // Mock fluctuation for visual feeling
  useEffect(() => {
    const interval = setInterval(() => {
      setLoad(prev => Math.max(5, Math.min(95, prev + (Math.random() * 10 - 5))));
      setLatency(prev => Math.max(10, Math.min(150, prev + (Math.random() * 20 - 10))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
      {/* Active Traffic */}
      <div className="glass p-5 rounded-2xl border border-primary/20 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Concurrent Users (Live)</p>
          <div className="flex items-center gap-2">
            <h4 className="text-xl font-black">{activeUsers}</h4>
            <div className="flex gap-0.5 items-end h-3">
               <div className="w-1 bg-blue-500/40 rounded-full h-1/2 animate-pulse" />
               <div className="w-1 bg-blue-500/60 rounded-full h-3/4 animate-pulse delay-75" />
               <div className="w-1 bg-blue-500 rounded-full h-full animate-pulse delay-150" />
            </div>
          </div>
        </div>
      </div>

      {/* Database Pool */}
      <div className="glass p-5 rounded-2xl border border-emerald-500/20 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <Database className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">DB Pool Usage</p>
          <div className="flex items-center gap-3">
             <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${load}%` }}
                />
             </div>
             <span className="text-sm font-bold tabular-nums">{Math.round(load)}%</span>
          </div>
        </div>
      </div>

      {/* Latency */}
      <div className="glass p-5 rounded-2xl border border-amber-500/20 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Zap className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Srv Latency (Avg)</p>
          <div className="flex items-center gap-2">
            <h4 className={`text-xl font-black ${latency > 100 ? 'text-destructive' : 'text-amber-500'}`}>
                {Math.round(latency)}ms
            </h4>
            <span className="text-[10px] text-muted-foreground font-medium italic">Optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
}

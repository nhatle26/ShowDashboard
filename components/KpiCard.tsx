// components/KpiCard.tsx
import React from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  percentage: string;
  progress: number;
  footer: string;
}

export default function KpiCard({ title, value, percentage, progress, footer }: KpiCardProps) {
  return (
    <div className="group relative bg-gradient-to-br from-zinc-900 to-[#0a0a0c] p-5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300">
      {/* Subtle glow effect behind */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors duration-500 pointer-events-none" />
      
      <div className="relative z-10">
        <p className="text-xs font-medium text-zinc-400 tracking-wide uppercase">{title}</p>
        <div className="flex items-baseline justify-between mt-3">
          <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shadow-sm">
            {percentage}
          </span>
        </div>
      </div>
      
      <div className="mt-5 relative z-10">
        <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full relative" 
            style={{ width: `${progress}%` }} 
          >
            {/* Shimmer effect on progress bar */}
            <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" style={{ animationDuration: '2s' }} />
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 mt-2 font-medium">{footer}</p>
      </div>
      
      {/* Glowing border effect on hover */}
      <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-blue-500/30 pointer-events-none transition-colors duration-300" />
    </div>
  );
}
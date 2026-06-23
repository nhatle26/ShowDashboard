// components/WeeklyChart.tsx
"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ChartDataItem {
  name: string;      // Ví dụ: "Mon", "Tue"
  Completed: number; // Số task hoàn thành
  Planned: number;   // Số task kế hoạch
}


interface WeeklyChartProps {
  chartData: ChartDataItem[];
}

export default function WeeklyChart({ chartData = [] }: WeeklyChartProps) {
  return (
    <div className="group relative bg-gradient-to-br from-zinc-900 to-[#0a0a0c] p-6 rounded-2xl border border-zinc-800/80 h-full flex flex-col justify-between overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300">
      {/* Subtle glow effect behind */}
      <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-cyan-500/5 blur-3xl group-hover:bg-cyan-500/10 transition-colors duration-500 pointer-events-none" />
      
      <div className="mb-6 relative z-10">
        <h3 className="text-sm font-bold text-white tracking-wide">Weekly task activity</h3>
        <p className="text-[11px] text-zinc-400 mt-1 font-medium">Completed vs planned tasks this week</p>
      </div>
      
      <div className="h-48 w-full relative z-10">
        {chartData.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500 border border-dashed border-zinc-800/50 bg-zinc-900/30 rounded-xl backdrop-blur-sm">
            No chart data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -40, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="none" tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#ffffff', opacity: 0.02 }}
                contentStyle={{ 
                  backgroundColor: 'rgba(18, 19, 24, 0.9)', 
                  backdropFilter: 'blur(8px)',
                  borderColor: 'rgba(39, 39, 42, 0.6)', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ color: '#e4e4e7', fontWeight: 500 }}
                labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
              />
              <Bar dataKey="Completed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="Planned" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex gap-6 mt-4 pt-4 border-t border-zinc-800/60 relative z-10">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          Completed
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          Planned
        </div>
      </div>
      
      {/* Glowing border effect on hover */}
      <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-zinc-700/50 pointer-events-none transition-colors duration-300" />
    </div>
  );
}
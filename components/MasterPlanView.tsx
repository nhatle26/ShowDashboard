"use client";

import React, { useState, useEffect } from "react";
import { BarChart, CheckCircle, Clock, FileDown, GanttChartSquare, AlertTriangle } from "lucide-react";

interface MasterPlanData {
    overallKpis: {
        overallProgress: number;
        totalTasks: number;
        totalMandays: number;
        overdue: number;
    };
    phases: {
        name: string;
        taskCount: number;
        doneCount: number;
        overdueCount: number;
        manday: number;
        progress: number;
    }[];
}

export default function MasterPlanView() {
    const [data, setData] = useState<MasterPlanData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadMasterPlan() {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/projects?tab=__masterplan__`);
                if (!response.ok) throw new Error("Failed to fetch master plan");
                const resData = await response.json();
                if (resData.success) {
                    setData(resData.data);
                }
            } catch (error) {
                console.error("Master Plan Error:", error);
                setData(null);
            } finally {
                setIsLoading(false);
            }
        }
        loadMasterPlan();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-zinc-500">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <div className="text-xs font-medium text-blue-400 animate-pulse">Aggregating data from all phases...</div>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center text-rose-400">Failed to load Master Plan data.</div>;
    }

    const { overallKpis, phases } = data;

    return (
        <div className="space-y-6">
            {/* Overall KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Overall Progress</p>
                    <p className="text-4xl font-extrabold text-white mt-2">{overallKpis.overallProgress}%</p>
                </div>
                <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Total Tasks</p>
                    <p className="text-4xl font-extrabold text-blue-400 mt-2">{overallKpis.totalTasks}</p>
                </div>
                <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Total Mandays</p>
                    <p className="text-4xl font-extrabold text-cyan-400 mt-2">{overallKpis.totalMandays}</p>
                </div>
                <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Overdue</p>
                    <p className="text-4xl font-extrabold text-red-400 mt-2">{overallKpis.overdue}</p>
                </div>
            </div>

            {/* Phases List */}
            <div className="bg-[#0a0a0c]/80 backdrop-blur-xl rounded-2xl border border-zinc-800/80 shadow-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white tracking-wide">Phases Overview</h3>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-2">
                            <FileDown size={14} /> Export
                        </button>
                        <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-2">
                            <GanttChartSquare size={14} /> Gantt View
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {phases.map(phase => (
                        <div key={phase.name} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/60">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-blue-400">{phase.name}</h4>
                                    <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
                                        <span className="flex items-center gap-1.5"><BarChart size={12} /> {phase.taskCount} Tasks</span>
                                        <span className="flex items-center gap-1.5"><CheckCircle size={12} /> {phase.doneCount} Done</span>
                                        <span className="flex items-center gap-1.5"><Clock size={12} /> {phase.manday} Mandays</span>
                                        {phase.overdueCount > 0 && (
                                            <span className="flex items-center gap-1.5 text-rose-400"><AlertTriangle size={12} /> {phase.overdueCount} Overdue</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-white">{phase.progress}%</p>
                                    <p className="text-[10px] text-zinc-500">Completed</p>
                                </div>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full"
                                    style={{ width: `${phase.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
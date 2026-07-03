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
    tasks?: any[];
}

export default function MasterPlanView() {
    const [data, setData] = useState<MasterPlanData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState("2026-06-22");
    const [endDate, setEndDate] = useState("2026-07-05");

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
            <div className="flex flex-col items-center justify-center h-96 text-zinc-400">
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
                                    <p className="text-[10px] text-zinc-400">Completed</p>
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

            {/* Difficulties Report */}
            {data.tasks && (
                <div className="bg-[#121318] border border-rose-500/30 rounded-2xl p-5 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            <h3 className="text-lg font-bold text-rose-100">Báo cáo Khó khăn / Issues</h3>
                        </div>
                        <div className="flex items-center gap-3 bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-xs text-zinc-300 outline-none px-2"
                            />
                            <span className="text-zinc-600">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-xs text-zinc-300 outline-none px-2"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        {(() => {
                            const startTs = new Date(startDate || '2000-01-01').getTime();
                            const endTs = new Date(endDate || '2099-12-31').getTime();
                            
                            const issues = data.tasks.filter(t => {
                                if (!t.startDateEst && !t.endDateEst && !t.endDateActual) return false;
                                const s = new Date(t.startDateEst || '2000-01-01').getTime();
                                const e = new Date(t.endDateEst || t.endDateActual || '2000-01-01').getTime();
                                const inRange = (s >= startTs && s <= endTs) || (e >= startTs && e <= endTs);
                                
                                const isIssue = t.status === 'Blocked' || 
                                                t.status === 'Cancel' || 
                                                t.status === 'Late' || 
                                                parseFloat(t.daysLate) > 0 || 
                                                (t.detailTask || '').toLowerCase().includes('khó khăn') || 
                                                (t.remark || '').toLowerCase().includes('khó khăn') || 
                                                (t.notes || '').toLowerCase().includes('khó khăn');
                                                
                                return inRange && isIssue;
                            });

                            if (issues.length === 0) {
                                return <div className="text-sm text-zinc-500 text-center py-4">Không có task nào gặp khó khăn trong giai đoạn này.</div>;
                            }

                            return issues.map(task => (
                                <div key={task.taskId} className="bg-rose-950/20 border border-rose-900/50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-semibold text-rose-200">{task.detailTask}</p>
                                        <p className="text-xs text-zinc-400 mt-1">Assignee: {task.assigned} | Giai đoạn: {task.rootTasks || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-rose-500/20 text-rose-400">
                                            {parseFloat(task.daysLate) > 0 ? `Late ${task.daysLate} days` : task.status}
                                        </span>
                                        <p className="text-[10px] text-zinc-500 mt-1">{task.endDateEst || task.endDateActual}</p>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
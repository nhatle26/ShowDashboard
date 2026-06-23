// app/(dashboard)/page.tsx
"use client"; // Chuyển thành Client Component để dùng state cho modal

import React, { useState, useEffect } from "react";
import KpiCard from "@/components/KpiCard";
import WeeklyChart from "@/components/WeeklyChart";
import AddTaskModal from "@/components/AddTaskModal"; // Import modal

// Định nghĩa kiểu dữ liệu mẫu sau này map với cột của Google Sheets
interface ProjectItem {
  taskId: string;
  detailTask: string;
  priority: string;
  mandayEst: string;
  status: string;
  startDateEst: string;
  assigned: string;
  support: string;
  kpiRatio: string;
  skillSolution: string;
  skillVendor: string;
  ticketId: string;
  remark: string;
  send: string;
  endDateEst: string;
  mandayActual: string;
  endDateActual: string;
  daysLate: string;
  kpiBase: string;
  kpiPerform: string;
  kpiOvertime: string;
  kpiFinal: string;
  subId: string;
  rootTasks: string;
  notes: string;
  solutions: string;
  isHeader?: boolean;
}

export default function Page() {
  // State để quản lý dữ liệu và modal
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<ChartDataItem[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState("1.Sale/Admin");
  const [tabs, setTabs] = useState<string[]>([
    "1.Sale/Admin",
    "2.Init",
    "2.1.Lab/PoC",
    "3.Implement",
    "4.MA"
  ]);

  useEffect(() => {
    async function loadProjects() {
      try {
        setIsLoading(true);
        setIsError(false);
        const response = await fetch(`/api/projects?tab=${encodeURIComponent(activeTab)}`);
        if (!response.ok) throw new Error("Failed to fetch projects");
        const resData = await response.json();

        if (resData.success && Array.isArray(resData.data)) {
          const rows: any[][] = resData.data;
          let taskCounter = 1;
          // Bỏ dòng header đầu tiên (dòng tiêu đề cột), filter dòng trống
          const formattedProjects = rows.slice(1)
            .filter((row: any[]) => {
              if (row.length === 0 || !row.some(cell => cell && cell.toString().trim() !== '')) return false;
              const col0 = (row[0] || "").toString().trim();
              const col1 = (row[1] || "").toString().trim();
              if (col0.toUpperCase() === "TASK ID" || col1.toUpperCase() === "DETAIL TASK") return false;
              
              const isSectionHeader = col0 && !col1 && (
                col0.startsWith("PHASE") || col0.match(/^[IVX]+\./) || col0.match(/^Issue/)
              );
              return isSectionHeader || col1 !== ""; // Chỉ lấy dòng tiêu đề hoặc dòng có chi tiết task
            })
            .map((row: any[]) => {
              // Trong sheet: "PHASE A", "I. SALES..." nằm ở col[0], task con có col[0]=taskId, col[1]=detailTask
              const col0 = (row[0] || "").toString().trim();
              const col1 = (row[1] || "").toString().trim();
              const isSectionHeader = col0 && !col1 && (
                col0.startsWith("PHASE") ||
                col0.match(/^[IVX]+\./) ||
                col0.match(/^Issue/)
              );

              if (isSectionHeader) {
                // Dòng tiêu đề section: reset counter về 1
                taskCounter = 1;
                return {
                  taskId: "", detailTask: col0,
                  priority: "", mandayEst: row[3] || "",
                  status: "", startDateEst: "", assigned: "", support: "",
                  kpiRatio: "", skillSolution: "", skillVendor: "", ticketId: "",
                  remark: "", send: "", endDateEst: "", mandayActual: "",
                  endDateActual: "", daysLate: "", kpiBase: "", kpiPerform: "",
                  kpiOvertime: "", kpiFinal: "", subId: "", rootTasks: "",
                  notes: "", solutions: "", isHeader: true
                };
              }

              // Dòng task thường: tự tăng ID nếu bị bỏ trống
              const currentTaskId = row[0] ? row[0] : taskCounter.toString();
              taskCounter++;

              return {
                taskId: currentTaskId,
                detailTask: row[1] || "",
                priority: row[2] || "",
                mandayEst: row[3] || "",
                status: row[4] || "",
                startDateEst: row[5] || "",
                assigned: row[6] || "",
                support: row[7] || "",
                kpiRatio: row[8] || "",
                skillSolution: row[9] || "",
                skillVendor: row[10] || "",
                ticketId: row[11] || "",
                remark: row[12] || "",
                send: row[13] || "",
                endDateEst: row[14] || "",
                mandayActual: row[15] || "",
                endDateActual: row[16] || "",
                daysLate: row[17] || "",
                kpiBase: row[18] || "",
                kpiPerform: row[19] || "",
                kpiOvertime: row[20] || "",
                kpiFinal: row[21] || "",
                subId: row[22] || "",
                rootTasks: row[23] || "",
                notes: row[24] || "",
                solutions: row[25] || "",
                isHeader: false
              };
            });

          setProjects(formattedProjects);
        } else {
          setProjects([]);
          setIsError(true);
        }
      } catch (error) {
        console.error("Google Sheets Error:", error);
        setProjects([]);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }
    if (activeTab) loadProjects();
  }, [activeTab]);

  return (
    <>
        {/* 4 STAT CARDS: FULL WIDTH 1 HÀNG */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Total Tasks</p>
            <p className="text-4xl font-extrabold text-white mt-2">{projects.filter(p => !p.isHeader).length}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Across all phases in <span className="text-blue-400">{activeTab}</span></p>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">High Priority</p>
            <p className="text-4xl font-extrabold text-rose-400 mt-2">{projects.filter(p => p.priority === 'High').length}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Tasks marked as high priority</p>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">In Progress</p>
            <p className="text-4xl font-extrabold text-amber-400 mt-2">{projects.filter(p => p.status && p.status !== 'Done').length}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Tasks currently active</p>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Completed</p>
            <p className="text-4xl font-extrabold text-emerald-400 mt-2">{projects.filter(p => p.status === 'Done').length}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Tasks marked as done</p>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU: FULL WIDTH */}
        <div className="bg-[#0a0a0c]/80 backdrop-blur-xl rounded-2xl border border-zinc-800/80 shadow-2xl p-5">

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-white tracking-wide">Task List</h3>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {projects.filter(p => !p.isHeader).length} TASKS
                </span>
              </div>
              {/* Pill Tabs */}
              <div className="flex flex-wrap gap-2 p-1 bg-zinc-900/50 backdrop-blur-md rounded-xl border border-zinc-800/50 w-fit">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${activeTab === t
                        ? "bg-gradient-to-b from-zinc-700 to-zinc-800 text-white shadow-md border border-zinc-600/50"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="group relative bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-600/30 overflow-hidden"
            >
              <span className="relative flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                Add Task
              </span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-auto custom-scrollbar border border-zinc-800/60 rounded-xl relative max-h-[600px]">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/50 backdrop-blur-sm z-20">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <div className="text-xs font-medium text-blue-400 animate-pulse">Syncing data...</div>
              </div>
            ) : null}

            {projects.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-zinc-500 gap-3 p-6">
                {isError ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                      <svg className="w-7 h-7 text-rose-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-zinc-300">Chưa kết nối Google Sheet</span>
                    <span className="text-[11px] text-zinc-500 text-center max-w-[320px] leading-relaxed">
                      Tab <span className="text-blue-400 font-mono font-semibold">{activeTab}</span> chưa có dữ liệu.<br />
                      Share sheet cho <span className="text-zinc-300 font-mono text-[10px]">poptech-pm@poptech-pm.iam.gserviceaccount.com</span> rồi F5 lại.
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center">
                      <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-zinc-400">Tab <span className="text-blue-400">{activeTab}</span> chưa có task nào</span>
                    <span className="text-[11px] text-zinc-600">Bấm <span className="text-white font-semibold">+ Add Task</span> để thêm task đầu tiên</span>
                  </>
                )}
              </div>
            ) : (
              <table className="min-w-full text-xs text-left whitespace-nowrap border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="text-zinc-400 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">TASK ID</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase min-w-[200px]">DETAIL TASK</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">PRIORITY</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">MANDAY EST</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">STATUS</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">START DATE</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">ASSIGNED</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">SUPPORT</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">KPI RATIO</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">SKILL SOLUTION</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">SKILL VENDOR</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">TICKET ID</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">REMARK</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">SEND</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">END DATE EST</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">MD ACTUAL</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">END ACTUAL</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">DAYS LATE</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">KPI BASE</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">KPI PERFORM</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">KPI OVERTIME</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">KPI FINAL</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">SUB ID</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">ROOT TASKS</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">NOTES</th>
                    <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">SOLUTIONS</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300 divide-y divide-zinc-800/60">
                  {projects.map((p, idx) => (
                      <tr
                        key={idx}
                        className={`transition-colors duration-150 border-b border-zinc-800/30 hover:bg-zinc-800/40 ${
                          p.isHeader 
                            ? 'bg-blue-900/20 border-l-4 border-l-blue-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' 
                            : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 font-mono text-zinc-500 text-[11px]">{p.taskId}</td>
                        <td className={`px-4 py-2.5 ${
                          p.isHeader 
                            ? 'font-bold text-white text-[13px] uppercase tracking-wider' 
                            : 'font-medium text-zinc-300'
                        }`}>{p.detailTask}</td>
                      <td className="px-4 py-2.5">
                        {p.priority && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${p.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : p.priority === 'Normal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>{p.priority}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400">{p.mandayEst}</td>
                      <td className="px-4 py-2.5">
                        {p.status && (
                          <span className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.status === 'Done' ? 'bg-green-500' : p.status === 'To Do' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                            {p.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400 font-mono text-[11px]">{p.startDateEst}</td>
                      <td className="px-4 py-2.5">{p.assigned}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{p.support}</td>
                      <td className="px-4 py-2.5">{p.kpiRatio}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{p.skillSolution}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{p.skillVendor}</td>
                      <td className="px-4 py-2.5">{p.ticketId}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{p.remark}</td>
                      <td className="px-4 py-2.5">{p.send}</td>
                      <td className="px-4 py-2.5 text-zinc-400 font-mono text-[11px]">{p.endDateEst}</td>
                      <td className="px-4 py-2.5">{p.mandayActual}</td>
                      <td className="px-4 py-2.5 text-zinc-400 font-mono text-[11px]">{p.endDateActual}</td>
                      <td className="px-4 py-2.5">{p.daysLate}</td>
                      <td className="px-4 py-2.5">{p.kpiBase}</td>
                      <td className="px-4 py-2.5">{p.kpiPerform}</td>
                      <td className="px-4 py-2.5">{p.kpiOvertime}</td>
                      <td className="px-4 py-2.5">{p.kpiFinal}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{p.subId}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{p.rootTasks}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{p.notes}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{p.solutions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(24, 24, 27, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(63, 63, 70, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(82, 82, 91, 1);
        }
      `}</style>

      {/* Render Modal */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        activeTab={activeTab}
        onSuccess={() => {
          // Gây render lại component hoặc load lại danh sách
          setIsLoading(true);
          fetch(`/api/projects?tab=${encodeURIComponent(activeTab)}`)
            .then(res => res.json())
            .then(resData => {
              if (resData.success && Array.isArray(resData.data)) {
                const rows = resData.data;
                let taskCounter = 1;
                const formattedProjects = rows.slice(1)
                  .filter((row: any[]) => {
                    if (row.length === 0 || !row.some(cell => cell && cell.toString().trim() !== '')) return false;
                    const col0 = (row[0] || "").toString().trim();
                    const col1 = (row[1] || "").toString().trim();
                    if (col0.toUpperCase() === "TASK ID" || col1.toUpperCase() === "DETAIL TASK") return false;
                    
                    const isSectionHeader = col0 && !col1 && (
                      col0.startsWith("PHASE") || col0.match(/^[IVX]+\./) || col0.match(/^Issue/)
                    );
                    return isSectionHeader || col1 !== "";
                  })
                  .map((row: any[]) => {
                    const col0 = (row[0] || "").toString().trim();
                    const col1 = (row[1] || "").toString().trim();
                    const isSectionHeader = col0 && !col1 && (
                      col0.startsWith("PHASE") ||
                      col0.match(/^[IVX]+\./) ||
                      col0.match(/^Issue/)
                    );

                    if (isSectionHeader) {
                      taskCounter = 1;
                      return {
                        taskId: "", detailTask: col0,
                        priority: "", mandayEst: row[3] || "",
                        status: "", startDateEst: "", assigned: "", support: "",
                        kpiRatio: "", skillSolution: "", skillVendor: "", ticketId: "",
                        remark: "", send: "", endDateEst: "", mandayActual: "",
                        endDateActual: "", daysLate: "", kpiBase: "", kpiPerform: "",
                        kpiOvertime: "", kpiFinal: "", subId: "", rootTasks: "",
                        notes: "", solutions: "", isHeader: true
                      };
                    }

                    const currentTaskId = row[0] ? row[0] : taskCounter.toString();
                    taskCounter++;

                    return {
                      taskId: currentTaskId,
                      detailTask: row[1] || "",
                      priority: row[2] || "",
                      mandayEst: row[3] || "",
                      status: row[4] || "",
                      startDateEst: row[5] || "",
                      assigned: row[6] || "",
                      support: row[7] || "",
                      kpiRatio: row[8] || "",
                      skillSolution: row[9] || "",
                      skillVendor: row[10] || "",
                      ticketId: row[11] || "",
                      remark: row[12] || "",
                      send: row[13] || "",
                      endDateEst: row[14] || "",
                      mandayActual: row[15] || "",
                      endDateActual: row[16] || "",
                      daysLate: row[17] || "",
                      kpiBase: row[18] || "",
                      kpiPerform: row[19] || "",
                      kpiOvertime: row[20] || "",
                      kpiFinal: row[21] || "",
                      subId: row[22] || "",
                      rootTasks: row[23] || "",
                      notes: row[24] || "",
                      solutions: row[25] || "",
                      isHeader: false
                    };
                  });

                setProjects(formattedProjects);
              }
            })
            .finally(() => setIsLoading(false));
        }}
      />
    </>
  );
}
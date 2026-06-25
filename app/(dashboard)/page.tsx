// app/(dashboard)/page.tsx
"use client"; // Chuyển thành Client Component để dùng state cho modal

import React, { useState, useEffect } from "react";
import AddTaskModal from "@/components/AddTaskModal"; // Import modal
import MasterPlanView from "@/components/MasterPlanView"; // Import Master Plan
import OverdueTasksWarning from "@/components/OverdueTasksWarning"; // Import cảnh báo

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
  isHeader?: boolean;
  weekEst?: string;
  monthEst?: string;
  weekActual?: string;
  monthActual?: string;
}

export default function Page() {
  // State để quản lý dữ liệu và modal
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState("__masterplan__");

  // State cho các KPI mới
  const [overdueCount, setOverdueCount] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [totalMandays, setTotalMandays] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState<ProjectItem[]>([]);
  const [dueThisWeekCount, setDueThisWeekCount] = useState(0);
  const [onTrackRate, setOnTrackRate] = useState(0);

  const [tabs, setTabs] = useState<string[]>([
    "__masterplan__",
    "Master",
    "1.Sale/Admin",
    "2.Init",
    "2.1.Lab/PoC",
    "3.Implement",
    "4.MA"
  ]);

  useEffect(() => {
    if (activeTab === '__masterplan__') return; // Master Plan có component riêng để fetch data

    async function loadProjects() {
      try {
        setIsLoading(true);
        setIsError(false);
        const response = await fetch(`/api/projects?tab=${encodeURIComponent(activeTab)}`);
        if (!response.ok) throw new Error("Failed to fetch projects");
        const resData = await response.json();

        if (resData.success && Array.isArray(resData.data)) {
          const formattedProjects: ProjectItem[] = resData.data;

          // Tính toán KPI mở rộng
          const tasksOnly = formattedProjects.filter(p => !p.isHeader);
          const doneTasks = tasksOnly.filter(p => p.status === 'Done').length;
          const totalTasks = tasksOnly.length;

          const overdue = tasksOnly.filter(p => {
            if (p.status === 'Done' || !p.endDateEst) return false;
            const endDate = new Date(p.endDateEst);
            // Cần một thư viện date-fns hoặc moment để xử lý ngày tháng tốt hơn
            // Giả sử format là YYYY-MM-DD hoặc MM/DD/YYYY
            try {
              return endDate < new Date();
            } catch {
              return false;
            }
          });
          setOverdueCount(overdue.length);
          setOverdueTasks(overdue);

          // Tính toán "Due This Week"
          const today = new Date();
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          startOfWeek.setHours(0, 0, 0, 0);
          endOfWeek.setHours(23, 59, 59, 999);

          const dueThisWeek = tasksOnly.filter(p => {
            if (!p.endDateEst) return false;
            try {
              const endDate = new Date(p.endDateEst);
              return endDate >= startOfWeek && endDate <= endOfWeek;
            } catch {
              return false;
            }
          });
          setDueThisWeekCount(dueThisWeek.length);

          // Tính toán "On Track"
          const onTrackTasks = totalTasks - overdue.length;
          const onTrackPercentage = totalTasks > 0 ? Math.round((onTrackTasks / totalTasks) * 100) : 0;
          setOnTrackRate(onTrackPercentage);

          setCompletionRate(totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0);

          const mandays = tasksOnly.reduce((acc, p) => acc + (parseFloat(p.mandayEst) || 0), 0);
          setTotalMandays(mandays);

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
      {activeTab !== '__masterplan__' && (
        <>
          {/* Row 1: 4 thẻ cũ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Total Tasks</p>
              <p className="text-4xl font-extrabold text-white mt-2">{projects.filter(p => !p.isHeader && p.detailTask).length}</p>
              <p className="text-[11px] text-zinc-500 mt-1">In <span className="text-blue-400">{activeTab}</span> tab</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">In Progress</p>
              <p className="text-4xl font-extrabold text-amber-400 mt-2">{projects.filter(p => p.status && p.status.toLowerCase() === 'in progress').length}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Tasks currently active</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Completed</p>
              <p className="text-4xl font-extrabold text-emerald-400 mt-2">{projects.filter(p => p.status === 'Done').length}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Tasks marked as done</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">High Priority</p>
              <p className="text-4xl font-extrabold text-rose-400 mt-2">{projects.filter(p => p.priority === 'High').length}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Tasks marked as high priority</p>
            </div>
          </div>
          {/* Row 2: 5 thẻ mới */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Overdue</p>
              <p className="text-4xl font-extrabold text-red-400 mt-2">{overdueCount}</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Completion Rate</p>
              <p className="text-4xl font-extrabold text-emerald-400 mt-2">{completionRate || 0}%</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Total Mandays</p>
              <p className="text-4xl font-extrabold text-cyan-400 mt-2">{totalMandays}</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Due This Week</p>
              <p className="text-4xl font-extrabold text-purple-400 mt-2">{dueThisWeekCount}</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">On Track</p>
              <p className="text-4xl font-extrabold text-green-400 mt-2">{onTrackRate}%</p>
            </div>
          </div>
        </>
      )}

      {/* Pill Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 p-1 bg-zinc-900/50 backdrop-blur-md rounded-xl border border-zinc-800/50 w-fit">
          {tabs.map((t) => {
            const isMasterPlan = t === '__masterplan__';
            const label = isMasterPlan ? 'Master Plan' : t;

            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${activeTab === t
                  ? "bg-gradient-to-b from-zinc-700 to-zinc-800 text-white shadow-md border border-zinc-600/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === '__masterplan__' ? (
        <MasterPlanView />
      ) : (
        <>
          <OverdueTasksWarning tasks={overdueTasks} />
          {/* BẢNG DỮ LIỆU: FULL WIDTH */}
          <div className="bg-gradient-to-br from-[#071019] via-[#0b1016] to-[#0a0a0c] backdrop-blur-xl rounded-2xl border border-zinc-800/80 shadow-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-5">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-bold text-white tracking-wide">Task List</h3>
                  <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {projects.filter(p => !p.isHeader).length} TASKS
                  </span>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="group relative bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-900/20 hover:shadow-cyan-600/30 overflow-hidden"
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
                    <tr className="text-zinc-400 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 backdrop-blur-md border-b border-blue-700/30 shadow-sm shadow-blue-900/10">
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
                      <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">WEEK EST</th>
                      <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">MONTH EST</th>
                      <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">WEEK ACTUAL</th>
                      <th className="px-4 py-3 font-semibold tracking-wider text-[10px] uppercase">MONTH ACTUAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {projects.map((p, idx) => (
                      <React.Fragment key={idx}>
                        <tr
                          key={idx}
                          className={`transition-colors duration-150 border-b border-zinc-800/30 ${p.isHeader ? 
                            p.headerType === 'phase' ? 'bg-amber-200 text-black' :
                              p.headerType === 'issue' || p.headerType === 'majorTask' ? 'bg-green-300 text-black' :
                                // majorTask (số la mã)
                                ''
                            : 'hover:bg-zinc-800/40' // Dòng task nhỏ bình thường
                            }`}
                        >
                          {p.isHeader && (p.headerType === 'majorTask' || p.headerType === 'issue') ? (
                            <td colSpan={2} className="px-4 py-2.5 font-bold text-black text-[13px] uppercase tracking-wider">
                              {p.taskId} {p.detailTask.toUpperCase()}
                            </td>
                          ) : (
                            <>
                              <td className={`px-4 py-2.5 font-mono text-[11px] ${p.isHeader ? 'text-black' : 'text-zinc-400'}`}>
                                <div className="flex items-center gap-2"><span>{p.taskId}</span></div>
                              </td>
                              <td className={`px-4 py-2.5 ${p.isHeader ? 'font-bold text-black text-[13px] uppercase tracking-wider' : 'font-medium text-white'}`}>
                                {p.isHeader ? p.detailTask.toUpperCase() : p.detailTask}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-2.5">
                            {p.priority && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${p.priority === 'High' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : p.priority === 'Normal' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}>{p.priority}</span>
                            )}
                          </td>
                          <td className={`px-4 py-2.5 ${p.isHeader ? 'text-black font-bold' : 'text-emerald-200'}`}>{p.mandayEst}</td>
                          <td className="px-4 py-2.5">
                            {p.status && (
                              <span className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'Done' ? 'bg-emerald-400' : p.status === 'To Do' ? 'bg-cyan-400' : 'bg-amber-400'}`}></span>
                                <span className={`${p.status === 'Done' ? 'text-emerald-200' : p.status === 'To Do' ? 'text-cyan-200' : 'text-amber-200'}`}>{p.status}</span>
                              </span>
                            )}
                          </td>
                          <td className={`px-4 py-2.5 font-mono text-[11px] ${p.isHeader ? 'text-black' : 'text-zinc-400'}`}>{p.startDateEst}</td>
                          <td className={`px-4 py-2.5 ${p.isHeader ? 'text-black' : 'text-white'}`}>{p.assigned}</td>
                          <td className={`px-4 py-2.5 ${p.isHeader ? 'text-black' : 'text-zinc-400'}`}>{p.support}</td>
                          <td className="px-4 py-2.5">{p.kpiRatio}</td>
                          <td className={`px-4 py-2.5 ${p.isHeader ? 'text-black' : 'text-zinc-400'}`}>{p.skillSolution}</td>
                          <td className={`px-4 py-2.5 ${p.isHeader ? 'text-black' : 'text-zinc-400'}`}>{p.skillVendor}</td>
                          <td className="px-4 py-2.5">{p.ticketId}</td>
                          <td className="px-4 py-2.5 text-zinc-500">{p.remark}</td>
                          <td className="px-4 py-2.5">{p.send}</td>
                          <td className={`px-4 py-2.5 font-mono text-[11px] ${p.isHeader ? 'text-black' : 'text-zinc-400'}`}>{p.endDateEst}</td>
                          <td className={`px-4 py-2.5 ${p.isHeader ? 'text-black' : 'text-white'}`}>{p.mandayActual}</td>
                          <td className={`px-4 py-2.5 font-mono text-[11px] ${p.isHeader ? 'text-black' : 'text-zinc-400'}`}>{p.endDateActual}</td>
                          <td className="px-4 py-2.5">{p.daysLate}</td>
                          <td className="px-4 py-2.5">{p.kpiBase}</td>
                          <td className="px-4 py-2.5">{p.kpiPerform}</td>
                          <td className="px-4 py-2.5">{p.kpiOvertime}</td>
                          <td className="px-4 py-2.5">{p.kpiFinal}</td>
                          <td className="px-4 py-2.5 text-zinc-500">{p.subId}</td>
                          <td className="px-4 py-2.5 text-zinc-400">{p.rootTasks}</td>
                          <td className="px-4 py-2.5 text-zinc-500">{p.notes}</td>
                          <td className={`px-4 py-2.5 ${p.isHeader ? 'text-black' : 'text-zinc-400'}`}>{p.weekEst}</td>
                          <td className={`px-4 py-2.5 ${p.isHeader ? 'text-black' : 'text-zinc-400'}`}>{p.monthEst}</td>
                          <td className={`px-4 py-2.5 ${p.isHeader ? 'text-black' : 'text-white'}`}>{p.weekActual}</td>
                          <td className={`px-4 py-2.5 ${p.isHeader ? 'text-black' : 'text-white'}`}>{p.monthActual}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}


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
              if (resData.success) setProjects(resData.data);
            })
            .finally(() => setIsLoading(false));
        }}
      />
    </>
  );
}
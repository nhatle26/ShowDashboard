// app/(dashboard)/page.tsx
"use client"; // Chuyển thành Client Component để dùng state cho modal

import React, { useState, useEffect, useMemo, useCallback } from "react";
import AddTaskModal from "@/components/AddTaskModal";
import MasterPlanView from "@/components/MasterPlanView"; // Import MasterPlan
import OverdueTasksWarning from "@/components/OverdueTasksWarning"; // Import cảnh báo
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  pointerWithin,
  CollisionDetection,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ProjectItem } from "@/types/project";
import SortableRow from "@/components/SortableRow";
import DroppableTab from "@/components/DroppableTab";
import QuickAddRow from "@/components/QuickAddRow";

// Custom collision detection to handle dragging to tabs
const customCollisionDetection: CollisionDetection = (args) => {
  // First, check if there's any droppable tab under the pointer
  const pointerCollisions = pointerWithin(args);
  const tabCollision = pointerCollisions.find(c => c.id.toString().startsWith('tab-'));
  if (tabCollision) {
    return [tabCollision];
  }

  // If not hovering over a tab, fall back to closestCenter for sorting
  return closestCenter(args);
};

// Helper function to reindex tasks after drag and drop
function reindexDraggedTasks(reorderedProjects: ProjectItem[], sourceSection: string, destSection: string): ProjectItem[] {
  let taskCounter = 1;
  let currentRootTask = "";
  let currentSectionId = "";

  return reorderedProjects.map(p => {
    if (p.isHeader) {
      taskCounter = 1;
      currentSectionId = p.taskId + p.detailTask;
      if (p.headerType === 'majorTask') {
        currentRootTask = p.taskId;
      }
      return p;
    } else {
      const newRootTask = currentRootTask || p.rootTasks;

      // Chỉ re-number taskId cho các nhóm task lớn bị ảnh hưởng (nơi lấy đi và nơi thả vào)
      if (currentSectionId === sourceSection || currentSectionId === destSection) {
        const newTaskId = taskCounter.toString();
        taskCounter++;
        return {
          ...p,
          taskId: newTaskId,
          rootTasks: newRootTask
        };
      } else {
        taskCounter++;
        return {
          ...p,
          rootTasks: newRootTask
        };
      }
    }
  });
}

// Helper function to reindex all tasks after adding a new one
function reindexAllTasks(projects: ProjectItem[]): ProjectItem[] {
  let taskCounter = 1;
  return projects.map(p => {
    if (p.isHeader) {
      taskCounter = 1;
      return p;
    } else {
      const newTaskId = taskCounter.toString();
      taskCounter++;
      return { ...p, taskId: newTaskId };
    }
  });
}

export default function Page() {
  // State để quản lý dữ liệu và modal
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [usersList, setUsersList] = useState<string[]>([]);
  const [vendorSolutions, setVendorSolutions] = useState<{name: string, vendors: string[]}[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [quickAddAfter, setQuickAddAfter] = useState<number | null>(null);
  const [hoveredTaskIndex, setHoveredTaskIndex] = useState<number | null>(null);

  // State cho danh sách người thực hiện và hỗ trợ
  const [assignees, setAssignees] = useState<string[]>([]);
  const [supporters, setSupporters] = useState<string[]>([]);

  // Lọc danh sách các task cha để truyền vào modal
  const parentTasks = useMemo(() => {
    return projects
      .filter(p => p.isHeader && (p.headerType === 'majorTask' || p.headerType === 'issue'))
      .map(p => p.taskId);
  }, [projects]);

  // Derived State (KPIs)
  const kpiData = useMemo(() => {
    const tasksOnly = projects.filter(p => !p.isHeader);
    const validTasks = tasksOnly.filter(p => p.detailTask);
    const totalTasks = tasksOnly.length;
    const inProgressTasks = tasksOnly.filter(p => p.status && p.status.toLowerCase() === 'in progress').length;
    const doneTasks = tasksOnly.filter(p => p.status === 'Done').length;
    const highPriorityTasks = tasksOnly.filter(p => p.priority === 'High').length;

    const overdueList = tasksOnly.filter(p => {
      if (p.status === 'Done' || !p.endDateEst) return false;
      try { return new Date(p.endDateEst) < new Date(); } catch { return false; }
    });

    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    startOfWeek.setHours(0, 0, 0, 0);
    endOfWeek.setHours(23, 59, 59, 999);

    const dueThisWeekList = tasksOnly.filter(p => {
      if (!p.endDateEst) return false;
      try {
        const endDate = new Date(p.endDateEst);
        return endDate >= startOfWeek && endDate <= endOfWeek;
      } catch { return false; }
    });

    const onTrackTasksCount = totalTasks - overdueList.length;

    return {
      totalTasks: validTasks.length,
      inProgressTasks,
      doneTasks,
      highPriorityTasks,
      overdueTasks: overdueList,
      overdueCount: overdueList.length,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      totalMandays: tasksOnly.reduce((acc, p) => acc + (parseFloat(p.mandayEst) || 0), 0),
      dueThisWeekCount: dueThisWeekList.length,
      onTrackRate: totalTasks > 0 ? Math.round((onTrackTasksCount / totalTasks) * 100) : 0
    };
  }, [projects]);

  const [tabs, setTabs] = useState<string[]>([
    "Dashboard",
    "Master Plan",
    "1.Sale/Admin",
    "2.Init",
    "2.1.Lab/PoC",
    "3.Implement",
    "4.MA"
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      let formattedProjects: ProjectItem[] = [];
      let fetchedMeta: any = null;

      // 1. Kiểm tra localStorage xem có bản nháp không
      const localData = localStorage.getItem(`draft_${activeTab}`);
      if (localData && localData != "undefined") {
        try {
          formattedProjects = JSON.parse(localData);
          console.log("Loaded from localStorage for tab:", activeTab);
        } catch (e) {
          console.error("Lỗi parse localStorage", e);
        }
      }

      // 2. Nếu không có dữ liệu ở local thì mới gọi API từ Sheet
      if (!formattedProjects.length) {
        // Map tên tab trên website → tên tab thật trong Google Sheet
        const sheetTab = activeTab === 'Master Plan' ? 'Master' : activeTab;
        const response = await fetch(`/api/projects?tab=${encodeURIComponent(sheetTab)}`);
        if (!response.ok) throw new Error("Failed to fetch projects");
        const resData = await response.json();

        if (resData.success && Array.isArray(resData.data)) {
          formattedProjects = resData.data.map((item: ProjectItem, index: number) => ({
            ...item, originalIndex: item.originalIndex ?? (index + 1)
          }));
          fetchedMeta = resData.meta;
        }
      }

      if (formattedProjects.length > 0) {
        setProjects(formattedProjects);

        // Lưu lại vào localStorage ngay khi load xong để làm gốc (nếu load từ API)
        if (!localData) {
          localStorage.setItem(`draft_${activeTab}`, JSON.stringify(formattedProjects));
        }

        // Cập nhật danh sách assignees và supporters nếu có (chỉ có khi gọi API)
        if (fetchedMeta) {
          setAssignees(fetchedMeta.assignees || []);
          setSupporters(fetchedMeta.supporters || []);
        }
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
  }, [activeTab]);

  useEffect(() => {
    // Fetch danh sách user
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (data.users) setUsersList(data.users);
        }
      } catch (e) {
        console.error("Failed to fetch users", e);
      }
    };
    
    const fetchVendors = async () => {
      try {
        const res = await fetch('/api/vendors');
        if (res.ok) {
           const data = await res.json();
           if (data.solutions) setVendorSolutions(data.solutions);
        }
      } catch (e) { console.error("Failed to fetch vendors", e); }
    };
    
    fetchUsers();
    fetchVendors();
  }, []);

  useEffect(() => {
    if (activeTab === 'Dashboard') return;
    loadProjects();
  }, [activeTab, loadProjects]);

  // Tự động lưu vào localStorage mỗi khi projects thay đổi
  useEffect(() => {
    // Chỉ lưu khi đã load xong và có dữ liệu (tránh ghi đè mảng rỗng lúc đang load)
    if (!isLoading && projects.length > 0) {
      localStorage.setItem(`draft_${activeTab}`, JSON.stringify(projects));
    }
  }, [projects, activeTab, isLoading]);

  // Hàm xử lý khi kết thúc kéo thả
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return; // Không làm gì nếu kéo và thả vào cùng một chỗ

    // Case 1: Di chuyển sang tab khác
    const overId = over.id.toString();
    if (overId.startsWith('tab-') && active.data.current?.task) {
      const destinationTab = overId.replace('tab-', '');
      if (destinationTab === activeTab) return; // Không làm gì nếu thả vào tab hiện tại

      const taskToMove = active.data?.current?.task as ProjectItem;
      if (!taskToMove) return;

      // Hiển thị xác nhận trước khi di chuyển
      if (confirm(`Bạn có chắc muốn chuyển task "${taskToMove.detailTask}" sang tab "${destinationTab}"?`)) {
        try {
          setIsLoading(true);

          // Xóa khỏi tab hiện tại ở local thay vì gọi API
          setProjects(prev => prev.filter(p => p.originalIndex !== taskToMove.originalIndex));

          // await loadProjects(); // Tắt load lại từ sheet để giữ local
        } catch (error) {
          console.error("Error moving task:", error);
          alert("Có lỗi xảy ra khi di chuyển task.");
        } finally {
          setIsLoading(false);
        }
      }
      return;
    } else {
      // Case 2: Sắp xếp lại trong cùng tab
      const oldIndex = projects.findIndex(p => p.originalIndex === active.id);
      const newIndex = projects.findIndex(p => p.originalIndex === over.id);

      console.log("[DND] active.id:", active.id, "over.id:", over.id);
      console.log("[DND] oldIndex:", oldIndex, "newIndex:", newIndex);

      if (oldIndex === -1 || newIndex === -1) {
        console.log("[DND] BLOCKED: index not found");
        return;
      }

      // Không cho phép kéo task lớn (header)
      if (projects[oldIndex].isHeader) {
        console.log("[DND] BLOCKED: cannot drag a header");
        return;
      }

      if (oldIndex === newIndex) return;

      console.log("[DND] Proceeding:", oldIndex, "->", newIndex);
      const reorderedProjects = arrayMove(projects, oldIndex, newIndex);

      // Find affected sections
      let sourceSection = "";
      let destSection = "";

      for (let i = 0; i <= oldIndex; i++) {
        if (projects[i].isHeader) {
          sourceSection = projects[i].taskId + projects[i].detailTask;
        }
      }
      for (let i = 0; i <= newIndex; i++) {
        if (reorderedProjects[i].isHeader) {
          destSection = reorderedProjects[i].taskId + reorderedProjects[i].detailTask;
        }
      }

      // Auto-update taskId and rootTasks after dragging
      const updatedProjects = reindexDraggedTasks(reorderedProjects, sourceSection, destSection);

      setProjects(updatedProjects);
    }
  };

  // Cập nhật một trường của task (chỉ cập nhật UI, không ghi lên Sheet)
  const handleCellChange = (proj: ProjectItem, field: string, value: string) => {
    // Validation: Manday (Est) không được lớn hơn 7
    if (field === 'mandayEst') {
      const num = parseFloat(value);
      if (!isNaN(num) && num > 7) {
        alert("Manday (Est) không được lớn hơn 7!");
        return;
      }
    }

    // Validation: Assigned và Support không được giống nhau
    if (field === 'assigned' && value === proj.support && value !== "") {
      alert("Assigned và Support không được giống nhau!");
      return;
    }
    if (field === 'support' && value === proj.assigned && value !== "") {
      alert("Assigned và Support không được giống nhau!");
      return;
    }

    setProjects(prev => prev.map(p =>
      p.originalIndex === proj.originalIndex ? { ...p, [field]: value } : p
    ));
  };

  // Handler khi QuickAddRow lưu task mới (chèn ngay bên dưới task đang chọn)
  const handleQuickAddSave = useCallback((afterTask: ProjectItem, data: {
    detailTask: string; priority: string; mandayEst: string; assigned: string;
    support: string; status: string; startDateEst: string; skillSolution: string;
    skillVendor: string; ticketId: string;
  }) => {
    setProjects(prev => {
      const updated = [...prev];
      const targetIdx = updated.findIndex(p => p.originalIndex === afterTask.originalIndex);
      if (targetIdx === -1) return prev;

      // Kế thừa rootTasks từ majorTask header gần nhất phía trên
      let currentRootTask = "";
      for (let i = 0; i <= targetIdx; i++) {
        if (updated[i].isHeader && updated[i].headerType === 'majorTask') {
          currentRootTask = updated[i].taskId;
        }
      }

      const newTask: ProjectItem = {
        taskId: "",
        detailTask: data.detailTask,
        priority: data.priority,
        mandayEst: data.mandayEst,
        assigned: data.assigned,
        support: data.support,
        status: data.status,
        startDateEst: data.startDateEst,
        kpiRatio: "",
        skillSolution: data.skillSolution,
        skillVendor: data.skillVendor,
        ticketId: data.ticketId,
        remark: "", send: "", endDateEst: "", mandayActual: "",
        endDateActual: "", daysLate: "", kpiBase: "", kpiPerform: "",
        kpiOvertime: "", kpiFinal: "", subId: "",
        rootTasks: currentRootTask,
        notes: "", isHeader: false, headerType: null,
        originalIndex: Date.now(), // temp unique number
      };

      updated.splice(targetIdx + 1, 0, newTask);
      return reindexAllTasks(updated);
    });
    setQuickAddAfter(null);
    setHoveredTaskIndex(null);
  }, []);

  return (
    <>
      {activeTab !== 'Dashboard' && (
        <>
          {/* Row 1: 4 thẻ cũ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Total Tasks</p>
              <p className="text-4xl font-extrabold text-white mt-2">{kpiData.totalTasks}</p>
              <p className="text-[11px] text-zinc-400 mt-1">In <span className="text-blue-400">{activeTab}</span> tab</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">In Progress</p>
              <p className="text-4xl font-extrabold text-amber-400 mt-2">{kpiData.inProgressTasks}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Tasks currently active</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Completed</p>
              <p className="text-4xl font-extrabold text-emerald-400 mt-2">{kpiData.doneTasks}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Tasks marked as done</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">High Priority</p>
              <p className="text-4xl font-extrabold text-rose-400 mt-2">{kpiData.highPriorityTasks}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Tasks marked as high priority</p>
            </div>
          </div>
          {/* Row 2: 5 thẻ mới */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Overdue</p>
              <p className="text-4xl font-extrabold text-red-400 mt-2">{kpiData.overdueCount}</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Completion Rate</p>
              <p className="text-4xl font-extrabold text-emerald-400 mt-2">{kpiData.completionRate}%</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Total Mandays</p>
              <p className="text-4xl font-extrabold text-cyan-400 mt-2">{kpiData.totalMandays}</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Due This Week</p>
              <p className="text-4xl font-extrabold text-purple-400 mt-2">{kpiData.dueThisWeekCount}</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0c] rounded-2xl border border-zinc-800/80 p-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">On Track</p>
              <p className="text-4xl font-extrabold text-green-400 mt-2">{kpiData.onTrackRate}%</p>
            </div>
          </div>
        </>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={customCollisionDetection}>
        {/* Pill Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 p-1 bg-zinc-900/50 backdrop-blur-md rounded-xl border border-zinc-800/50 w-fit">
            {tabs.map((t) => (
              <DroppableTab key={t} id={t} activeTab={activeTab} onClick={() => setActiveTab(t)} />
            ))}
          </div>
        </div>

        {activeTab === 'Dashboard' ? (
          <MasterPlanView />
        ) : (
          <>
            <OverdueTasksWarning tasks={kpiData.overdueTasks} />
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
                  <div className="flex flex-col items-center justify-center min-h-[200px] text-zinc-400 gap-3 p-6">
                    {isError ? (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <svg className="w-7 h-7 text-rose-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                        </div>
                        <span className="text-sm font-semibold text-zinc-300">Chưa kết nối Google Sheet</span>
                        <span className="text-[11px] text-zinc-400 text-center max-w-[320px] leading-relaxed">
                          Tab <span className="text-blue-400 font-mono font-semibold">{activeTab}</span> chưa có dữ liệu.<br />
                          Share sheet cho <span className="text-zinc-300 font-mono text-[10px]">poptech-pm@poptech-pm.iam.gserviceaccount.com</span> rồi F5 lại.
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center">
                          <svg className="w-7 h-7 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className="text-sm font-semibold text-zinc-400">Tab <span className="text-blue-400">{activeTab}</span> chưa có task nào</span>
                        <span className="text-[11px] text-zinc-400">Bấm <span className="text-white font-semibold">+ Add Task</span> để thêm task đầu tiên</span>
                      </>
                    )}
                  </div>
                ) : (
                  <table className="min-w-full text-xs text-left whitespace-nowrap border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="text-zinc-400 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 backdrop-blur-md border-b border-blue-700/30 shadow-sm shadow-blue-900/10">
                        <th className="px-2 py-3 w-10 bg-zinc-500 border-r border-black/40"></th>{/* Drag Handle */}
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">TASK ID</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase min-w-[200px] bg-purple-500 text-black text-center border-r border-black/40">DETAIL TASK</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-purple-500 text-black text-center border-r border-black/40">PRIORITY</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-orange-500 text-black text-center border-r border-black/40">MANDAY EST</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-purple-500 text-black text-center border-r border-black/40">STATUS</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-purple-500 text-black text-center border-r border-black/40">START DATE</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-purple-500 text-black text-center border-r border-black/40">ASSIGNED</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-purple-500 text-black text-center border-r border-black/40">SUPPORT</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-purple-500 text-black text-center border-r border-black/40">KPI RATIO</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-purple-500 text-black text-center border-r border-black/40">SKILL SOLUTION</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-purple-500 text-black text-center border-r border-black/40">SKILL VENDOR</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-purple-500 text-black text-center border-r border-black/40">TICKET ID</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-amber-500 text-black text-center border-r border-black/40">REMARK</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-amber-500 text-black text-center border-r border-black/40">SEND</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">END DATE EST</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">MD ACTUAL</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">END ACTUAL</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">DAYS LATE</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">KPI BASE</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">KPI PERFORM</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">KPI OVERTIME</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">KPI FINAL</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">SUB ID</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-purple-500 text-black text-center border-r border-black/40">ROOT TASKS</th>
                        <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-white text-black text-center border-r border-black/40">NOTES</th>
                        {activeTab === 'Master Plan' ? (
                          <>
                            <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">WEEK EST</th>
                            <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">MONTH EST</th>
                            <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">WEEK ACTUAL</th>
                            <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">MONTH ACTUAL</th>
                          </>
                        ) : (
                          <th className="px-4 py-3 font-bold tracking-wider text-xs uppercase bg-zinc-500 text-black text-center border-r border-black/40">SOLUTIONS</th>
                        )}
                      </tr>
                    </thead>
                    <SortableContext items={projects.map(p => p.originalIndex)}>
                      <tbody className="divide-y divide-zinc-800/60">
                        {projects.map((p, idx) => (
                          <React.Fragment key={p.originalIndex}>
                            <SortableRow p={p}
                              onMouseEnter={() => { if (!p.isHeader) setHoveredTaskIndex(p.originalIndex); }}
                              onMouseLeave={() => setHoveredTaskIndex(null)}
                            >
                              {p.isHeader ? ( // Nếu là header, không render cột kéo thả và các cột con
                                <td colSpan={100} className={`px-4 py-2.5 font-bold text-black text-sm uppercase tracking-wider ${p.headerType === 'phase' || p.headerType === 'issue' ? 'bg-amber-400' : 'bg-emerald-400'}`}>
                                  {p.taskId} {p.detailTask.toUpperCase()}
                                </td>
                              ) : (
                                <>
                                  <td className={`px-4 py-2.5 font-mono text-[11px] text-zinc-400`}>
                                    <div className="flex items-center gap-2"><span>{p.taskId}</span></div>
                                  </td>
                                  <td className={`px-4 py-2.5 font-medium text-white`}>
                                    <input type="text" value={p.detailTask || ''} onChange={e => handleCellChange(p, 'detailTask', e.target.value)}
                                      className="w-full min-w-[200px] bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none" />
                                  </td>
                                  {/* Priority Dropdown */}
                                  <td className="px-4 py-2.5">
                                    <select
                                      value={p.priority || 'Normal'}
                                      onChange={e => handleCellChange(p, 'priority', e.target.value)}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border outline-none cursor-pointer appearance-none ${
                                        p.priority === 'High' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                        : p.priority === 'Critical' ? 'bg-red-500/15 text-red-300 border-red-500/30'
                                        : p.priority === 'Low' ? 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
                                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      }`}
                                    >
                                      <option value="Normal" className="bg-zinc-800 text-white">Normal</option>
                                      <option value="High" className="bg-zinc-800 text-white">High</option>
                                      <option value="Critical" className="bg-zinc-800 text-white">Critical</option>
                                      <option value="Low" className="bg-zinc-800 text-white">Low</option>
                                    </select>
                                  </td>
                                  <td className="px-2 py-1.5 text-emerald-200">
                                    <input
                                      type="text"
                                      value={p.mandayEst}
                                      onChange={e => handleCellChange(p, 'mandayEst', e.target.value)}
                                      className="w-16 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 text-[11px] text-emerald-200 outline-none"
                                    />
                                  </td>
                                  {/* Status Dropdown */}
                                  <td className="px-4 py-2.5 flex items-center h-full">
                                      <span className={`w-2 h-2 rounded-full flex-shrink-0 mr-1.5 ${
                                        p.status === 'Done' ? 'bg-emerald-400'
                                        : p.status === 'In Progress' ? 'bg-amber-400'
                                        : p.status === 'Blocked' ? 'bg-red-400'
                                        : 'bg-cyan-400'
                                      }`}></span>
                                      <select
                                        value={p.status || 'In Progress'}
                                        onChange={e => handleCellChange(p, 'status', e.target.value)}
                                        className={`bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none appearance-none cursor-pointer text-xs ${
                                          p.status === 'Done' ? 'text-emerald-200'
                                          : p.status === 'In Progress' ? 'text-amber-200'
                                          : p.status === 'Blocked' ? 'text-red-200'
                                          : 'text-cyan-200'
                                        }`}
                                      >
                                        <option value="In Progress" className="bg-zinc-800 text-white">In Progress</option>
                                        <option value="Done" className="bg-zinc-800 text-white">Done</option>
                                        <option value="Cancel" className="bg-zinc-800 text-white">Cancel</option>
                                        <option value="Waiting" className="bg-zinc-800 text-white">Waiting</option>
                                        <option value="Rework" className="bg-zinc-800 text-white">Rework</option>
                                        <option value="Blocked" className="bg-zinc-800 text-white">Blocked</option>
                                      </select>
                                  </td>
                                  <td className="px-2 py-1.5 font-mono text-[11px] text-zinc-400">
                                    <input type="text" value={p.startDateEst} onChange={e => handleCellChange(p, 'startDateEst', e.target.value)}
                                      className="w-24 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none" />
                                  </td>
                                  <td className="px-2 py-1.5 text-white">
                                    <select value={p.assigned} onChange={e => handleCellChange(p, 'assigned', e.target.value)}
                                      className="w-24 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 text-white outline-none appearance-none cursor-pointer">
                                      <option value="" className="bg-zinc-800 text-white">Select User</option>
                                      {usersList.map(u => (
                                        <option key={u} value={u} className="bg-zinc-800 text-white">{u}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-2 py-1.5 text-zinc-400">
                                    <select value={p.support} onChange={e => handleCellChange(p, 'support', e.target.value)}
                                      className="w-20 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none appearance-none cursor-pointer">
                                      <option value="" className="bg-zinc-800 text-white">Select User</option>
                                      {usersList.map(u => (
                                        <option key={u} value={u} className="bg-zinc-800 text-white">{u}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input type="text" value={p.kpiRatio || ''} onChange={e => handleCellChange(p, 'kpiRatio', e.target.value)}
                                      className="w-16 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none text-white" />
                                  </td>
                                  <td className="px-2 py-1.5 text-zinc-400">
                                    <select value={p.skillSolution || ''} onChange={e => {
                                        handleCellChange(p, 'skillSolution', e.target.value);
                                        handleCellChange(p, 'skillVendor', ''); // Reset vendor when solution changes
                                      }}
                                      className="w-24 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none appearance-none cursor-pointer text-[11px]"
                                    >
                                      <option value="" className="bg-zinc-800 text-white">Select</option>
                                      {vendorSolutions.map((solution, idx) => (
                                        <option key={idx} value={solution.name} className="bg-zinc-800 text-white">{solution.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-2 py-1.5 text-zinc-400">
                                    <select value={p.skillVendor || ''} onChange={e => handleCellChange(p, 'skillVendor', e.target.value)}
                                      className="w-24 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none appearance-none cursor-pointer text-[11px]"
                                    >
                                      <option value="" className="bg-zinc-800 text-white">Select</option>
                                      {(vendorSolutions.find(s => s.name === p.skillSolution)?.vendors || []).map((vendor, idx) => (
                                        <option key={idx} value={vendor} className="bg-zinc-800 text-white">{vendor}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input type="text" value={p.ticketId || ''} onChange={e => handleCellChange(p, 'ticketId', e.target.value)}
                                      className="w-20 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none text-white" />
                                  </td>
                                  <td className="px-2 py-1.5 text-zinc-400">
                                    <input type="text" value={p.remark || ''} onChange={e => handleCellChange(p, 'remark', e.target.value)}
                                      className="w-32 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none text-zinc-400" />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input type="text" value={p.send || ''} onChange={e => handleCellChange(p, 'send', e.target.value)}
                                      className="w-16 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none text-white" />
                                  </td>
                                  <td className="px-2 py-1.5 font-mono text-[11px] text-zinc-400">{p.endDateEst}</td>
                                  <td className="px-2 py-1.5 text-white">{p.mandayActual}</td>
                                  <td className="px-2 py-1.5 font-mono text-[11px] text-zinc-400">{p.endDateActual}</td>
                                  <td className="px-2 py-1.5">{p.daysLate}</td>
                                  <td className="px-2 py-1.5">{p.kpiBase}</td>
                                  <td className="px-2 py-1.5">{p.kpiPerform}</td>
                                  <td className="px-2 py-1.5">{p.kpiOvertime}</td>
                                  <td className="px-2 py-1.5">{p.kpiFinal}</td>
                                  <td className="px-2 py-1.5 text-zinc-400">{p.subId}</td>
                                  <td className="px-2 py-1.5 text-zinc-400">
                                    <input type="text" value={p.rootTasks || ''} onChange={e => handleCellChange(p, 'rootTasks', e.target.value)} className="w-24 bg-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none border border-transparent text-zinc-400" />
                                  </td>
                                  <td className="px-2 py-1.5 text-zinc-400">
                                    <input type="text" value={p.notes} onChange={e => handleCellChange(p, 'notes', e.target.value)}
                                      className="w-32 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none" />
                                  </td>
                                  {activeTab === 'Master Plan' ? (
                                    <>
                                      <td className="px-2 py-1.5 text-zinc-400">
                                        <input type="text" value={p.weekEst || ''} onChange={e => handleCellChange(p, 'weekEst', e.target.value)} className="w-16 bg-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none border border-transparent text-zinc-400" />
                                      </td>
                                      <td className="px-2 py-1.5 text-zinc-400">
                                        <input type="text" value={p.monthEst || ''} onChange={e => handleCellChange(p, 'monthEst', e.target.value)} className="w-16 bg-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none border border-transparent text-zinc-400" />
                                      </td>
                                      <td className="px-2 py-1.5 text-white">
                                        <input type="text" value={p.weekActual || ''} onChange={e => handleCellChange(p, 'weekActual', e.target.value)} className="w-16 bg-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none border border-transparent text-white" />
                                      </td>
                                      <td className="px-2 py-1.5 text-white">
                                        <input type="text" value={p.monthActual || ''} onChange={e => handleCellChange(p, 'monthActual', e.target.value)} className="w-16 bg-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none border border-transparent text-white" />
                                      </td>
                                    </>
                                  ) : (
                                    <td className="px-2 py-1.5 text-zinc-400">
                                      <input type="text" value={p.solutions || ''} onChange={e => handleCellChange(p, 'solutions', e.target.value)}
                                        className="w-32 bg-transparent border border-transparent hover:border-zinc-600 focus:border-blue-500 rounded px-1 py-0.5 outline-none" />
                                    </td>
                                  )}
                                </>
                              )}
                            </SortableRow>

                            {/* Notion-style hover trigger: "+ Add task below" */}
                            {!p.isHeader && quickAddAfter !== p.originalIndex && hoveredTaskIndex === p.originalIndex && (
                              <tr
                                className="bg-blue-950/10 cursor-pointer"
                                onMouseEnter={() => setHoveredTaskIndex(p.originalIndex)}
                                onMouseLeave={() => setHoveredTaskIndex(null)}
                                onClick={() => setQuickAddAfter(p.originalIndex)}
                              >
                                <td colSpan={100} className="px-6 py-1">
                                  <span className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-blue-400 transition-colors select-none">
                                    <span className="font-bold">+</span> Add task below
                                  </span>
                                </td>
                              </tr>
                            )}

                            {/* Inline Quick Add Form */}
                            {!p.isHeader && quickAddAfter === p.originalIndex && (
                              <QuickAddRow
                                usersList={usersList}
                                onSave={(data) => handleQuickAddSave(p, data)}
                                onCancel={() => { setQuickAddAfter(null); setHoveredTaskIndex(null); }}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </DndContext>

      {/* Component cho một dòng task, hỗ trợ kéo thả */}
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
        parentTasks={projects.filter(p => p.isHeader && p.headerType === 'majorTask').map(p => p.taskId)}
        usersList={usersList}
        onAddLocal={(newTask) => {
          setProjects(prev => {
            let updatedProjects = [...prev];
            let insertIndex = -1;
            const selectedParentId = newTask.rootTask; // Đây chính là ID của Task lớn (ví dụ: "I.", "II.")

            if (selectedParentId && selectedParentId.trim() !== "") {
              // === TRƯỜNG HỢP 1: CÓ CHỌN TASK LỚN CỤ THỂ ===
              // Tìm vị trí của Task lớn có taskId khớp với lựa chọn
              const parentIndex = updatedProjects.findIndex(
                p => p.isHeader && p.taskId === selectedParentId
              );

              if (parentIndex !== -1) {
                // Duyệt xuống dưới để tìm điểm kết thúc của nhóm Task lớn này
                // (Dừng lại ngay trước khi gặp một Task lớn tiếp theo hoặc hết mảng)
                insertIndex = parentIndex + 1;
                while (
                  insertIndex < updatedProjects.length &&
                  !updatedProjects[insertIndex].isHeader
                ) {
                  insertIndex++;
                }
              }
            }

            if (insertIndex === -1) {
              // === TRƯỜNG HỢP 2: KHÔNG CHỌN TASK LỚN (Tự động gán) ===
              // Tìm tất cả các index của task lớn (header)
              const headerIndices = updatedProjects
                .map((p, idx) => p.isHeader ? idx : -1)
                .filter(idx => idx !== -1);

              if (headerIndices.length >= 2) {
                // Vị trí chèn là ngay trước mục lớn cuối cùng (tức là ở cuối của mục áp chót)
                insertIndex = headerIndices[headerIndices.length - 1];
              } else {
                // Nếu ít hơn 2 mục lớn, chèn vào cuối bảng
                insertIndex = updatedProjects.length;
              }
            }

            // Gán giá trị rootTasks của item mới bằng ID nhóm cha để đồng bộ DB
            // Tìm rootTask hiện tại tại vị trí chèn
            let currentRootTask = "";
            for (let i = 0; i < insertIndex; i++) {
              if (updatedProjects[i].isHeader && updatedProjects[i].headerType === 'majorTask') {
                currentRootTask = updatedProjects[i].taskId;
              }
            }

            const finalNewTask = {
              ...newTask,
              rootTasks: currentRootTask || newTask.rootTask
            };

            // Tiến hành chèn Task mới vào vị trí chính xác
            updatedProjects.splice(insertIndex, 0, finalNewTask);

            // === TỰ ĐỘNG ĐÁNH LẠI SỐ TASK ID CON CHO ĐỒNG BỘ ===
            return reindexAllTasks(updatedProjects);
          });
        }}
      />
    </>
  );
}


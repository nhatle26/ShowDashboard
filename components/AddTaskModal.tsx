"use client";

import React, { useState } from "react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    parentTasks: string[];
    usersList: string[];
    onAddLocal?: (task: any) => void;
};

export default function AddTaskModal({ isOpen, onClose, activeTab, parentTasks, usersList, onAddLocal }: Props) {
    const [rootTask, setRootTask] = useState("");
    const [detailTask, setDetailTask] = useState(""); // Thêm state cho detail task
    const [priority, setPriority] = useState("Normal"); // Thêm state cho priority
    const [mandayEst, setMandayEst] = useState(""); // Thêm state cho manday
    const [assigned, setAssigned] = useState(""); // Thêm state cho assigned
    const [support, setSupport] = useState("");
    const [status, setStatus] = useState("In Progress");
    const [startDateEst, setStartDateEst] = useState("");
    const [kpiRatio, setKpiRatio] = useState("");
    const [skillSolution, setSkillSolution] = useState("");
    const [skillVendor, setSkillVendor] = useState("");
    const [ticketId, setTicketId] = useState("");

    const [vendorSolutions, setVendorSolutions] = useState<{ name: string, vendors: string[] }[]>([]);
    const [availableVendors, setAvailableVendors] = useState<string[]>([]);

    React.useEffect(() => {
        if (isOpen) {
            fetch("/api/vendors")
                .then(res => res.json())
                .then(data => {
                    if (data.solutions) {
                        setVendorSolutions(data.solutions);
                    }
                })
                .catch(err => console.error("Error fetching vendors:", err));
        }
    }, [isOpen]);

    const handleSkillSolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedSolution = e.target.value;
        setSkillSolution(selectedSolution);
        const solution = vendorSolutions.find(s => s.name === selectedSolution);
        setAvailableVendors(solution ? solution.vendors : []);
        setSkillVendor("");
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (onAddLocal) {
            onAddLocal({
                taskId: "",
                rootTask,
                detailTask,
                priority,
                mandayEst,
                assigned,
                support,
                status,
                startDateEst,
                kpiRatio,
                skillSolution,
                skillVendor,
                ticketId,
                isHeader: false,
                originalIndex: `temp-${Date.now()}`
            });
        }

        onClose();
        // Reset form
        setRootTask("");
        setDetailTask("");
        setPriority("Normal");
        setMandayEst("");
        setAssigned("");
        setSupport("");
        setStatus("In Progress");
        setStartDateEst("");
        setKpiRatio("");
        setSkillSolution("");
        setSkillVendor("");
        setTicketId("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-[#0b0b0d] rounded-lg p-6 w-full max-w-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h3 className="text-lg font-semibold text-white mb-4">Thêm Task vào tab: {activeTab}</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Các trường nhập liệu */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Task lớn</label>
                            <select
                                value={rootTask}
                                onChange={e => setRootTask(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">-- Tự động gán --</option>
                                {Array.from(new Set(parentTasks)).map((task, idx) => (
                                    <option key={`${task}-${idx}`} value={task}>{task}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs text-zinc-400 mb-1">Chi tiết Task</label>
                            <input
                                required
                                value={detailTask}
                                onChange={e => setDetailTask(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="Mẫu: [Action Verb] + [Object] + [Scope/Location/Module]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Độ ưu tiên</label>
                            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none">
                                <option value="Normal">Normal</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                                <option value="Interrupt">Interrupt</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Manday (Est)</label>
                            <input
                                value={mandayEst}
                                onChange={e => setMandayEst(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="vd: 0.5, 1, 2..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Người thực hiện</label>
                            <select
                                value={assigned}
                                onChange={e => setAssigned(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">-- Chọn --</option>
                                {usersList.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Hỗ trợ</label>
                            <select
                                value={support}
                                onChange={e => setSupport(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">-- Chọn --</option>
                                {usersList.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Trạng thái</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none">
                                <option value="In Progress">Progress</option>
                                <option value="Done">Done</option>
                                <option value="Cancel">Cancel</option>
                                <option value="Waiting">Waiting</option>
                                <option value="Rework">Rework</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Ngày bắt đầu (Est)</label>
                            <input
                                type="date"
                                value={startDateEst}
                                onChange={e => setStartDateEst(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">KPI Ratio</label>
                            <input
                                value={kpiRatio}
                                onChange={e => setKpiRatio(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="vd: 1.0, 1.5"
                            />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Skill Solution</label>
                                <select
                                    value={skillSolution}
                                    onChange={handleSkillSolutionChange}
                                    className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">-- Chọn --</option>
                                    {vendorSolutions.map((solution, idx) => (
                                        <option key={idx} value={solution.name}>{solution.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Skill Vendor</label>
                                <select
                                    value={skillVendor}
                                    onChange={e => setSkillVendor(e.target.value)}
                                    className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">-- Chọn --</option>
                                    {availableVendors.map((vendor, idx) => (
                                        <option key={idx} value={vendor}>{vendor}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs text-zinc-400 mb-1">Ticket ID</label>
                            <input
                                value={ticketId}
                                onChange={e => setTicketId(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm text-white rounded transition-colors">
                            Hủy bỏ
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white rounded transition-colors flex items-center gap-2">
                            Thêm Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

"use client";

import React, { useState } from "react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    parentTasks: string[];
    assignees: string[];
    supporters: string[];
    onSuccess?: () => void;
};

export default function AddTaskModal({ isOpen, onClose, activeTab, parentTasks, assignees, supporters, onSuccess }: Props) {
    const [rootTask, setRootTask] = useState("");
    const [detailTask, setDetailTask] = useState(""); // Thêm state cho detail task
    const [priority, setPriority] = useState("Normal"); // Thêm state cho priority
    const [mandayEst, setMandayEst] = useState(""); // Thêm state cho manday
    const [assigned, setAssigned] = useState(""); // Thêm state cho assigned
    const [support, setSupport] = useState("");
    const [status, setStatus] = useState("In Progress");
    const [startDateEst, setStartDateEst] = useState("");
    const [skillSolution, setSkillSolution] = useState("");
    const [skillVendor, setSkillVendor] = useState("");
    const [ticketId, setTicketId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tab: activeTab,
                    rootTask,
                    detailTask,
                    priority,
                    mandayEst,
                    assigned,
                    support,
                    status,
                    startDateEst,
                    skillSolution,
                    skillVendor,
                    ticketId,
                })
            });
            if (!res.ok) {
                throw new Error("Failed to add task");
            }
            if (onSuccess) onSuccess();
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
            setSkillSolution("");
            setSkillVendor("");
            setTicketId("");
        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra khi thêm task!");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={!isSubmitting ? onClose : undefined} />
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
                                {parentTasks.map(task => (
                                    <option key={task} value={task}>{task}</option>
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
                                placeholder="Nội dung công việc cần thực hiện..."
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
                        <div className="md:col-span-2">
                            <label className="block text-xs text-zinc-400 mb-1">Người thực hiện</label>
                            <input
                                value={assigned}
                                onChange={e => setAssigned(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="Tên người được giao"
                            />
                        </div>
                        {assignees.length > 0 && !isSubmitting && (
                            <div className="flex flex-wrap gap-1.5">
                                {assignees.map(name => (
                                    <button type="button" key={name} onClick={() => setAssigned(name)} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] rounded hover:bg-zinc-700 hover:text-white transition-colors">
                                        {name}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="block text-xs text-zinc-400 mb-1">Hỗ trợ</label>
                            <input
                                value={support}
                                onChange={e => setSupport(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        {supporters.length > 0 && !isSubmitting && (
                            <div className="flex flex-wrap gap-1.5">
                                {supporters.map(name => (
                                    <button type="button" key={name} onClick={() => setSupport(name)} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] rounded hover:bg-zinc-700 hover:text-white transition-colors">
                                        {name}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Trạng thái</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none">
                                <option value="In Progress">In Progress</option>
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
                            <label className="block text-xs text-zinc-400 mb-1">Skill Solution</label>
                            <input
                                value={skillSolution}
                                onChange={e => setSkillSolution(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Skill Vendor</label>
                            <input
                                value={skillVendor}
                                onChange={e => setSkillVendor(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                            />
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
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm text-white rounded transition-colors disabled:opacity-50">
                            Hủy bỏ
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white rounded transition-colors flex items-center gap-2 disabled:opacity-50">
                            {isSubmitting ? "Đang thêm..." : "Thêm Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

"use client";

import React, { useState } from "react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    onSuccess?: () => void;
};

export default function AddTaskModal({ isOpen, onClose, activeTab, onSuccess }: Props) {
    const [rootTask, setRootTask] = useState("");
    const [detailTask, setDetailTask] = useState("");
    const [progress, setProgress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tab: activeTab, rootTask, detailTask, progress })
            });
            if (!res.ok) {
                throw new Error("Failed to add task");
            }
            if (onSuccess) onSuccess();
            onClose();
            // Reset form
            setRootTask("");
            setDetailTask("");
            setProgress("");
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
            <div className="relative bg-[#0b0b0d] rounded-lg p-6 w-full max-w-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-white mb-4">Thêm Task - {activeTab}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Các trường nhập liệu */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Task lớn (Root Task)</label>
                            <input
                                required
                                value={rootTask}
                                onChange={e => setRootTask(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="Nhập tên task lớn..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Task nhỏ (Detail Task)</label>
                            <input
                                required
                                value={detailTask}
                                onChange={e => setDetailTask(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="Nhập tên task nhỏ..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Tiến độ (Status)</label>
                            <select
                                required
                                value={progress}
                                onChange={e => setProgress(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">Chọn tiến độ...</option>
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Review">Review</option>
                                <option value="Done">Done</option>
                            </select>
                        </div>
                    </div>

                    {/* Các trường màu xám (chỉ đọc / công thức) */}
                    <div className="mt-6 pt-4 border-t border-zinc-800">
                        <h4 className="text-xs font-semibold text-zinc-400 mb-3">Các trường tự động tính toán (Chỉ đọc)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[10px] text-zinc-500 mb-1">TASK ID</label>
                                <input disabled value="Auto-generated" className="w-full p-1.5 rounded bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-xs cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-zinc-500 mb-1">DAYS LATE</label>
                                <input disabled value="Formula" className="w-full p-1.5 rounded bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-xs cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-zinc-500 mb-1">KPI BASE</label>
                                <input disabled value="Formula" className="w-full p-1.5 rounded bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-xs cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-zinc-500 mb-1">KPI PERFORM</label>
                                <input disabled value="Formula" className="w-full p-1.5 rounded bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-xs cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-zinc-500 mb-1">KPI OVERTIME</label>
                                <input disabled value="Formula" className="w-full p-1.5 rounded bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-xs cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-zinc-500 mb-1">KPI FINAL</label>
                                <input disabled value="Formula" className="w-full p-1.5 rounded bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-xs cursor-not-allowed" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-2">
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

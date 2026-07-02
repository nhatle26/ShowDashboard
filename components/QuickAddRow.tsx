"use client";

import React, { useState, useEffect, useRef } from "react";

interface QuickAddRowProps {
    usersList: string[];
    onSave: (data: {
        detailTask: string;
        priority: string;
        mandayEst: string;
        assigned: string;
        support: string;
        status: string;
        startDateEst: string;
        skillSolution: string;
        skillVendor: string;
        ticketId: string;
    }) => void;
    onCancel: () => void;
}

export default function QuickAddRow({ usersList, onSave, onCancel }: QuickAddRowProps) {
    const [detailTask, setDetailTask] = useState("");
    const [priority, setPriority] = useState("Normal");
    const [mandayEst, setMandayEst] = useState("");
    const [assigned, setAssigned] = useState("");
    const [support, setSupport] = useState("");
    const [status, setStatus] = useState("In Progress");
    const [startDateEst, setStartDateEst] = useState("");
    const [skillSolution, setSkillSolution] = useState("");
    const [skillVendor, setSkillVendor] = useState("");
    const [ticketId, setTicketId] = useState("");

    const [vendorSolutions, setVendorSolutions] = useState<{ name: string, vendors: string[] }[]>([]);
    const [availableVendors, setAvailableVendors] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus detail task input when form opens, and fetch vendors
    useEffect(() => {
        inputRef.current?.focus();
        fetch("/api/vendors")
            .then(res => res.json())
            .then(data => {
                if (data.solutions) {
                    setVendorSolutions(data.solutions);
                }
            })
            .catch(err => console.error("Error fetching vendors:", err));
    }, []);

    const handleSkillSolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedSolution = e.target.value;
        setSkillSolution(selectedSolution);
        const solution = vendorSolutions.find(s => s.name === selectedSolution);
        setAvailableVendors(solution ? solution.vendors : []);
        setSkillVendor("");
    };

    const handleSave = () => {
        if (!detailTask.trim()) {
            inputRef.current?.focus();
            return;
        }
        onSave({
            detailTask: detailTask.trim(),
            priority,
            mandayEst,
            assigned,
            support,
            status,
            startDateEst,
            skillSolution,
            skillVendor,
            ticketId
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") { e.preventDefault(); handleSave(); }
        if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    };

    return (
        <tr className="border-t border-b border-blue-500/40 bg-[#071525]">
            <td colSpan={100} className="px-4 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Detail Task — chiếm phần lớn không gian */}
                    <input
                        ref={inputRef}
                        value={detailTask}
                        onChange={e => setDetailTask(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Chi tiết task... (ESC để hủy và ENTER để lưu)"
                        className="w-80 bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-md px-3 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 transition-colors"
                    />

                    {/* Priority */}
                    <select
                        value={priority}
                        onChange={e => setPriority(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-md px-2 py-1.5 text-sm text-white outline-none cursor-pointer transition-colors"
                    >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                        <option value="Interrupt">Interrupt</option>
                    </select>

                    {/* Manday Est */}
                    <input
                        value={mandayEst}
                        onChange={e => setMandayEst(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Manday"
                        className="w-20 bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-md px-2 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 transition-colors"
                    />

                    {/* Assigned */}
                    <select
                        value={assigned}
                        onChange={e => setAssigned(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-md px-2 py-1.5 text-sm text-white outline-none cursor-pointer transition-colors"
                    >
                        <option value="">— Assigned —</option>
                        {usersList.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>

                    {/* Support */}
                    <select
                        value={support}
                        onChange={e => setSupport(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-md px-2 py-1.5 text-sm text-white outline-none cursor-pointer transition-colors"
                    >
                        <option value="">— Support —</option>
                        {usersList.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>

                    {/* Status */}
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-md px-2 py-1.5 text-sm text-white outline-none cursor-pointer transition-colors"
                    >
                        <option value="In Progress">Progress</option>
                        <option value="Done">Done</option>
                        <option value="Cancel">Cancel</option>
                        <option value="Waiting">Waiting</option>
                        <option value="Rework">Rework</option>
                    </select>

                    {/* Start Date */}
                    <input
                        type="date"
                        value={startDateEst}
                        onChange={e => setStartDateEst(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-md px-2 py-1.5 text-sm text-white outline-none transition-colors"
                    />

                    {/* Skill Solution */}
                    <select
                        value={skillSolution}
                        onChange={handleSkillSolutionChange}
                        onKeyDown={handleKeyDown}
                        className="bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-md px-2 py-1.5 text-sm text-white outline-none cursor-pointer transition-colors"
                    >
                        <option value="">— Skill Sol. —</option>
                        {vendorSolutions.map((solution, idx) => (
                            <option key={idx} value={solution.name}>{solution.name}</option>
                        ))}
                    </select>

                    {/* Skill Vendor */}
                    <select
                        value={skillVendor}
                        onChange={e => setSkillVendor(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-md px-2 py-1.5 text-sm text-white outline-none cursor-pointer transition-colors"
                    >
                        <option value="">— Vendor —</option>
                        {availableVendors.map((vendor, idx) => (
                            <option key={idx} value={vendor}>{vendor}</option>
                        ))}
                    </select>

                    {/* Ticket ID */}
                    <input
                        value={ticketId}
                        onChange={e => setTicketId(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ticket ID"
                        className="w-24 bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded-md px-2 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 transition-colors"
                    />

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-auto">
                        <button
                            onClick={handleSave}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
                        >
                            Lưu
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-md transition-colors"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}

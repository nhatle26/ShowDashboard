"use client";

import { AlertTriangle } from "lucide-react";
import React from "react";

interface OverdueTasksWarningProps {
    tasks: any[];
}

const calculateDaysLate = (dateStr: string) => {
    try {
        const endDate = new Date(dateStr);
        const now = new Date();
        if (endDate >= now) return 0;
        const diffTime = Math.abs(now.getTime() - endDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
        return 0;
    }
};

export default function OverdueTasksWarning({ tasks }: OverdueTasksWarningProps) {
    if (tasks.length === 0) return null;

    return (
        <div className="bg-rose-900/30 border border-rose-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h4 className="font-bold text-rose-300">{tasks.length} Task{tasks.length > 1 ? 's' : ''} Overdue</h4>
            </div>
            <ul className="space-y-1 text-xs text-rose-300/80 list-disc list-inside">
                {tasks.map(task => <li key={task.taskId}>{task.detailTask} - <span className="font-semibold">{calculateDaysLate(task.endDateEst)} days late</span></li>)}
            </ul>
        </div>
    );
}
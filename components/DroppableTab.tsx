"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DroppableTabProps {
  id: string;
  activeTab: string;
  onClick: () => void;
}

export default function DroppableTab({
  id,
  activeTab,
  onClick,
}: DroppableTabProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tab-${id}`,
  });

  const isMasterPlan = id === "__masterplan__";
  const label = isMasterPlan ? "Master Plan" : id;
  const isActive = activeTab === id;

  const baseClasses =
    "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300";
  const activeClasses =
    "bg-gradient-to-b from-zinc-700 to-zinc-800 text-white shadow-md border border-zinc-600/50";
  const inactiveClasses =
    "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent";
  const overClasses = isOver
    ? "outline-2 outline-dashed outline-blue-500 scale-105"
    : "";

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses
        } ${overClasses}`}
    >
      {label}
    </button>
  );
}

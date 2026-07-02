"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ProjectItem } from "@/types/project";

interface SortableRowProps {
  p: ProjectItem;
  children: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function SortableRow({ p, children, onMouseEnter, onMouseLeave }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.originalIndex, data: { task: p } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: "relative" as "relative",
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`transition-colors duration-150 border-b border-zinc-800/30 ${p.isHeader ? "" : "hover:bg-zinc-800/40"
        }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {!p.isHeader && (
        <td className="px-2 py-2.5 text-zinc-400 cursor-grab" {...listeners}>
          <GripVertical size={14} />
        </td>
      )}
      {children}
    </tr>
  );
}

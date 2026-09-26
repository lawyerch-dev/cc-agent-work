import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableTeamItemProps {
  id: string;
  children: ReactNode;
  /** Disable dragging (e.g. while batch-selecting). */
  disabled?: boolean;
}

/** Grid cell wrapper that makes a team card draggable. */
export default function SortableTeamItem({
  id,
  children,
  disabled = false,
}: SortableTeamItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

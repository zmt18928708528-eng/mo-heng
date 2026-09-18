import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardFace } from "./card-face";
import type { KanbanCard } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";

type SortableCardProps = {
  card: KanbanCard;
  onEdit: () => void;
  onDelete: () => void;
};

export function SortableCard({ card, onEdit, onDelete }: SortableCardProps) {
  const origin = useRef({ x: 0, y: 0 });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card" as const },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
      className={cn("touch-none cursor-grab", isDragging && "cursor-grabbing")}
      {...attributes}
      {...listeners}
      onPointerDown={(event) => {
        origin.current = { x: event.clientX, y: event.clientY };
        listeners?.onPointerDown?.(event);
      }}
      onClick={(event) => {
        const dx = Math.abs(event.clientX - origin.current.x);
        const dy = Math.abs(event.clientY - origin.current.y);
        if (dx > 6 || dy > 6) return;
        onEdit();
      }}
    >
      <CardFace
        title={card.title}
        description={card.description}
        dueAt={card.dueAt}
        onDelete={onDelete}
      />
    </div>
  );
}

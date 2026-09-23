import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLUMN_META, type ColumnId, type KanbanCard } from "@/lib/kanban/types";
import { CardFace } from "./card-face";
import { SortableCard } from "./sortable-card";

type ColumnProps = {
  columnId: ColumnId;
  cards: KanbanCard[];
  interactive: boolean;
  onAdd: () => void;
  onEdit: (cardId: string) => void;
  onDelete: (cardId: string) => void;
};

function EmptyHint() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-line px-4 py-10 text-center text-sm text-faint">
      将卡片拖到这里，或点击上方加号
    </div>
  );
}

function StaticColumnList({
  cards,
  onEdit,
  onDelete,
}: {
  cards: KanbanCard[];
  onEdit: (cardId: string) => void;
  onDelete: (cardId: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto">
      {cards.map((card) => (
        <div
          key={card.id}
          className="cursor-pointer"
          onClick={() => onEdit(card.id)}
        >
          <CardFace
            title={card.title}
            description={card.description}
            dueAt={card.dueAt}
            onDelete={() => onDelete(card.id)}
          />
        </div>
      ))}
      {cards.length === 0 ? <EmptyHint /> : null}
    </div>
  );
}

function SortableColumnList({
  columnId,
  cards,
  onEdit,
  onDelete,
}: {
  columnId: ColumnId;
  cards: KanbanCard[];
  onEdit: (cardId: string) => void;
  onDelete: (cardId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: { type: "column" as const },
  });

  return (
    <SortableContext
      id={columnId}
      items={cards.map((card) => card.id)}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2.5 overflow-y-auto transition-[box-shadow] duration-(--motion-fast) ease-(--ease-smooth-out)",
          isOver && "shadow-lift rounded-md",
        )}
      >
        {cards.map((card) => (
          <SortableCard
            key={card.id}
            card={card}
            onEdit={() => onEdit(card.id)}
            onDelete={() => onDelete(card.id)}
          />
        ))}
        {cards.length === 0 ? <EmptyHint /> : null}
      </div>
    </SortableContext>
  );
}

export function Column({
  columnId,
  cards,
  interactive,
  onAdd,
  onEdit,
  onDelete,
}: ColumnProps) {
  const meta = COLUMN_META[columnId];

  return (
    <section
      className={cn(
        "flex min-h-96 w-[calc(100vw-3rem)] shrink-0 flex-col rounded-lg bg-panel p-3 snap-start",
        "md:min-h-0 md:w-auto md:min-w-0 md:flex-1 md:snap-align-none",
      )}
    >
      <header className="flex items-center gap-2 px-1 pb-3 pt-1">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            meta.tone === "accent" && "bg-accent",
            meta.tone === "done" && "bg-done",
            meta.tone === "muted" && "bg-muted",
            meta.tone === "plan" && "bg-danger",
          )}
          aria-hidden="true"
        />
        <h2 className="font-display text-lg font-medium tracking-tight text-ink">
          {meta.title}
        </h2>
        <span
          className="ml-auto inline-flex min-w-7 items-center justify-center rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium tabular-nums text-muted"
          aria-label={`${cards.length} 张卡片`}
        >
          {cards.length}
        </span>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`在${meta.title}添加卡片`}
          className="inline-flex size-9 items-center justify-center rounded-sm text-muted transition-[background-color,color,transform] duration-(--motion-quick) ease-(--ease-out) hover:bg-ink/5 hover:text-ink active:scale-96 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Plus className="size-4" />
        </button>
      </header>

      {interactive ? (
        <SortableColumnList
          columnId={columnId}
          cards={cards}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <StaticColumnList cards={cards} onEdit={onEdit} onDelete={onDelete} />
      )}
    </section>
  );
}

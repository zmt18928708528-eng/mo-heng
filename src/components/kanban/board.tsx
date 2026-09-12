import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { LayoutGrid } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { COLUMN_IDS, isColumnId, type ColumnId, type KanbanCard } from "@/lib/kanban/types";
import { findColumn, useKanbanStore } from "@/lib/kanban/store";
import { CardFace } from "./card-face";
import { CardDialog, type CardEditor } from "./card-dialog";
import { Column } from "./column";

const dropAnimation: DropAnimation = {
  duration: 250,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0" } },
  }),
};

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return closestCorners(args);
};

function BoardColumns({
  interactive,
  cards,
  columns,
  onAdd,
  onEdit,
  onDelete,
}: {
  interactive: boolean;
  cards: Record<string, KanbanCard>;
  columns: Record<ColumnId, string[]>;
  onAdd: (columnId: ColumnId) => void;
  onEdit: (cardId: string) => void;
  onDelete: (cardId: string) => void;
}) {
  function cardsIn(columnId: ColumnId): KanbanCard[] {
    return columns[columnId]
      .map((id) => cards[id])
      .filter((card): card is KanbanCard => Boolean(card));
  }

  return (
    <div className="flex flex-1 gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:snap-none">
      {COLUMN_IDS.map((columnId) => (
        <Column
          key={columnId}
          columnId={columnId}
          cards={cardsIn(columnId)}
          interactive={interactive}
          onAdd={() => onAdd(columnId)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export function Board() {
  const cards = useKanbanStore((s) => s.cards);
  const columns = useKanbanStore((s) => s.columns);
  const addCard = useKanbanStore((s) => s.addCard);
  const updateCard = useKanbanStore((s) => s.updateCard);
  const deleteCard = useKanbanStore((s) => s.deleteCard);
  const moveCard = useKanbanStore((s) => s.moveCard);

  const [interactive, setInteractive] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editor, setEditor] = useState<CardEditor>({ mode: "closed" });
  const [pendingDelete, setPendingDelete] = useState<KanbanCard | null>(null);
  const movedToNewColumn = useRef(false);

  useEffect(() => {
    void useKanbanStore.persist.rehydrate();
    setInteractive(true);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      movedToNewColumn.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [columns]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const total = useMemo(
    () => COLUMN_IDS.reduce((sum, id) => sum + columns[id].length, 0),
    [columns],
  );

  const activeCard = activeId ? cards[activeId] : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || movedToNewColumn.current) return;
    const activeCardId = String(active.id);
    const overId = String(over.id);
    if (activeCardId === overId) return;

    const currentColumns = useKanbanStore.getState().columns;
    const fromCol = findColumn(currentColumns, activeCardId);
    const overType = over.data.current?.type;
    const toCol =
      overType === "column" && isColumnId(overId)
        ? overId
        : findColumn(currentColumns, overId);
    if (!fromCol || !toCol || fromCol === toCol) return;
    movedToNewColumn.current = true;
    moveCard(activeCardId, overId);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    movedToNewColumn.current = false;
    if (!over) return;
    const activeCardId = String(active.id);
    const overId = String(over.id);
    if (activeCardId === overId) return;
    moveCard(activeCardId, overId);
  }

  function handleSave(title: string, description: string) {
    if (editor.mode === "create") {
      addCard(editor.columnId, title, description);
    } else if (editor.mode === "edit") {
      updateCard(editor.card.id, title, description);
    }
    setEditor({ mode: "closed" });
  }

  function handleAdd(columnId: ColumnId) {
    setEditor({ mode: "create", columnId });
  }

  function handleEdit(cardId: string) {
    const card = cards[cardId];
    if (card) setEditor({ mode: "edit", card });
  }

  function handleDelete(cardId: string) {
    const card = cards[cardId];
    if (card) setPendingDelete(card);
  }

  const columnProps = {
    cards,
    columns,
    onAdd: handleAdd,
    onEdit: handleEdit,
    onDelete: handleDelete,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-end justify-between gap-4 px-4 pb-5 pt-8 sm:px-6 sm:pt-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-muted">
            <LayoutGrid className="size-4" aria-hidden="true" />
            <span className="text-xs font-medium tracking-widest">看板</span>
          </div>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            墨衡
          </h1>
          <p className="mt-1.5 max-w-md text-sm leading-normal text-muted">
            待办、进行中、已完成。拖动卡片换列，点击卡片编辑。
          </p>
        </div>
        <p className="shrink-0 pb-1 text-sm tabular-nums text-muted">
          <span className="font-medium text-ink">{total}</span> 张卡片
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-8 sm:px-6">
        {interactive ? (
          <DndContext
            id="mo-heng-board"
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <BoardColumns interactive {...columnProps} />
            <DragOverlay dropAnimation={dropAnimation}>
              {activeCard ? (
                <div className="rotate-1">
                  <CardFace
                    title={activeCard.title}
                    description={activeCard.description}
                    overlay
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <BoardColumns interactive={false} {...columnProps} />
        )}
      </main>

      <CardDialog
        editor={editor}
        onClose={() => setEditor({ mode: "closed" })}
        onSave={handleSave}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这张卡片？</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `「${pendingDelete.title}」将被永久移除，无法恢复。`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteCard(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

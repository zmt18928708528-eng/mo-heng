import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildMonthCells,
  formatDayLabel,
  formatMonthTitle,
  sameDay,
  startOfDay,
  toDayKey,
} from "@/lib/kanban/dates";
import { COLUMN_META, type ColumnId, type KanbanCard } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

type CalendarPanelProps = {
  month: Date;
  selected: Date;
  cards: KanbanCard[];
  columnOf: (cardId: string) => ColumnId | null;
  onMonthChange: (month: Date) => void;
  onSelect: (day: Date) => void;
  onOpenCard: (cardId: string) => void;
  onAddForDay: (day: Date) => void;
};

export function CalendarPanel({
  month,
  selected,
  cards,
  columnOf,
  onMonthChange,
  onSelect,
  onOpenCard,
  onAddForDay,
}: CalendarPanelProps) {
  const today = startOfDay(new Date());
  const cells = buildMonthCells(month);
  const cardsByDay = useMemo(() => {
    const grouped = new Map<string, KanbanCard[]>();
    for (const card of cards) {
      if (card.dueAt == null || !Number.isFinite(card.dueAt)) continue;
      const key = toDayKey(card.dueAt);
      const day = grouped.get(key);
      if (day) day.push(card);
      else grouped.set(key, [card]);
    }
    return grouped;
  }, [cards]);
  const dayCards = cardsByDay.get(toDayKey(selected)) ?? [];

  function shiftMonth(delta: number) {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  return (
    <section className="mb-4 rounded-lg bg-panel p-3 sm:p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-lg font-medium tracking-tight text-ink">日历</h2>
            <p className="text-sm text-muted">{formatMonthTitle(month)}</p>
            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="上一个月"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
                  onSelect(today);
                }}
              >
                今天
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="下一个月"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-faint">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const inMonth = cell.getMonth() === month.getMonth();
              const isToday = sameDay(cell, today);
              const isSelected = sameDay(cell, selected);
              const count = cardsByDay.get(toDayKey(cell))?.length ?? 0;
              return (
                <button
                  key={cell.toISOString()}
                  type="button"
                  onClick={() => onSelect(cell)}
                  aria-label={`${toDayKey(cell)}，${count} 张卡片`}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  className={cn(
                    "flex h-11 flex-col items-center justify-center rounded-sm text-sm transition-[background-color,color] duration-(--motion-quick) ease-(--ease-out)",
                    inMonth ? "text-ink" : "text-faint",
                    isSelected && "bg-accent text-accent-fg",
                    !isSelected && isToday && "ring-1 ring-accent/40",
                    !isSelected && "hover:bg-ink/5",
                  )}
                >
                  <span className="leading-none">{cell.getDate()}</span>
                  {count > 0 ? (
                    <span
                      className={cn(
                        "mt-1 size-1 rounded-full",
                        isSelected ? "bg-accent-fg" : "bg-accent",
                      )}
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="mt-1 size-1" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="flex flex-col rounded-md bg-card p-3 shadow-card">
          <p className="text-sm font-medium text-ink">{formatDayLabel(selected)}</p>
          <p className="mt-0.5 text-xs text-muted">
            {dayCards.length ? `${dayCards.length} 张卡片` : "这一天还没有卡片"}
          </p>
          <div className="mt-3 flex flex-1 flex-col gap-2">
            {dayCards.map((card) => {
              const column = columnOf(card.id);
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onOpenCard(card.id)}
                  className="rounded-sm bg-panel px-3 py-2 text-left transition-[background-color] hover:bg-ink/5"
                >
                  <span className="block text-sm font-medium text-ink">{card.title}</span>
                  {column ? (
                    <span className="mt-0.5 block text-xs text-muted">
                      {COLUMN_META[column].title}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => onAddForDay(selected)}
          >
            为这天添加
          </Button>
        </aside>
      </div>
    </section>
  );
}

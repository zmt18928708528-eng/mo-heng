import { useEffect } from "react";
import { Check } from "lucide-react";
import { formatDayLabel } from "@/lib/kanban/dates";
import { habitsForDay, useHabitsStore } from "@/lib/habits/store";
import { HABIT_IDS, HABIT_META } from "@/lib/habits/types";
import { cn } from "@/lib/utils";

export function PlanPanel({ day }: { day: Date }) {
  const byDay = useHabitsStore((s) => s.byDay);
  const toggle = useHabitsStore((s) => s.toggle);
  const habits = habitsForDay(byDay, day);
  const doneCount = HABIT_IDS.filter((id) => habits[id]).length;

  useEffect(() => {
    void useHabitsStore.persist.rehydrate();
  }, []);

  return (
    <section className="mb-4 rounded-lg bg-panel p-3 sm:p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight text-ink">
            每日打卡
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {formatDayLabel(day)}·运动、不喝糖、洗澡10分钟内各自打卡，记录会出现在日历上
          </p>
        </div>
        <p className="text-sm tabular-nums text-muted">
          <span className="font-medium text-ink">{doneCount}</span> / {HABIT_IDS.length}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {HABIT_IDS.map((id) => {
          const done = habits[id];
          const meta = HABIT_META[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(day, id)}
              aria-pressed={done}
              className={cn(
                "flex items-start gap-3 rounded-md bg-card px-3 py-3 text-left shadow-card transition-[background-color,box-shadow] duration-(--motion-quick) ease-(--ease-out)",
                done ? "ring-1 ring-done/40" : "hover:bg-ink/5",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border",
                  done
                    ? "border-done bg-done text-accent-fg"
                    : "border-line bg-panel text-transparent",
                )}
                aria-hidden="true"
              >
                <Check className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{meta.title}</span>
                <span className="mt-0.5 block text-xs text-muted">{meta.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

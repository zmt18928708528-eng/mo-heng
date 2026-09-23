import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toDayKey } from "@/lib/kanban/dates";
import { emptyDayHabits, type DayHabits, type HabitId } from "./types";

type HabitsState = {
  byDay: Record<string, DayHabits>;
  toggle: (day: Date | string, habitId: HabitId) => void;
  setHabit: (day: Date | string, habitId: HabitId, done: boolean) => void;
};

function dayKey(day: Date | string): string {
  return typeof day === "string" ? day : toDayKey(day);
}

function noopStorage(): Storage {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set) => ({
      byDay: {},
      toggle: (day, habitId) => {
        const key = dayKey(day);
        set((state) => {
          const prev = state.byDay[key] ?? emptyDayHabits();
          return {
            byDay: {
              ...state.byDay,
              [key]: { ...prev, [habitId]: !prev[habitId] },
            },
          };
        });
      },
      setHabit: (day, habitId, done) => {
        const key = dayKey(day);
        set((state) => {
          const prev = state.byDay[key] ?? emptyDayHabits();
          return {
            byDay: {
              ...state.byDay,
              [key]: { ...prev, [habitId]: done },
            },
          };
        });
      },
    }),
    {
      name: "mo-heng-habits",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage() : localStorage,
      ),
      partialize: (state) => ({ byDay: state.byDay }),
      skipHydration: true,
    },
  ),
);

export function habitsForDay(
  byDay: Record<string, DayHabits>,
  day: Date | string,
): DayHabits {
  return byDay[dayKey(day)] ?? emptyDayHabits();
}

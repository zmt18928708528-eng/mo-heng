export const HABIT_IDS = ["exercise", "noSugar", "quickShower"] as const;

export type HabitId = (typeof HABIT_IDS)[number];

export const HABIT_META: Record<
  HabitId,
  { title: string; hint: string }
> = {
  exercise: { title: "运动", hint: "今天完成运动" },
  noSugar: { title: "不喝糖", hint: "不喝含糖饮料" },
  quickShower: { title: "洗澡10分钟内", hint: "洗澡不超过10分钟" },
};

export type DayHabits = Record<HabitId, boolean>;

export function emptyDayHabits(): DayHabits {
  return {
    exercise: false,
    noSugar: false,
    quickShower: false,
  };
}

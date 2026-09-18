export function startOfDay(value: Date | number): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function toDayKey(value: Date | number): string {
  const date = startOfDay(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDayKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return startOfDay(date);
}

export function formatDayLabel(value: Date | number): string {
  const date = new Date(value);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

export function formatMonthTitle(value: Date): string {
  return `${value.getFullYear()} 年 ${value.getMonth() + 1} 月`;
}

export function sameDay(a: Date | number, b: Date | number): boolean {
  return toDayKey(a) === toDayKey(b);
}

export function buildMonthCells(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(start);
    cell.setDate(start.getDate() + index);
    return startOfDay(cell);
  });
}

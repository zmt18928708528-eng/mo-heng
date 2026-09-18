export const COLUMN_IDS = ["todo", "doing", "done"] as const;

export type ColumnId = (typeof COLUMN_IDS)[number];

export type KanbanCard = {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  dueAt?: number | null;
};

export type Columns = Record<ColumnId, string[]>;

export const COLUMN_META: Record<
  ColumnId,
  { title: string; hint: string; tone: "muted" | "accent" | "done" }
> = {
  todo: { title: "待办", hint: "尚未开始", tone: "muted" },
  doing: { title: "进行中", hint: "正在处理", tone: "accent" },
  done: { title: "已完成", hint: "已经收束", tone: "done" },
};

export function isColumnId(value: string): value is ColumnId {
  return (COLUMN_IDS as readonly string[]).includes(value);
}

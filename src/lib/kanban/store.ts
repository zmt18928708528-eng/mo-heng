import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import {
  COLUMN_IDS,
  isColumnId,
  type ColumnId,
  type Columns,
  type KanbanCard,
} from "./types";
import { mergeBoards, type ParsedBoard } from "./io";

type CardFields = {
  title: string;
  description: string;
  dueAt?: number | null;
};

type KanbanState = {
  cards: Record<string, KanbanCard>;
  columns: Columns;
  addCard: (columnId: ColumnId, fields: CardFields) => string;
  updateCard: (id: string, fields: CardFields) => void;
  deleteCard: (id: string) => void;
  moveCard: (activeId: string, overId: string) => void;
  replaceBoard: (board: ParsedBoard) => void;
  mergeBoard: (board: ParsedBoard) => void;
};

const now = 1_725_000_000_000;

const seedCards: Record<string, KanbanCard> = {
  c1: {
    id: "c1",
    title: "整理本周会议纪要",
    description: "把三次讨论里的结论、待确认项和截止日期汇总成一页。",
    createdAt: now,
    updatedAt: now,
    dueAt: now,
  },
  c2: {
    id: "c2",
    title: "更新产品路线图",
    description: "按优先级重排下个迭代的交付项，并标出依赖。",
    createdAt: now + 1,
    updatedAt: now + 1,
    dueAt: now + 86_400_000 * 2,
  },
  c3: {
    id: "c3",
    title: "设计看板交互",
    description: "确认拖拽手感、空列落点和卡片编辑流程。",
    createdAt: now + 2,
    updatedAt: now + 2,
  },
  c4: {
    id: "c4",
    title: "确定四列工作流",
    description: "提前规划、待办、进行中、已完成；每列只保留当前真正需要看见的卡片。",
    createdAt: now + 3,
    updatedAt: now + 3,
  },
};

const seedColumns: Columns = {
  plan: [],
  todo: ["c1", "c2"],
  doing: ["c3"],
  done: ["c4"],
};

function findColumn(columns: Columns, cardId: string): ColumnId | null {
  for (const id of COLUMN_IDS) {
    if (columns[id].includes(cardId)) return id;
  }
  return null;
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

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      cards: seedCards,
      columns: seedColumns,

      addCard: (columnId, fields) => {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `card-${Date.now()}`;
        const ts = Date.now();
        const card: KanbanCard = {
          id,
          title: fields.title.trim(),
          description: fields.description.trim(),
          createdAt: ts,
          updatedAt: ts,
          dueAt: fields.dueAt ?? null,
        };
        set((state) => ({
          cards: { ...state.cards, [id]: card },
          columns: {
            ...state.columns,
            [columnId]: [...state.columns[columnId], id],
          },
        }));
        return id;
      },

      updateCard: (id, fields) => {
        set((state) => {
          const prev = state.cards[id];
          if (!prev) return state;
          return {
            cards: {
              ...state.cards,
              [id]: {
                ...prev,
                title: fields.title.trim(),
                description: fields.description.trim(),
                dueAt: fields.dueAt ?? null,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      deleteCard: (id) => {
        set((state) => {
          const { [id]: _removed, ...rest } = state.cards;
          const columns = { ...state.columns };
          for (const col of COLUMN_IDS) {
            columns[col] = columns[col].filter((cardId) => cardId !== id);
          }
          return { cards: rest, columns };
        });
      },

      moveCard: (activeId, overId) => {
        const { columns } = get();
        if (activeId === overId) return;

        const fromCol = findColumn(columns, activeId);
        if (!fromCol) return;

        const overIsColumn = isColumnId(overId);
        const toCol = overIsColumn ? overId : findColumn(columns, overId);
        if (!toCol) return;

        if (fromCol === toCol) {
          const ids = columns[fromCol];
          const oldIndex = ids.indexOf(activeId);
          const newIndex = overIsColumn ? ids.length - 1 : ids.indexOf(overId);
          if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
          const next = arrayMove(ids, oldIndex, newIndex);
          set({
            columns: {
              ...columns,
              [fromCol]: next,
            },
          });
          return;
        }

        const fromIds = columns[fromCol].filter((id) => id !== activeId);
        const toIds = [...columns[toCol]];
        const overIndex = overIsColumn ? toIds.length : toIds.indexOf(overId);
        const insertAt = overIndex < 0 ? toIds.length : overIndex;
        toIds.splice(insertAt, 0, activeId);

        set({
          columns: {
            ...columns,
            [fromCol]: fromIds,
            [toCol]: toIds,
          },
        });
      },

      replaceBoard: (board) => {
        set({
          cards: board.cards,
          columns: {
            plan: board.columns.plan ?? [],
            todo: board.columns.todo ?? [],
            doing: board.columns.doing ?? [],
            done: board.columns.done ?? [],
          },
        });
      },

      mergeBoard: (board) => {
        const current = get();
        const next = mergeBoards(
          { cards: current.cards, columns: current.columns },
          {
            cards: board.cards,
            columns: {
              plan: board.columns.plan ?? [],
              todo: board.columns.todo ?? [],
              doing: board.columns.doing ?? [],
              done: board.columns.done ?? [],
            },
          },
        );
        set(next);
      },
    }),
    {
      name: "mo-heng-kanban",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage() : localStorage,
      ),
      partialize: (state) => ({ cards: state.cards, columns: state.columns }),
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as Partial<KanbanState>;
        const columns = {
          plan: raw.columns?.plan ?? [],
          todo: raw.columns?.todo ?? current.columns.todo,
          doing: raw.columns?.doing ?? current.columns.doing,
          done: raw.columns?.done ?? current.columns.done,
        };
        return {
          ...current,
          ...raw,
          columns,
          cards: raw.cards ?? current.cards,
        };
      },
      skipHydration: true,
    },
  ),
);

export { findColumn };

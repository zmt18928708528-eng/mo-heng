import { COLUMN_IDS, isColumnId, type ColumnId, type Columns, type KanbanCard } from "./types.ts";

export const BACKUP_VERSION = 1;
export const BACKUP_KIND = "mo-heng-kanban";

export type KanbanBackup = {
  kind: typeof BACKUP_KIND;
  version: number;
  exportedAt: string;
  cards: Record<string, KanbanCard>;
  columns: Columns;
};

export type ParsedBoard = {
  cards: Record<string, KanbanCard>;
  columns: Columns;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseDueAt(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && !Number.isNaN(new Date(raw).getTime()))
    return raw;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function parseCard(id: string, raw: unknown): KanbanCard | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const title = typeof rec.title === "string" ? rec.title.trim() : "";
  if (!title) return null;
  const description = typeof rec.description === "string" ? rec.description : "";
  const createdAt =
    typeof rec.createdAt === "number" && Number.isFinite(rec.createdAt)
      ? rec.createdAt
      : Date.now();
  const updatedAt =
    typeof rec.updatedAt === "number" && Number.isFinite(rec.updatedAt) ? rec.updatedAt : createdAt;
  // Object keys are the canonical IDs referenced by columns.
  const cardId = id.trim();
  if (!cardId || isColumnId(cardId) || ["__proto__", "constructor", "prototype"].includes(cardId))
    return null;
  return {
    id: cardId,
    title,
    description,
    createdAt,
    updatedAt,
    dueAt: parseDueAt(rec.dueAt),
  };
}

function emptyColumns(): Columns {
  return { todo: [], doing: [], done: [] };
}

function parseColumns(raw: unknown, cards: Record<string, KanbanCard>): Columns {
  const columns = emptyColumns();
  const rec = asRecord(raw);
  if (!rec) {
    columns.todo = Object.keys(cards);
    return columns;
  }
  const seen = new Set<string>();
  for (const col of COLUMN_IDS) {
    const list = rec[col];
    if (!Array.isArray(list)) continue;
    columns[col] = list.filter((id): id is string => {
      if (typeof id !== "string" || !Object.hasOwn(cards, id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }
  for (const id of Object.keys(cards)) {
    if (!seen.has(id)) columns.todo.push(id);
  }
  return columns;
}

function parseCardsArray(list: unknown[]): Record<string, KanbanCard> {
  const cards: Record<string, KanbanCard> = {};
  list.forEach((item, index) => {
    const rec = asRecord(item);
    const fallbackId =
      rec && typeof rec.id === "string" && rec.id.trim() ? rec.id.trim() : `imported-${index + 1}`;
    const card = parseCard(fallbackId, item);
    if (card) cards[card.id] = card;
  });
  return cards;
}

function parseCardsRecord(raw: Record<string, unknown>): Record<string, KanbanCard> {
  const cards: Record<string, KanbanCard> = {};
  for (const [id, value] of Object.entries(raw)) {
    const card = parseCard(id, value);
    if (card) cards[card.id] = card;
  }
  return cards;
}

export function buildBackup(board: ParsedBoard): KanbanBackup {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    cards: board.cards,
    columns: board.columns,
  };
}

export function serializeBackup(board: ParsedBoard): string {
  return `${JSON.stringify(buildBackup(board), null, 2)}\n`;
}

export function parseBackup(text: string): ParsedBoard {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("文件不是有效的 JSON。");
  }

  const rec = asRecord(data);
  if (!rec && !Array.isArray(data)) throw new Error("备份格式无法识别。");
  if (rec?.kind !== undefined && rec.kind !== BACKUP_KIND) {
    throw new Error("这不是墨衡看板备份。");
  }
  if (rec?.kind === BACKUP_KIND && rec.version !== BACKUP_VERSION) {
    throw new Error("不支持此备份版本，请使用兼容版本的墨衡打开。");
  }

  const nested = rec ? (asRecord(rec.state) ?? rec) : { cards: data };
  const cardsRec = asRecord(nested.cards);
  const list = Array.isArray(nested.cards) ? nested.cards : null;
  if (!cardsRec && !list) throw new Error("备份缺少卡片数据。");
  const cards = list ? parseCardsArray(list) : parseCardsRecord(cardsRec!);
  const sourceCount = list ? list.length : Object.keys(cardsRec!).length;
  // A genuinely empty board is valid; malformed nonempty data must not erase it.
  if (sourceCount > 0 && Object.keys(cards).length === 0) {
    throw new Error("备份里没有可用的卡片。");
  }

  return {
    cards,
    columns: parseColumns(nested.columns, cards),
  };
}

export function mergeBoards(current: ParsedBoard, incoming: ParsedBoard): ParsedBoard {
  const cards = { ...current.cards, ...incoming.cards };
  const columns = emptyColumns();
  const seen = new Set<string>();

  for (const col of COLUMN_IDS) {
    const ids = [...current.columns[col], ...incoming.columns[col]];
    columns[col] = ids.filter((id) => {
      if (!Object.hasOwn(cards, id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  for (const id of Object.keys(cards)) {
    if (!seen.has(id)) columns.todo.push(id);
  }

  return { cards, columns };
}

export function columnOf(columns: Columns, cardId: string): ColumnId | null {
  for (const id of COLUMN_IDS) {
    if (columns[id].includes(cardId)) return id;
  }
  return null;
}

export { isColumnId };

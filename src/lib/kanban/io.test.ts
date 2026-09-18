import assert from "node:assert/strict";
import test from "node:test";
import { parseBackup, serializeBackup, mergeBoards } from "./io.ts";

const card = { id: "a", title: "任务", description: "", createdAt: 1, updatedAt: 2, dueAt: 0 };
const board = { cards: { a: card }, columns: { todo: ["a"], doing: [], done: [] } };

test("backup round trip preserves dates, content and order", () => {
  assert.deepEqual(parseBackup(serializeBackup(board)), board);
});
test("empty backups can be restored", () => {
  const empty = { cards: {}, columns: { todo: [], doing: [], done: [] } };
  assert.deepEqual(parseBackup(serializeBackup(empty)), empty);
});
test("duplicates within and across columns appear only once; orphan cards remain visible", () => {
  const result = parseBackup(
    JSON.stringify({
      cards: { a: card, b: { ...card, id: "b" } },
      columns: { todo: ["a", "a", "missing"], doing: ["a"], done: [] },
    }),
  );
  assert.deepEqual(result.columns, { todo: ["a", "b"], doing: [], done: [] });
});
test("record keys preserve column membership despite mismatched embedded IDs", () => {
  const result = parseBackup(
    JSON.stringify({ cards: { a: { ...card, id: "different" } }, columns: { done: ["a"] } }),
  );
  assert.equal(result.cards.a.id, "a");
  assert.deepEqual(result.columns.done, ["a"]);
});
test("legacy arrays and persisted store envelopes remain importable", () => {
  assert.deepEqual(parseBackup(JSON.stringify([card])), board);
  assert.deepEqual(parseBackup(JSON.stringify({ state: board, version: 0 })), board);
});
test("invalid, unrelated and future backups are rejected", () => {
  for (const value of [
    "{",
    "null",
    "{}",
    '{"cards":[{}]}',
    JSON.stringify({ ...board, kind: "other" }),
    JSON.stringify({ ...board, kind: "mo-heng-kanban", version: 99 }),
  ]) {
    assert.throws(() => parseBackup(value));
  }
});
test("prototype keys and column IDs cannot become draggable cards or phantom references", () => {
  const result = parseBackup(
    '{"cards":{"a":{"title":"safe"},"__proto__":{"title":"unsafe"},"todo":{"title":"reserved"}},"columns":{"done":["constructor","toString","__proto__","a"]}}',
  );
  assert.deepEqual(Object.keys(result.cards), ["a"]);
  assert.deepEqual(result.columns.done, ["a"]);
  assert.equal(Object.getPrototypeOf(result.cards), Object.prototype);
});
test("out-of-range due dates are normalized", () => {
  const result = parseBackup(JSON.stringify([{ ...card, dueAt: 1e20 }]));
  assert.equal(result.cards.a.dueAt, null);
});
test("merging keeps one copy and uses imported content", () => {
  const incoming = {
    cards: { a: { ...card, title: "更新" } },
    columns: { todo: [], doing: [], done: ["a"] },
  };
  const merged = mergeBoards(board, incoming);
  assert.equal(merged.cards.a.title, "更新");
  assert.deepEqual(merged.columns, board.columns);
});

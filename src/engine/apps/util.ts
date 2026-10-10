/** Small shared helpers. */
import type { EditorState } from "../editor";
import { cloneRow } from "../editor/tree";
import type { Cursor, Row } from "../expr";
import type { Action } from "../keys";

export const cloneRows = (r: Row): Row => cloneRow(r);

export const endOf = (r: Row): Cursor => ({ path: [], index: r.length });

/** An editor holding `row` with the cursor at `index` (default: the end). */
export const editorWith = (row: Row, index = row.length): EditorState =>
  ({ row: cloneRow(row), cursor: { path: [], index }, insert: false, varCycle: null });

/**
 * Undo the editor's automatic `Ans` before a first operator (K §4.4) for editors that hold a tail
 * rather than a whole expression: the K constant (`K=*2+3`, `K=²`, GB p.35–36).
 */
export function stripLeadingAns(before: EditorState, after: EditorState, a: Action): EditorState {
  if (before.row.length !== 0 || a === "ANS") return after;
  const first = after.row[0];
  if (first?.t !== "sym" || first.s !== "ans") return after;
  const row = after.row.slice(1);
  const c = after.cursor;
  const step = c.path[0];
  const cursor: Cursor = step
    ? { path: [{ ...step, node: step.node - 1 }, ...c.path.slice(1)], index: c.index }
    : { path: [], index: Math.max(0, c.index - 1) };
  return { ...after, row, cursor };
}

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

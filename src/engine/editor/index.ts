/**
 * Entry-line editor (Agent A). Pure functions over EditorState: insert symbols and MathPrint
 * templates, overwrite vs insert, delete, clear-to-right, cursor movement through templates,
 * the x/y/z/t/a/b/c cycling key, Classic vs MathPrint entry forms. See docs/SPEC.md §Editor and
 * K §4 (docs/research/keys-menus.md). Tree representation choices are listed in ./keymap.ts.
 *
 * Decisions on points the research leaves [unverified] (SPEC: assumption):
 * - Insert mode (2nd insert) lasts until a cursor key is pressed (◄ ► ▲ ▼ inside the entry,
 *   2nd ◄ / 2nd ►), until clear empties the entry, or until 2nd insert is pressed again (it toggles).
 *   Typing, delete and paste keep it. This is the TI-83/84 rule. The router starts each new entry
 *   from EDITOR_DEFAULTS, which ends it too.
 * - The variable key wraps from c back to x.
 * - delete on a template (cursor just before it) removes the template and keeps its content, slot
 *   after slot: the same as deleting the operator glyph of the Classic form (`√(9+16` → `9+16`,
 *   `5^2` → `52`). delete past the end of a row is a backspace; backspacing into a template steps
 *   into its last slot and deletes there; backspacing in an empty slot unwraps its template the
 *   same way (so `3/□` → `3`, and an empty template disappears).
 * - clear erases everything after the cursor in reading order: the rest of the current slot and
 *   whatever follows each enclosing template. The templates themselves and their other slots stay.
 * - The unit of a U n/d template holds one digit when the template was inserted before the number
 *   (TG p.59). Typing into a unit is therefore accepted only while it is empty or as an overwrite.
 * - ▲ / ▼ from a unit, or from a slot with no stacked partner, return null (history), as GB p.13
 *   pastes into a numerator or unit by reaching history with ▲.
 * - Nesting counts every template level (fractions, roots, powers, ×10ⁿ); a key that would make a
 *   5th level is ignored, as is any edit that would take the entry past 80 cells (cellCount).
 * - "exit" cursor style wins over "insert": at the end of a slot nothing can be overwritten.
 */
import { rowAt, slotRow, slotsOf, sym, type Cursor, type CursorStep, type Node, type Row } from "../expr";
import type { Action } from "../keys";
import type { CursorStyle } from "../screen";
import { endCursor, homeCursor, moveLeft, moveRight, moveVertical } from "./cursor";
import {
  ANS_FIRST_ACTIONS, ANS_FIRST_SYMS, CONVERSION_ACTIONS, CONVERSION_SYMS, VAR_SYMS, keyInsert,
  type EditContext, type Insert,
} from "./keymap";
import { MAX_ENTRY_CELLS, MAX_NESTING, cellCount, cloneRow, isTemplate, lastSlot, nestingDepth, unwrap } from "./tree";

export type { EditContext } from "./keymap";
export { cellCount, nestingDepth, symCells, MAX_ENTRY_CELLS, MAX_NESTING } from "./tree";

export interface EditorState {
  row: Row;
  cursor: Cursor;
  /** 2nd insert: typed characters push right instead of overwriting */
  insert: boolean;
  /** consecutive presses of the variable key cycle x→y→z→t→a→b→c; index of the variable just inserted */
  varCycle: number | null;
}

export const EDITOR_DEFAULTS: EditorState = { row: [], cursor: { path: [], index: 0 }, insert: false, varCycle: null };

/** A fresh empty editor (no shared references with EDITOR_DEFAULTS). */
export const emptyEditor = (): EditorState => ({ row: [], cursor: { path: [], index: 0 }, insert: false, varCycle: null });

export const isEmpty = (ed: EditorState): boolean => ed.row.length === 0;

/**
 * Handle an editing action (2nd already resolved). Returns the new state, or null when the action
 * is not an editing action here (enter, menus, modes, hyp, ▲/▼ that should scroll history, …).
 * A recognised key that is refused (80-cell limit, 5th nesting level, full unit) returns the same
 * state object unchanged.
 */
export function editKey(ed: EditorState, a: Action, ctx: EditContext): EditorState | null {
  switch (a) {
    case "LEFT": return moved(ed, moveLeft(ed.row, ed.cursor));
    case "RIGHT": return moved(ed, moveRight(ed.row, ed.cursor));
    case "HOME": return moved(ed, homeCursor());
    case "END": return moved(ed, endCursor(ed.row));
    case "UP":
    case "DOWN": {
      const c = moveVertical(ed.row, ed.cursor, a === "UP" ? "up" : "down");
      return c ? moved(ed, c) : null;
    }
    case "INSERT": return { ...ed, insert: !ed.insert, varCycle: null };
    case "DELETE": return deleteKey(ed);
    case "CLEAR": return clearKey(ed);
    case "VAR": return varKey(ed);
  }
  const ins = keyInsert(a, rowAt(ed.row, ed.cursor.path), ed.cursor.index, ctx);
  if (!ins) return null;
  if (isEmpty(ed)) {
    const lead = ANS_FIRST_ACTIONS.has(a) ? [sym("ans")] : CONVERSION_ACTIONS.has(a) ? lastAnswer(ctx) : [];
    return apply(ed, withLead(ins, lead), true);
  }
  return apply(ed, ins, true);
}

/**
 * Insert a row at the cursor (history paste, menu items, recalled values, StatVars). It always
 * inserts (never overwrites) and leaves the cursor after the pasted nodes. On an empty entry, a row
 * that starts with a binary/postfix symbol gets `Ans` first and one that starts with a conversion
 * (▸DMS, ▸%, …) gets the previous answer first, as if its key had been pressed (K §4.4); pass
 * `{ ansFirst: false }` to paste verbatim. Refused (state returned unchanged) past 80 cells or 4 levels.
 */
export function pasteRow(ed: EditorState, row: Row, ctx: EditContext, opts: { ansFirst?: boolean } = {}): EditorState {
  const first = row[0];
  if (!first) return ed;
  let lead: Row = [];
  if ((opts.ansFirst ?? true) && isEmpty(ed)) {
    if (first.t === "pow" || (first.t === "sym" && ANS_FIRST_SYMS.has(first.s))) lead = [sym("ans")];
    else if (first.t === "sym" && CONVERSION_SYMS.has(first.s)) lead = lastAnswer(ctx);
  }
  return apply(ed, { nodes: [...lead, ...row] }, false);
}

export type ClearResult = "cleared-right" | "emptied" | "was-empty";

/**
 * What clear will do to this state (call it before passing CLEAR to editKey):
 * "cleared-right" when something lies after the cursor (it is erased), "emptied" when the entry is
 * emptied, "was-empty" when there was nothing to clear (the router may blank the screen).
 */
export function clearAction(ed: EditorState): ClearResult {
  if (isEmpty(ed)) return "was-empty";
  const { path, index } = ed.cursor;
  if (rowAt(ed.row, path).length > index) return "cleared-right";
  for (let k = 0; k < path.length; k++) {
    const step = path[k];
    if (step && rowAt(ed.row, path.slice(0, k)).length > step.node + 1) return "cleared-right";
  }
  return "emptied";
}

/** Cursor shape: "exit" at the end of a non-empty template slot (press ► to leave), else insert/block. */
export function cursorStyle(ed: EditorState): CursorStyle {
  if (ed.cursor.path.length > 0) {
    const r = rowAt(ed.row, ed.cursor.path);
    if (r.length > 0 && ed.cursor.index === r.length) return "exit";
  }
  return ed.insert ? "insert" : "block";
}

// ---------------------------------------------------------------------------------------------

function moved(ed: EditorState, cursor: Cursor): EditorState {
  return { ...ed, cursor, insert: false, varCycle: null };
}

function lastAnswer(ctx: EditContext): Row {
  return ctx.lastAnswerRow && ctx.lastAnswerRow.length ? ctx.lastAnswerRow : [sym("ans")];
}

function withLead(ins: Insert, lead: Row): Insert {
  if (!lead.length) return ins;
  return {
    nodes: [...lead, ...ins.nodes],
    ...(ins.into ? { into: { node: ins.into.node + lead.length, slot: ins.into.slot } } : {}),
  };
}

/**
 * Splice an insertion into a copy of the tree and place the cursor. `typed` applies the one-digit
 * rule for mixed-number units. Returns `ed` itself when a limit refuses the edit.
 */
function apply(ed: EditorState, ins: Insert, typed: boolean): EditorState {
  const root = cloneRow(ed.row);
  const { path, index } = ed.cursor;
  const target = rowAt(root, path);
  const grab = ins.grab ?? 0;
  const overwrite = ins.overwrite && !ed.insert && target[index]?.t === "sym" ? 1 : 0;
  const start = index - grab;
  const nodes = cloneRow(ins.nodes);
  target.splice(start, grab + overwrite, ...nodes);
  const cursor: Cursor = ins.into
    ? { path: [...path, { node: start + ins.into.node, slot: ins.into.slot }], index: 0 }
    : { path, index: start + nodes.length };
  if (!withinLimits(ed.row, root)) return ed;
  if (typed && path.at(-1)?.slot === "whole") {
    const before = rowAt(ed.row, path).length;
    if (target.length > before && target.length > 1) return ed;
  }
  return { ...ed, row: root, cursor, varCycle: null };
}

/** An edit may not grow the entry past 80 cells or 4 nesting levels (it may shrink an oversize one). */
function withinLimits(before: Row, after: Row): boolean {
  const cells = cellCount(after);
  if (cells > MAX_ENTRY_CELLS && cells > cellCount(before)) return false;
  const depth = nestingDepth(after);
  return !(depth > MAX_NESTING && depth > nestingDepth(before));
}

function varKey(ed: EditorState): EditorState {
  const prev = rowAt(ed.row, ed.cursor.path)[ed.cursor.index - 1];
  const current = ed.varCycle === null ? undefined : VAR_SYMS[ed.varCycle];
  if (current && prev?.t === "sym" && prev.s === current) {
    const k = ((ed.varCycle ?? 0) + 1) % VAR_SYMS.length; // c wraps to x (SPEC: assumption)
    const root = cloneRow(ed.row);
    rowAt(root, ed.cursor.path)[ed.cursor.index - 1] = sym(VAR_SYMS[k] ?? "x");
    return { ...ed, row: root, varCycle: k };
  }
  const next = apply(ed, { nodes: [sym("x")], overwrite: true }, true);
  return next === ed ? ed : { ...next, varCycle: 0 };
}

function deleteKey(ed: EditorState): EditorState {
  const root = cloneRow(ed.row);
  const { path, index } = ed.cursor;
  const r = rowAt(root, path);
  const at = r[index];
  if (at) {
    // the node under the cursor: a symbol goes; a template is replaced by its content
    r.splice(index, 1, ...(isTemplate(at) ? unwrap(at) : []));
    return { ...ed, row: root, varCycle: null };
  }
  const cursor = backspace(root, path, index);
  return cursor ? { ...ed, row: root, cursor, varCycle: null } : { ...ed, varCycle: null };
}

/** Delete left of a cursor that sits at the end of its row. Mutates `root`; null if nothing to delete. */
function backspace(root: Row, path: CursorStep[], index: number): Cursor | null {
  const r = rowAt(root, path);
  const prev: Node | undefined = r[index - 1];
  if (prev) {
    if (!isTemplate(prev)) {
      r.splice(index - 1, 1);
      return { path, index: index - 1 };
    }
    const s = lastSlot(prev);
    return backspace(root, [...path, { node: index - 1, slot: s }], slotRow(prev, s).length);
  }
  // an empty slot (or the empty top-level entry)
  const step = path.at(-1);
  if (!step) return null;
  const parentPath = path.slice(0, -1);
  const parent = rowAt(root, parentPath);
  const tmpl = parent[step.node];
  if (!isTemplate(tmpl)) throw new Error("bad cursor path");
  let offset = 0;
  for (const s of slotsOf(tmpl)) {
    if (s === step.slot) break;
    offset += slotRow(tmpl, s).length;
  }
  parent.splice(step.node, 1, ...unwrap(tmpl));
  return { path: parentPath, index: step.node + offset };
}

function clearKey(ed: EditorState): EditorState {
  if (clearAction(ed) !== "cleared-right") return emptyEditor();
  const root = cloneRow(ed.row);
  const { path, index } = ed.cursor;
  rowAt(root, path).splice(index);
  for (let k = path.length - 1; k >= 0; k--) {
    const step = path[k];
    if (step) rowAt(root, path.slice(0, k)).splice(step.node + 1);
  }
  return { ...ed, row: root, varCycle: null };
}

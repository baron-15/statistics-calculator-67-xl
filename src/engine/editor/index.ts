/**
 * Entry-line editor (Agent A). Pure functions over EditorState: insert symbols and MathPrint
 * templates, overwrite vs insert, delete, clear-to-right, cursor movement through templates,
 * the x/y/z/t/a/b/c cycling key, Classic vs MathPrint entry forms. See docs/SPEC.md §Editor.
 */
import type { Action } from "../keys";
import type { Cursor, Row } from "../expr";

export interface EditorState {
  row: Row;
  cursor: Cursor;
  /** 2nd insert: typed characters push right instead of overwriting */
  insert: boolean;
  /** consecutive presses of the variable key cycle x→y→z→t→a→b→c; index of the variable just inserted */
  varCycle: number | null;
}

export const EDITOR_DEFAULTS: EditorState = { row: [], cursor: { path: [], index: 0 }, insert: false, varCycle: null };

export interface EditContext {
  mathprint: boolean;
}

/** Handle an editing action. Returns null when the action is not an editing action. */
export function editKey(ed: EditorState, a: Action, ctx: EditContext): EditorState | null {
  void ed; void a; void ctx;
  return null;
}

/** Insert a row at the cursor (history paste, menu items, Ans). */
export function pasteRow(ed: EditorState, row: Row, ctx: EditContext): EditorState {
  void ctx;
  return { ...ed, row: [...ed.row, ...row], cursor: { path: [], index: ed.row.length + row.length } };
}

export const isEmpty = (ed: EditorState): boolean => ed.row.length === 0;

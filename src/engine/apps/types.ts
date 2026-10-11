/**
 * Apps-layer state types (Agent C owns them; state.ts composes them into CalcState).
 *
 * `AppState` is the active screen and its local UI state. Screens that return somewhere when
 * cleared (menus, errors) keep a snapshot of the screen they came from in `back`.
 * `AppsData` is the stored data the apps own: lists and formulas, stat setup and results, the
 * function table, and the constant K.
 */
import type { EditorState } from "../editor";
import type { ErrorKind } from "../errors";
import type { Row, SymId } from "../expr";
import type { Value } from "../math/value";

/** History browsing: the highlighted item. `line` indexes CalcState.history. */
export type Selection = { line: number; part: "entry" | "result" } | null;

export type MenuId =
  | "prb" | "angle" | "recall" | "clearVar" | "reset"
  | "stats" | "statVars" | "dataMenu" | "listNames";

export type HomeApp = {
  kind: "home";
  selected: Selection;
  /** the K definition is shown after saving it, until the next key (GB p.35 screens) */
  kBanner?: boolean;
};

export type AppState =
  | HomeApp
  /** an error message; clear returns to `back` */
  | { kind: "error"; error: ErrorKind; back: AppState }
  /** a full-screen message such as MEMORY CLEARED */
  | { kind: "message"; text: string }
  | { kind: "menu"; id: MenuId; tab: number; item: number; top: number; back: AppState }
  | { kind: "mode"; row: number; col: number }
  /** the 2nd K constant editor (K=█) */
  | { kind: "constant"; editor: EditorState }
  /**
   * The data editor. `row` is the element index in column `col` (0 … length, where length is the
   * first blank row); `top` is the first visible row. `edit` is a value being typed on the author
   * line; `formula` is the ♦Ln= formula prompt (Add/Edit Frmla).
   */
  | { kind: "data"; col: number; row: number; top: number; edit: EditorState | null; formula: EditorState | null }
  /** 1-Var / 2-Var setup wizard; `row` 0–2 (2 = CALC), `col` the option under the cursor */
  | { kind: "statWizard"; vars: 1 | 2; row: number; col: number }
  /** table step 1: y= function entry */
  | { kind: "tableFunc"; editor: EditorState }
  /** table step 2: Start= / Step= / Auto Ask-x / OK. `field` 0–3; `choice` is the option under the cursor */
  | { kind: "tableSetup"; field: number; choice: number; start: EditorState; step: EditorState; ask: boolean }
  /** table step 3: `first` is the row index of the top visible row, `sel` 0–2 the selected visible row */
  | { kind: "tableView"; first: number; sel: number; edit: EditorState | null };

export interface StatRecord {
  kind: "1-Var" | "2-Var";
  /** results-menu title, e.g. "1-Var:L1,One" */
  title: string;
  items: { key: SymId; value: number | null }[];
}

export interface TableData {
  /** y= function of x */
  func: Row;
  start: Value;
  step: Value;
  /** Ask-x instead of Auto */
  ask: boolean;
  /** Ask-x: the x values typed so far */
  xs: Value[];
}

/** Stored data owned by the apps layer. */
export interface AppsData {
  /** L1, L2, L3 (exact values are kept so fractions stay fractions in the editor) */
  lists: [Value[], Value[], Value[]];
  /** list formulas (♦Ln=…), Classic rows; null = plain data list */
  formulas: [Row | null, Row | null, Row | null];
  /** the remembered stat setup: list indexes 0–2; freq −1 = ONE */
  statSetup: { data: number; freq: number; x: number; y: number };
  /** the last 1-Var/2-Var results (StatVars); null until calculated, and again after the data changes */
  stat: StatRecord | null;
  table: TableData;
  /** the constant K: its definition (kept while off) and whether constant mode is on */
  constant: { row: Row; on: boolean } | null;
}

export interface HistoryRecord {
  entry: Row;
  value: Value;
  /** the result row as displayed when it was computed (mode changes do not reformat history) */
  result: Row;
  /** a ◂▸ toggle line: `entry` is the answer that was toggled; the display adds the ◂▸ marker */
  toggled?: boolean;
}

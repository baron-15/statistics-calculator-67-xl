/**
 * The data editor (K §3.4; M §5.1; D §6 and E10; captures MT_DataEd*, MF_stats1var02).
 *
 * Layout: three columns at x 0–29, 33–62, 66–95 with 1-px rules at columns 31 and 64 (rows 0–22)
 * and a full rule at row 23; four data rows at a 6-row pitch in the 4×5 font, text at x = 33·col;
 * the selected cell inverse over its 30 columns × 6 rows; the first blank row of a list shows the
 * end marker `______`; the author line `L1(5)=` at y=25 with the value 2 px after it. A formula
 * list's label is inverse; the formula prompt is `♦L2=…` with a 4×5 block cursor (MT_DataEd055).
 *
 * Keys: ▲ ▼ rows, ◄ ► columns (no wrap; the row is clamped to the new list's length), 2nd ▲ / 2nd ▼
 * top and first blank row. Typing starts a value on the author line; enter or ▼ stores it and moves
 * down, ▲ stores and moves up. delete removes the element and closes the gap (TG p.86). clear backs
 * out (value → cell → Home). data opens the CLEAR / FORMULA menu; inside a formula it opens Ls.
 * Storing into a formula list, or enter on one, deletes its formula (TG p.79).
 * Values are typed in the linear (Classic) form, the way the 4×5 author line shows them.
 */
import { clearAction, cursorStyle, editKey, emptyEditor, type EditorState } from "../editor";
import type { Action } from "../keys";
import type { CanvasScreen, DrawItem } from "../screen";
import type { CalcState } from "../state";
import { evalRow } from "./calc";
import { fill, invert, menuText, MENU_ADV } from "./canvas";
import { formatPlain, glyphCount, linearText } from "./format";
import { tryCalc } from "./home";
import { formulaValues, MAX_LIST, setFormula, setList, withLists } from "./lists";
import { editContext, homeApp, openApp, openMenu, showError } from "./nav";
import type { AppState } from "./types";
import { clamp } from "./util";

type DataApp = Extract<AppState, { kind: "data" }>;

/** Visible data rows. */
export const DATA_ROWS = 4;
const COL_X = (c: number) => 33 * c;
const AUTHOR_Y = 25;
/** six 4-px dashes on the bottom glyph row (E10) */
const END_OF_LIST = "______";

const keepVisible = (top: number, row: number): number => clamp(top, row - (DATA_ROWS - 1), row);

export function dataKey(s: CalcState, a: Action, hyp: boolean): CalcState {
  const app = s.app;
  if (app.kind !== "data") return s;
  if (app.formula) return formulaKey(s, app, app.formula, a, hyp);
  if (app.edit) return editingKey(s, app, app.edit, a, hyp);
  const len = (c: number) => s.apps.lists[c]?.length ?? 0;
  const move = (col: number, row: number): CalcState => {
    const r = clamp(row, 0, len(col));
    return { ...s, app: { ...app, col, row: r, top: keepVisible(app.top, r) } };
  };
  switch (a) {
    case "UP": return move(app.col, app.row - 1);
    case "DOWN": return move(app.col, app.row + 1);
    case "LEFT": return move(Math.max(0, app.col - 1), app.row);
    case "RIGHT": return move(Math.min(2, app.col + 1), app.row);
    case "TOP": return move(app.col, 0);
    case "BOTTOM": return move(app.col, len(app.col));
    case "CLEAR": return { ...s, app: homeApp() };
    case "DATA": return openMenu(s, "dataMenu", app);
    case "ENTER":
      return s.apps.formulas[app.col] ? withLists(s, s.apps.lists, setFormula(s.apps.formulas, app.col, null)) : s;
    case "DELETE": {
      if (app.row >= len(app.col)) return s;
      const values = s.apps.lists[app.col]?.filter((_, i) => i !== app.row) ?? [];
      const next = withLists(s, setList(s.apps.lists, app.col, values), setFormula(s.apps.formulas, app.col, null));
      return { ...next, app };
    }
    default:
      break;
  }
  const opened = openApp(s, a, app);
  if (opened) return opened;
  // typing starts a new value for the cell
  const ed = emptyEditor();
  const next = editKey(ed, a, editContext(s, app, ed, hyp));
  return next ? { ...s, app: { ...app, edit: next } } : s;
}

function editingKey(s: CalcState, app: DataApp, ed: EditorState, a: Action, hyp: boolean): CalcState {
  switch (a) {
    case "ENTER": case "DOWN": return commit(s, app, ed, +1);
    case "UP": return commit(s, app, ed, -1);
    case "CLEAR":
      if (clearAction(ed) === "was-empty") return { ...s, app: { ...app, edit: null } };
      break;
    case "DATA": return openMenu(s, "dataMenu", { ...app, edit: null });
    default: break;
  }
  const next = editKey(ed, a, editContext(s, app, ed, hyp));
  if (next) return { ...s, app: { ...app, edit: next } };
  return openApp(s, a, app) ?? s;
}

/** Store the typed value in the cell (appending at the first blank row) and move by `dir`. */
function commit(s: CalcState, app: DataApp, ed: EditorState, dir: number): CalcState {
  const col = app.col;
  const values = s.apps.lists[col] ?? [];
  let next = s;
  if (ed.row.length) {
    const r = tryCalc(() => evalRow(s, ed.row).value);
    if (!r.ok) return showError(s, r.error, app);
    if (app.row >= values.length && values.length >= MAX_LIST) return { ...s, app: { ...app, edit: null } };
    const updated = app.row >= values.length ? [...values, r.value] : values.map((v, i) => (i === app.row ? r.value : v));
    next = withLists(s, setList(s.apps.lists, col, updated), setFormula(s.apps.formulas, col, null));
  }
  const len = next.apps.lists[col]?.length ?? 0;
  const row = clamp(app.row + dir, 0, len);
  return { ...next, app: { ...app, edit: null, row, top: keepVisible(app.top, row) } };
}

function formulaKey(s: CalcState, app: DataApp, ed: EditorState, a: Action, hyp: boolean): CalcState {
  switch (a) {
    case "ENTER": {
      if (!ed.row.length) {
        return withLists({ ...s, app: { ...app, formula: null } }, s.apps.lists, setFormula(s.apps.formulas, app.col, null));
      }
      const formulas = setFormula(s.apps.formulas, app.col, ed.row);
      // validate and compute now so errors show (FORMULA, DIM MISMATCH)
      const r = tryCalc(() => formulaValues(s, s.apps.lists, app.col, ed.row));
      if (!r.ok) return showError(s, r.error, app);
      const next = withLists(s, setList(s.apps.lists, app.col, r.value), formulas);
      return { ...next, app: { ...app, formula: null, row: 0, top: 0 } };
    }
    case "CLEAR":
      if (clearAction(ed) === "was-empty") return { ...s, app: { ...app, formula: null } };
      break;
    case "DATA": return openMenu(s, "listNames", app);
    default: break;
  }
  const next = editKey(ed, a, editContext(s, app, ed, hyp));
  if (next) return { ...s, app: { ...app, formula: next } };
  return openApp(s, a, app) ?? s;
}

/** Open the ♦Ln= prompt for the current column, showing its formula (Add/Edit Frmla). */
export function startFormula(s: CalcState, app: DataApp): CalcState {
  const f = s.apps.formulas[app.col] ?? [];
  const formula: EditorState = { ...emptyEditor(), row: f, cursor: { path: [], index: f.length } };
  return { ...s, app: { ...app, edit: null, formula, row: 0, top: 0 } };
}

// ------------------------------------------------------------------------------------------------

export function dataView(s: CalcState): CanvasScreen {
  const app = s.app as DataApp;
  const items: DrawItem[] = [];
  const marks: DrawItem[] = [];
  for (let c = 0; c < 3; c++) {
    const list = s.apps.lists[c] ?? [];
    for (let r = 0; r < DATA_ROWS; r++) {
      const i = app.top + r;
      const y = r * 6;
      const v = list[i];
      if (v) items.push(menuText(COL_X(c), y, formatPlain(v, s.modes, 6)));
      else if (i === list.length) items.push(menuText(COL_X(c), y, END_OF_LIST));
    }
  }
  const selR = app.row - app.top;
  if (selR >= 0 && selR < DATA_ROWS) marks.push(invert(COL_X(app.col), selR * 6, 30, 6));
  const rules = [fill(31, 0, 1, 23), fill(64, 0, 1, 23), fill(0, 23, 96, 1)];
  const screen: CanvasScreen = { kind: "canvas", items: [...items, ...marks, ...rules] };

  const author: DrawItem[] = [];
  if (app.formula) {
    const prefix = `♦L${app.col + 1}=`;
    const text = prefix + linearText(app.formula.row);
    author.push(menuText(0, AUTHOR_Y, text));
    screen.cursor = authorCursor(glyphCount(prefix) * MENU_ADV, app.formula);
  } else {
    const label = `L${app.col + 1}(${app.row + 1})=`;
    author.push(menuText(0, AUTHOR_Y, label));
    if (s.apps.formulas[app.col]) author.push(invert(0, AUTHOR_Y, glyphCount(label) * MENU_ADV + 1, 6));
    const vx = glyphCount(label) * MENU_ADV + 2;
    if (app.edit) {
      author.push(menuText(vx, AUTHOR_Y, linearText(app.edit.row)));
      screen.cursor = authorCursor(vx, app.edit);
    } else {
      const v = s.apps.lists[app.col]?.[app.row];
      if (v) author.push(menuText(vx, AUTHOR_Y, formatPlain(v, s.modes, 12)));
    }
  }
  screen.items.push(...author);
  return screen;
}

/** The 4×5 block cursor over the glyph columns of a linear editor's text that starts at x (MT_DataEd055). */
export function authorCursor(x: number, ed: EditorState, y = AUTHOR_Y) {
  const before = linearText(ed.row.slice(0, ed.cursor.index));
  return { x: x + glyphCount(before) * MENU_ADV + 1, y, w: 4, h: 5, style: cursorStyle(ed) };
}

export function dataArrows(s: CalcState): { up: boolean; down: boolean } {
  const app = s.app as DataApp;
  const longest = Math.max(...s.apps.lists.map((l) => l.length));
  // ↓ only for elements below the window, not the end marker (MT_DataEd02 shows none)
  return { up: app.top > 0, down: longest > app.top + DATA_ROWS };
}

/**
 * The function table (K §3.6; M §6; D §6; captures MT_functable01–07).
 *
 * 1. `y=` and the function of x (big font, MathPrint editing as on Home). enter goes to setup;
 *    a function containing ◂▸, rand, randint or → gives INVALID FUNCTION (GB p.38, TG p.97).
 * 2. Setup, big font: `Start=0` / `Step=1` / `Auto` (cell 0) `Ask-x` (cell 6) / `OK` (cell 14).
 *    Typing overwrites the value from its first character; clear empties it (TG p.97). Step 0 is
 *    refused with DOMAIN (SPEC: assumption: the guidebook only says it cannot be zero).
 * 3. The table: `x` and `y` headers (menu-font variable glyphs at x 10 and 46), a rule at column 36
 *    (rows 0–23) and at row 24, three rows at y 6/12/18 (x values at x=0, y values at x=38), the
 *    selected x cell inverse over columns 0–34, and `x=<value>` at y=26 (MT_functable04). Auto scrolls without end in both
 *    directions; Ask-x rows start empty: type x and enter computes y and moves to the next line,
 *    staying on the third (TG p.22; MT_functable07), delete removes a row.
 * clear backs up one screen (table → setup → y= → Home).
 * Cells that fail to evaluate show `Error` (SPEC: assumption).
 */
import { clearAction, cursorStyle, editKey, emptyEditor, type EditorState } from "../editor";
import { CalcError } from "../errors";
import type { SymId } from "../expr";
import type { Action } from "../keys";
import { evalFunctionAt, type Value } from "../math";
import type { CanvasScreen, DrawItem } from "../screen";
import type { CalcState } from "../state";
import { containsSym, evalContext, evalRow } from "./calc";
import { bigText, cursorBox, fill, invert, math, menuText, rowAscent } from "./canvas";
import { authorCursor } from "./data";
import { classicRowText } from "../../display/symbols";
import { decimalRow, formatPlain, glyphCount, linearText, rationalRow } from "./format";
import { tryCalc } from "./home";
import { editContext, homeApp, openApp, showError } from "./nav";
import type { AppState, TableData } from "./types";
import { editorWith } from "./util";

type SetupApp = Extract<AppState, { kind: "tableSetup" }>;
type ViewApp = Extract<AppState, { kind: "tableView" }>;

const FORBIDDEN: ReadonlySet<SymId> = new Set<SymId>(["toggle", "rand", "randint", "store"]);

// ------------------------------------------------------------------------------------------------
// Step 1: y=

export function tableFuncKey(s: CalcState, a: Action, hyp: boolean): CalcState {
  const app = s.app;
  if (app.kind !== "tableFunc") return s;
  const ed = app.editor;
  switch (a) {
    case "ENTER": {
      if (containsSym(ed.row, FORBIDDEN)) return showError(s, "INVALID FUNCTION", app);
      const next: CalcState = { ...s, apps: { ...s.apps, table: { ...s.apps.table, func: ed.row } } };
      return { ...next, app: setupApp(next.apps.table) };
    }
    case "CLEAR":
      if (clearAction(ed) === "was-empty") return { ...s, app: homeApp() };
      break;
    default: break;
  }
  const next = editKey(ed, a, editContext(s, app, ed, hyp));
  if (next) return { ...s, app: { ...app, editor: next } };
  return openApp(s, a, app) ?? s;
}

export function tableFuncView(s: CalcState): CanvasScreen {
  const app = s.app as Extract<AppState, { kind: "tableFunc" }>;
  const row = app.editor.row;
  const asc = s.modes.display === "MATHPRINT" ? rowAscent(row) : 0;
  return {
    kind: "canvas",
    items: [bigText(0, asc, "y="), math(12, 0, row)],
    cursor: cursorBox(row, app.editor.cursor, 12, 0, cursorStyle(app.editor)),
  };
}

// ------------------------------------------------------------------------------------------------
// Step 2: setup

/** A Start / Step value as an editable linear row (an exact rational as n⁄d), cursor on its first character. */
function valueEditor(v: Value): EditorState {
  const row = v.exact && v.exact.root === 1n && !v.exact.pi ? rationalRow(v.exact.n, v.exact.d) : decimalRow(v.re, false);
  return editorWith(row, 0);
}

const setupApp = (t: TableData): SetupApp =>
  ({ kind: "tableSetup", field: 0, choice: t.ask ? 1 : 0, start: valueEditor(t.start), step: valueEditor(t.step), ask: t.ask });

/** Evaluate the Start / Step fields. Throws CalcError. */
function setupValues(s: CalcState, app: SetupApp): { start: Value; step: Value } {
  const val = (ed: EditorState, old: Value) => (ed.row.length ? evalRow(s, ed.row).value : old);
  const start = val(app.start, s.apps.table.start);
  const step = val(app.step, s.apps.table.step);
  if (step.re === 0) throw new CalcError("DOMAIN", "table step 0");
  return { start, step };
}

export function tableSetupKey(s: CalcState, a: Action, hyp: boolean): CalcState {
  const app = s.app;
  if (app.kind !== "tableSetup") return s;
  const goField = (field: number): CalcState => ({ ...s, app: { ...app, field, choice: app.ask ? 1 : 0 } });
  const editing = app.field === 0 || app.field === 1;
  switch (a) {
    case "UP": return goField(Math.max(0, app.field - 1));
    case "DOWN": return goField(Math.min(3, app.field + 1));
    case "ENTER": {
      if (app.field === 2) return { ...s, app: { ...app, ask: app.choice === 1, field: 3 } };
      if (app.field < 2) return goField(app.field + 1);
      const r = tryCalc(() => setupValues(s, app));
      if (!r.ok) return showError(s, r.error, app);
      const table: TableData = { ...s.apps.table, ...r.value, ask: app.ask };
      return { ...s, apps: { ...s.apps, table }, app: { kind: "tableView", first: 0, sel: 0, edit: null } };
    }
    case "LEFT": case "RIGHT":
      if (app.field === 2) return { ...s, app: { ...app, choice: a === "LEFT" ? 0 : 1 } };
      break;
    case "CLEAR":
      if (!editing || clearAction(app.field === 0 ? app.start : app.step) === "was-empty") {
        const row = s.apps.table.func;
        return { ...s, app: { kind: "tableFunc", editor: editorWith(row) } };
      }
      break;
    default: break;
  }
  if (!editing) return s;
  const ed = app.field === 0 ? app.start : app.step;
  const next = editKey(ed, a, editContext(s, app, ed, hyp));
  if (!next) return openApp(s, a, app) ?? s;
  return { ...s, app: app.field === 0 ? { ...app, start: next } : { ...app, step: next } };
}

export function tableSetupView(s: CalcState): CanvasScreen {
  const app = s.app as SetupApp;
  // big-font lines read like a Classic Home entry (`*` for ×)
  const startText = "Start=" + classicRowText(app.start.row);
  const stepText = "Step=" + classicRowText(app.step.row);
  const items: DrawItem[] = [bigText(0, 0, startText), bigText(0, 8, stepText), bigText(0, 16, "Auto"), bigText(36, 16, "Ask-ẋ"), bigText(84, 24, "OK")];
  items.push(app.ask ? invert(36, 16, 30, 8) : invert(0, 16, 24, 8));
  let cursor: CanvasScreen["cursor"];
  if (app.field === 0 || app.field === 1) {
    const ed = app.field === 0 ? app.start : app.step;
    const cell = (app.field === 0 ? 6 : 5) + glyphCount(classicRowText(ed.row.slice(0, ed.cursor.index)));
    cursor = { x: cell * 6 + 1, y: app.field * 8, w: 5, h: 7, style: cursorStyle(ed) };
  } else if (app.field === 2) {
    cursor = app.choice === 1 ? { x: 36, y: 16, w: 30, h: 8, style: "block" } : { x: 0, y: 16, w: 24, h: 8, style: "block" };
  } else {
    cursor = { x: 84, y: 24, w: 12, h: 8, style: "block" };
  }
  return { kind: "canvas", items, cursor };
}

// ------------------------------------------------------------------------------------------------
// Step 3: the table

/** x of table row `i` (Auto: start + i·step, exact when both are exact rationals). */
export function autoX(t: TableData, i: number): Value {
  const a = t.start.exact;
  const b = t.step.exact;
  const re = t.start.re + i * t.step.re;
  if (a && b && a.root === 1n && b.root === 1n && !a.pi && !b.pi) {
    const k = BigInt(i);
    let n = a.n * b.d + k * b.n * a.d;
    let d = a.d * b.d;
    const g = gcd(n < 0n ? -n : n, d);
    if (g > 1n) {
      n /= g;
      d /= g;
    }
    return { re: Number(n) / Number(d), exact: { n, d, root: 1n, pi: false } };
  }
  return { re };
}

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a || 1n : gcd(b, a % b));

/** y for a given x, or null if the function fails there. */
export function tableY(s: CalcState, x: Value): Value | null {
  if (!s.apps.table.func.length) return null;
  const r = tryCalc(() => evalFunctionAt(s.apps.table.func, x, evalContext(s).ctx));
  return r.ok ? r.value : null;
}

/**
 * An x value as its cell shows it: an exact multiple of π typed in Ask-x keeps its π form (TG p.97:
 * "if you enter 2π, the x-value displays 2π. If you enter 2.0π, the x-value displays 6.28319"),
 * written like the restricted contexts' fractions (`2π`, `π⁄2`); anything else as formatPlain.
 */
export function xText(x: Value, s: CalcState, max: number): string {
  const ex = x.exact;
  if (ex && ex.pi && ex.root === 1n && ex.n !== 0n) {
    const a = ex.n < 0n ? -ex.n : ex.n;
    const text = `${ex.n < 0n ? "⁻" : ""}${a === 1n ? "" : a}π${ex.d === 1n ? "" : `⁄${ex.d}`}`;
    if (glyphCount(text) <= max) return text;
  }
  return formatPlain(x, s.modes, max);
}

function rowX(s: CalcState, i: number): Value | undefined {
  const t = s.apps.table;
  return t.ask ? t.xs[i] : autoX(t, i);
}

export function tableViewKey(s: CalcState, a: Action, hyp: boolean): CalcState {
  const app = s.app;
  if (app.kind !== "tableView") return s;
  const t = s.apps.table;
  const idx = app.first + app.sel;
  const maxIdx = t.ask ? t.xs.length : Infinity;
  const moveTo = (i: number): CalcState => {
    if (i < (t.ask ? 0 : -Infinity) || i > maxIdx) return s;
    let first = app.first;
    let sel = i - first;
    if (sel < 0) { first = i; sel = 0; }
    if (sel > 2) { first = i - 2; sel = 2; }
    return { ...s, app: { kind: "tableView", first, sel, edit: null } };
  };
  if (app.edit) {
    const ed = app.edit;
    switch (a) {
      case "ENTER": return commitX(s, app, ed);
      case "CLEAR":
        if (clearAction(ed) === "was-empty") return { ...s, app: { ...app, edit: null } };
        break;
      default: break;
    }
    const next = editKey(ed, a, editContext(s, app, ed, hyp));
    if (next) return { ...s, app: { ...app, edit: next } };
    return openApp(s, a, app) ?? s;
  }
  switch (a) {
    case "UP": return moveTo(idx - 1);
    case "DOWN": return moveTo(idx + 1);
    case "CLEAR": return { ...s, app: setupApp(t) };
    case "DELETE":
      if (!t.ask || idx >= t.xs.length) return s;
      return { ...s, apps: { ...s.apps, table: { ...t, xs: t.xs.filter((_, i) => i !== idx) } } };
    default: break;
  }
  if (t.ask) {
    const ed = emptyEditor();
    const next = editKey(ed, a, editContext(s, app, ed, hyp));
    if (next) return { ...s, app: { ...app, edit: next } };
  }
  return openApp(s, a, app) ?? s;
}

function commitX(s: CalcState, app: ViewApp, ed: EditorState): CalcState {
  if (!ed.row.length) return { ...s, app: { ...app, edit: null } };
  const r = tryCalc(() => evalRow(s, ed.row).value);
  if (!r.ok) return showError(s, r.error, app);
  const t = s.apps.table;
  const idx = app.first + app.sel;
  const xs = idx < t.xs.length ? t.xs.map((v, i) => (i === idx ? r.value : v)) : [...t.xs, r.value];
  // the cursor moves down to the next of the three lines; on the third it stays (TG p.22
  // "5 [enter] 6 [enter] 10 [enter]", and "to enter more values, highlight any of the three
  // lines"; MT_functable07 shows the third row, 8, still selected)
  return { ...s, apps: { ...s.apps, table: { ...t, xs } }, app: { ...app, sel: Math.min(2, app.sel + 1), edit: null } };
}

export function tableView(s: CalcState): CanvasScreen {
  const app = s.app as ViewApp;
  const items: DrawItem[] = [menuText(10, 0, "ẋ"), menuText(46, 0, "ẏ")];
  for (let r = 0; r < 3; r++) {
    const x = rowX(s, app.first + r);
    if (!x) continue;
    const y = 6 + 6 * r;
    items.push(menuText(0, y, xText(x, s, 7)));
    const v = tableY(s, x);
    items.push(menuText(38, y, v ? formatPlain(v, s.modes, 11) : s.apps.table.func.length ? "Error" : ""));
  }
  items.push(invert(0, 6 + 6 * app.sel, 35, 6));
  items.push(fill(36, 0, 1, 24), fill(0, 24, 96, 1));
  const screen: CanvasScreen = { kind: "canvas", items };
  if (app.edit) {
    items.push(menuText(0, 26, "ẋ=" + linearText(app.edit.row)));
    screen.cursor = authorCursor(2 * 5, app.edit, 26);
  } else {
    const x = rowX(s, app.first + app.sel);
    items.push(menuText(0, 26, "ẋ=" + (x ? xText(x, s, 12) : "")));
  }
  return screen;
}

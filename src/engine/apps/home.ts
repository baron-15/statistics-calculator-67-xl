/**
 * The Home screen (K §4): entry editing through the editor, enter (evaluate, store, repeat, the
 * constant K), the ◂▸ toggle line, clear, and history browsing.
 *
 * Decisions on [unverified] points (SPEC: assumption):
 * - History keeps the newest MAX_HISTORY records (the depth is undocumented, K §4.5).
 * - ▲ from the entry highlights the newest result, then alternates entry / result upward and stops
 *   at the oldest entry; ▼ walks back down and leaves the history below the newest result.
 *   2nd ▲ first jumps to the newest entry and, pressed again, to the oldest (TG p.29); 2nd ▼ returns
 *   to the entry line.
 * - clear while an item is highlighted only leaves the history (nothing is deleted, K §4.3).
 * - Any other key while browsing leaves the history and then acts on the entry.
 * - enter on an empty line repeats the last typed entry (toggle lines are skipped); with the
 *   constant on it applies K to Ans instead (TG p.67: "Ans will appear").
 * - After an error, clear returns to the entry with the cursor at its end (CalcError carries no
 *   position).
 * - 2nd quit on Home also blanks the screen (K §4.7).
 */
import { homeLayout } from "../../display/home";
import { cellCount, clearAction, cursorStyle, editKey, emptyEditor, isEmpty, pasteRow } from "../editor";
import { isCalcError, type ErrorKind } from "../errors";
import { sym, type Row } from "../expr";
import type { Action } from "../keys";
import type { HistoryLine, Screen } from "../screen";
import type { CalcState } from "../state";
import { evalEntry } from "./calc";
import { constantScreen } from "./constant";
import { editContext, homeApp, lastAnswerRow, openApp, showError } from "./nav";
import type { HistoryRecord, HomeApp, Selection } from "./types";
import { cloneRows, endOf } from "./util";

/** History depth kept. SPEC: assumption (undocumented, K §4.5). */
export const MAX_HISTORY = 30;

/** Constant combinations longer than this give EQUATION LENGTH ERROR (GB p.37). */
export const MAX_CONSTANT_ENTRY = 47;

/** Run a calculation; any non-CalcError failure is reported as SYNTAX. */
export function tryCalc<T>(fn: () => T): { ok: true; value: T } | { ok: false; error: ErrorKind } {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    return { ok: false, error: isCalcError(e) ? e.kind : "SYNTAX" };
  }
}

export function homeKey(s0: CalcState, a: Action, hyp: boolean): CalcState {
  let s = s0;
  let app = s.app as HomeApp;
  if (app.kBanner) {
    // the saved K= line stays until the next key, which starts on a blank screen (MT_Conk03)
    app = homeApp();
    s = { ...s, app, firstShown: s.history.length };
  }
  if (app.selected) {
    const r = browseKey(s, a, app.selected);
    if (r) return r;
    app = homeApp();
    s = { ...s, app };
  }
  const opened = openApp(s, a, app);
  if (opened) return withCycleReset(opened);
  const fresh = !!app.fresh;
  switch (a) {
    case "ENTER": return enter(s);
    case "TOGGLE":
      if (fresh && isEmpty(s.editor) && s.history.length > 0) return toggleLine(s);
      break;
    case "CLEAR":
      if (clearAction(s.editor) === "was-empty") {
        // clear on an empty entry blanks the screen; history stays reachable with ▲ (K §4.3)
        return { ...s, editor: emptyEditor(), firstShown: s.history.length, app: homeApp() };
      }
      break;
    case "TOP":
      return s.history.length ? select(s, { line: s.history.length - 1, part: "entry" }) : s;
    case "BOTTOM":
      return s;
    default:
      break;
  }
  const ed = editKey(s.editor, a, editContext(s, app, s.editor, hyp));
  if (ed) return { ...s, editor: ed, app: homeApp() };
  if (a === "UP" && s.history.length) return select(s, { line: s.history.length - 1, part: "result" });
  return withCycleReset(s);
}

const withCycleReset = (s: CalcState): CalcState =>
  s.editor.varCycle === null ? s : { ...s, editor: { ...s.editor, varCycle: null } };

function select(s: CalcState, selected: Selection): CalcState {
  return { ...s, app: homeApp({ selected }), editor: { ...s.editor, varCycle: null } };
}

/** Keys while a history item is highlighted; null = leave the history and handle the key normally. */
function browseKey(s: CalcState, a: Action, sel: NonNullable<Selection>): CalcState | null {
  const last = s.history.length - 1;
  switch (a) {
    case "UP":
      if (sel.part === "result") return select(s, { line: sel.line, part: "entry" });
      return sel.line > 0 ? select(s, { line: sel.line - 1, part: "result" }) : s;
    case "DOWN":
      if (sel.part === "entry") return select(s, { line: sel.line, part: "result" });
      return sel.line < last ? select(s, { line: sel.line + 1, part: "entry" }) : select(s, null);
    case "TOP":
      return select(s, { line: 0, part: "entry" });
    case "BOTTOM":
    case "CLEAR":
      return select(s, null);
    case "ENTER": {
      const rec = s.history[sel.line];
      if (!rec) return select(s, null);
      const row = sel.part === "result" ? rec.result : rec.toggled ? [...rec.entry, sym("toggle")] : rec.entry;
      // paste the highlighted item at the cursor (K §4.5), verbatim
      const ctx = editContext(s, homeApp(), s.editor);
      const editor = pasteRow({ ...s.editor, varCycle: null }, cloneRows(row), ctx, { ansFirst: false });
      return { ...s, editor, app: homeApp() };
    }
    default:
      return null;
  }
}

/** enter: evaluate the entry (with K appended when constant mode is on), or repeat the last one. */
function enter(s: CalcState): CalcState {
  const k = s.apps.constant?.on ? s.apps.constant.row : null;
  let entry = s.editor.row;
  if (entry.length === 0) {
    if (k) entry = [sym("ans")];
    else {
      const last = [...s.history].reverse().find((h) => !h.toggled);
      if (!last) return s;
      entry = last.entry;
    }
  }
  entry = cloneRows(entry);
  if (k) {
    entry = [...entry, ...cloneRows(k)];
    if (cellCount(entry) > MAX_CONSTANT_ENTRY) return showError(atEnd(s), "EQUATION LENGTH ERROR", homeApp());
  }
  return evaluateEntry(s, entry);
}

const atEnd = (s: CalcState): CalcState => ({ ...s, editor: { ...s.editor, cursor: endOf(s.editor.row), varCycle: null } });

/**
 * Evaluate `entry` (the math engine's enter pipeline) and push it to history. A trailing `→x` stores
 * the value, `→rand` seeds rand (K §3.8, §3.2); a trailing ◂▸ shows the alternate form (K §4.16),
 * the marker staying in the entry as typed.
 */
export function evaluateEntry(s: CalcState, entry: Row): CalcState {
  const r = tryCalc(() => evalEntry(s, entry));
  if (!r.ok) return showError(atEnd(s), r.error, homeApp());
  const { r: res, seed } = r.value;
  const store = res.store;
  const vars = store && store !== "rand" ? { ...s.vars, [store]: res.value } : s.vars;
  const randSeed = store === "rand" ? res.value.re : seed;
  return pushRecord({ ...s, ans: res.value, vars, randSeed, editor: emptyEditor() }, { entry, value: res.value, result: res.result });
}

/**
 * ◂▸ right after a result: a new line `<answer>◂▸` with the alternate form, no enter needed
 * (K §4.16, GB-017b, GB-068b `0.7853981633975◂▸` → π/4). It is evaluated as that entry, so Ans
 * takes the alternate value and repeated presses keep toggling.
 */
function toggleLine(s: CalcState): CalcState {
  const answer = lastAnswerRow(s);
  const r = tryCalc(() => evalEntry(s, [...answer, sym("toggle")]));
  if (!r.ok) return showError(s, r.error, homeApp());
  const { value, result } = r.value.r;
  return pushRecord({ ...s, ans: value, editor: emptyEditor() }, { entry: answer, value, result, toggled: true });
}

export function pushRecord(s: CalcState, rec: HistoryRecord): CalcState {
  let history = [...s.history, rec];
  let firstShown = s.firstShown;
  const drop = history.length - MAX_HISTORY;
  if (drop > 0) {
    history = history.slice(drop);
    firstShown = Math.max(0, firstShown - drop);
  }
  return { ...s, history, firstShown, app: homeApp({ fresh: true }) };
}

export function historyLines(s: CalcState): HistoryLine[] {
  return s.history.map((h) => ({ entry: h.entry, result: h.result, ...(h.toggled ? { toggled: true } : {}) }));
}

export function homeView(s: CalcState): Screen {
  const app = s.app as HomeApp;
  if (app.kBanner && s.apps.constant) return constantScreen(s, s.apps.constant.row, null);
  const sel = app.selected;
  return {
    kind: "home",
    mathprint: s.modes.display === "MATHPRINT",
    history: historyLines(s),
    // a highlighted line above the blanked part of the screen is scrolled back into view
    firstShown: sel ? Math.min(s.firstShown, sel.line) : s.firstShown,
    entry: s.editor.row,
    cursor: sel ? null : s.editor.cursor,
    cursorStyle: cursorStyle(s.editor),
    selected: sel,
  };
}

/**
 * ↑ once any history exists (K §5: also on a blank screen after off/on, and on single-line screens
 * such as GS_AnsTog01), except on the oldest entry with nothing scrolled off above; ↓ while browsing
 * (the entry line is below the highlight) or when the renderer has a line below the screen.
 * SPEC: assumption: the captures light ↓ inconsistently after enter (GS_mem05/07 do, GS_mem03 and
 * GS_scroll04 do not), so ↓ is not lit after enter.
 */
export function homeArrows(s: CalcState): { up: boolean; down: boolean } {
  const app = s.app as HomeApp;
  const screen = homeView(s);
  if (screen.kind !== "home") return { up: false, down: false };
  const sel = app.selected;
  const layout = homeLayout(screen);
  const atOldest = !!sel && sel.line === 0 && sel.part === "entry";
  return {
    up: s.history.length > 0 && (!atOldest || layout.hiddenAbove),
    down: !!sel || layout.hiddenBelow,
  };
}


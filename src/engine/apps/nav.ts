/**
 * Moving between screens: going home, error screens, opening apps and menus, and the "current
 * editor" of a screen (where menu items such as nPr, ° or a recalled value are pasted).
 */
import { emptyEditor, isEmpty, pasteRow, type EditContext, type EditorState } from "../editor";
import type { ErrorKind } from "../errors";
import type { Row } from "../expr";
import { answerRow } from "../math";
import type { Action } from "../keys";
import type { CalcState } from "../state";
import { cloneRows, endOf } from "./util";
import type { AppState, HomeApp, MenuId } from "./types";

export const homeApp = (extra: Partial<HomeApp> = {}): HomeApp => ({ kind: "home", selected: null, ...extra });

/**
 * Return to the Home screen. `blank` (2nd quit, power on) leaves an empty screen: the pending entry
 * is dropped and the history scrolls off the top but stays reachable with ▲ (K §4.7, TG p.vi).
 */
export function goHome(s: CalcState, blank: boolean): CalcState {
  if (!blank) return { ...s, app: homeApp() };
  return { ...s, app: homeApp(), editor: emptyEditor(), firstShown: s.history.length };
}

export function showError(s: CalcState, error: ErrorKind, back: AppState): CalcState {
  return { ...s, app: { kind: "error", error, back } };
}

/** The previous answer as the editor pastes it before a conversion or ◂▸ (K §4.4). */
export function lastAnswerRow(s: CalcState): Row {
  return answerRow(s.ans, s.modes);
}

/** Does this screen edit in MathPrint (2-D templates)? Data, table setup and Ask-x lines are linear. */
export function editsMathPrint(s: CalcState, app: AppState): boolean {
  const mp = s.modes.display === "MATHPRINT";
  return mp && (app.kind === "home" || app.kind === "constant" || app.kind === "tableFunc");
}

export function editContext(s: CalcState, app: AppState, ed: EditorState, hyp = false): EditContext {
  return {
    mathprint: editsMathPrint(s, app),
    hyp,
    ...(isEmpty(ed) && app.kind === "home" ? { lastAnswerRow: lastAnswerRow(s) } : {}),
  };
}

/** The editor that menu pastes go into on this screen, or null if the screen has none. */
export function getEditor(s: CalcState, app: AppState): EditorState | null {
  switch (app.kind) {
    case "home": return s.editor;
    case "constant": return app.editor;
    case "data": return app.formula ?? app.edit ?? emptyEditor();
    case "tableFunc": return app.editor;
    case "tableSetup": return app.field === 0 ? app.start : app.field === 1 ? app.step : null;
    case "tableView": return app.edit ?? (s.apps.table.ask ? emptyEditor() : null);
    default: return null;
  }
}

/** Store an edited editor back into its screen (and make that screen current). */
export function setEditor(s: CalcState, app: AppState, ed: EditorState): CalcState {
  switch (app.kind) {
    case "home": return { ...s, editor: ed, app: { ...app, selected: null, fresh: false } };
    case "constant": return { ...s, app: { ...app, editor: ed } };
    case "data": return { ...s, app: app.formula ? { ...app, formula: ed } : { ...app, edit: ed } };
    case "tableFunc": return { ...s, app: { ...app, editor: ed } };
    case "tableSetup": return { ...s, app: app.field === 0 ? { ...app, start: ed } : { ...app, step: ed } };
    case "tableView": return { ...s, app: { ...app, edit: ed } };
    default: return { ...s, app };
  }
}

/** Paste a row at the cursor of `back`'s editor and return to `back` (K §3.1: menus paste text). */
export function pasteInto(s: CalcState, back: AppState, row: Row, ansFirst = true): CalcState {
  const ed = getEditor(s, back);
  if (!ed) return { ...s, app: back };
  const next = pasteRow({ ...ed, varCycle: null }, row, editContext(s, back, ed), { ansFirst: ansFirst && back.kind === "home" });
  return setEditor(s, back, next);
}

export const openMenu = (s: CalcState, id: MenuId, back: AppState): CalcState => ({
  ...s,
  app: { kind: "menu", id, tab: 0, item: 0, top: 0, back },
});

/** A fresh data-editor screen at L1(1) (GB-079d: data reopens at the top of L1). */
export const dataApp = (): AppState => ({ kind: "data", col: 0, row: 0, top: 0, edit: null, formula: null });

/**
 * The keys that open another screen (from Home, or from an app screen that is not a menu).
 * Returns null when `a` is not such a key here. Paste menus (prb, angle, recall) need an editor.
 */
export function openApp(s: CalcState, a: Action, from: AppState): CalcState | null {
  switch (a) {
    case "MODE": return { ...s, app: { kind: "mode", row: 0, col: 0 } };
    case "PRB": return getEditor(s, from) ? openMenu(s, "prb", from) : null;
    case "ANGLE": return getEditor(s, from) ? openMenu(s, "angle", from) : null;
    case "RECALL": return getEditor(s, from) ? openMenu(s, "recall", from) : null;
    case "CLEAR_VAR": return openMenu(s, "clearVar", from);
    case "RESET": return openMenu(s, "reset", from);
    case "STAT": return openMenu(s, "stats", from);
    case "DATA": return { ...s, app: dataApp() };
    case "TABLE": {
      const row = cloneRows(s.apps.table.func);
      return { ...s, app: { kind: "tableFunc", editor: { ...emptyEditor(), row, cursor: endOf(row) } } };
    }
    case "K": {
      const k = s.apps.constant;
      // 2nd K turns constant mode off when it is on; otherwise it opens the editor showing the
      // stored constant (GB p.36: [2nd][K] [2nd][K] [clear] … redefines it).
      if (k?.on) return { ...s, apps: { ...s.apps, constant: { ...k, on: false } } };
      const row = cloneRows(k?.row ?? []);
      return { ...s, app: { kind: "constant", editor: { ...emptyEditor(), row, cursor: endOf(row) } } };
    }
    default: return null;
  }
}

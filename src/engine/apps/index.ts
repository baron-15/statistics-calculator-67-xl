/**
 * Apps layer (Agent C): the key router for every screen, history, memory and modes, and all
 * non-home screens: mode, prb / angle / recall / clear var / reset menus, sto▸, data editor,
 * stat (1-Var/2-Var, StatVars), table, constant K, contrast, error screens. Also builds the View.
 * See docs/SPEC.md §Apps.
 */
import { editKey } from "../editor";
import type { Action } from "../keys";
import type { Row } from "../expr";
import type { Value } from "../math";
import type { View } from "../screen";
import type { CalcState } from "../state";

/** Which screen is active and its local UI state (extend freely; Agent C owns this type). */
export type AppState = { kind: "home"; selected: { line: number; part: "entry" | "result" } | null };

export const APP_DEFAULTS: AppState = { kind: "home", selected: null };

/** Stored data owned by the apps layer (extend freely). */
export interface AppsData {
  lists: [number[], number[], number[]];
}

export const APPS_DATA_DEFAULTS: AppsData = { lists: [[], [], []] };

export interface HistoryRecord {
  entry: Row;
  value: Value;
  /** the result row as displayed when it was computed (mode changes do not reformat history) */
  result: Row;
  toggled?: boolean;
}

/** Route an action (2nd already resolved) to the active screen. */
export function routeAction(s: CalcState, a: Action): CalcState {
  const ed = editKey(s.editor, a, { mathprint: s.modes.display === "MATHPRINT" });
  return ed ? { ...s, editor: ed } : s;
}

/** Build what the display should show. */
export function buildView(s: CalcState): View {
  return {
    screen: {
      kind: "home",
      mathprint: s.modes.display === "MATHPRINT",
      history: s.history.map((h) => ({ entry: h.entry, result: h.result, ...(h.toggled ? { toggled: true } : {}) })),
      firstShown: s.firstShown,
      entry: s.editor.row,
      cursor: s.editor.cursor,
      cursorStyle: s.editor.insert ? "insert" : "block",
      selected: null,
    },
    indicators: [s.modes.angle === "DEG" ? "deg" : s.modes.angle === "RAD" ? "rad" : "grad", ...(s.second ? (["2nd"] as const) : [])],
    contrast: s.contrast,
    on: s.on,
  };
}

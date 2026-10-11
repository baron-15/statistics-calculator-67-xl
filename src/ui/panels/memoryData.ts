/**
 * Data for the always-visible Memory and Mode blocks and the History block (pure; unit tested).
 */
import type { CalcState } from "../../engine";
import { VAR_NAMES, type VarName } from "../../engine/state";
import { readableRow, valueText } from "./text";

export interface MemoryView {
  vars: { name: VarName; text: string }[];
  ans: string;
  /** the constant K: its tail (live while the 2nd K editor is open) and whether it is on */
  k: { text: string; on: boolean; editing: boolean } | null;
  /** the variable the calculator is about to use: highlighted in 2nd recall, or after sto► on Home */
  current: VarName | "k" | null;
  /** what memory operation is in progress, for the block's header */
  activity: string | null;
}

/** The variable after the last → of a Home entry (`5→x`), or "" when none is chosen yet; null without →. */
export function storeTarget(s: CalcState): VarName | "" | null {
  if (s.app.kind !== "home") return null;
  const row = s.editor.row;
  for (let i = row.length - 1; i >= 0; i--) {
    const n = row[i]!;
    if (n.t === "sym" && n.s === "store") {
      const next = row[i + 1];
      return next?.t === "sym" && (VAR_NAMES as string[]).includes(next.s) ? (next.s as VarName) : "";
    }
  }
  return null;
}

export function memoryView(s: CalcState): MemoryView {
  const app = s.app;
  const editingK = app.kind === "constant";
  const k = editingK
    ? { text: readableRow(app.editor.row), on: false, editing: true }
    : s.apps.constant
      ? { text: readableRow(s.apps.constant.row), on: s.apps.constant.on, editing: false }
      : null;
  let current: MemoryView["current"] = null;
  let activity: string | null = null;
  if (app.kind === "menu" && app.id === "recall") {
    current = VAR_NAMES[app.item] ?? null;
    activity = "recall: pick a variable";
  } else if (app.kind === "menu" && app.id === "clearVar") {
    activity = "clear var: Yes sets x–c to 0";
  } else if (editingK) {
    current = "k";
    activity = "editing the constant K";
  } else {
    const target = storeTarget(s);
    if (target !== null) {
      current = target || null;
      activity = target ? `sto► ${target}` : "sto►: press x yzt abc for the variable";
    }
  }
  return {
    vars: VAR_NAMES.map((name) => ({ name, text: valueText(s.vars[name], s.modes) })),
    ans: valueText(s.ans, s.modes),
    k,
    current,
    activity,
  };
}

export interface ModeRowView {
  label: string;
  options: string[];
  /** the current setting */
  selected: number;
}

export interface ModeView {
  rows: ModeRowView[];
  /** the mode screen's cursor while it is open */
  cursor: { row: number; col: number } | null;
}

export function modeView(s: CalcState): ModeView {
  const m = s.modes;
  return {
    rows: [
      { label: "Angle", options: ["DEG", "RAD", "GRAD"], selected: ["DEG", "RAD", "GRAD"].indexOf(m.angle) },
      { label: "Notation", options: ["NORM", "SCI", "ENG"], selected: ["NORM", "SCI", "ENG"].indexOf(m.notation) },
      {
        label: "Decimals",
        options: ["FLOAT", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        selected: m.decimals === "FLOAT" ? 0 : m.decimals + 1,
      },
      { label: "Display", options: ["CLASSIC", "MATHPRINT"], selected: m.display === "CLASSIC" ? 0 : 1 },
    ],
    cursor: s.app.kind === "mode" ? { row: s.app.row, col: s.app.col } : null,
  };
}

export interface HistoryItem {
  /** index in CalcState.history (oldest = 0) */
  line: number;
  entry: string;
  result: string;
  toggled: boolean;
  /** highlighted with ▲ on the Home screen */
  selected: boolean;
}

/** The Home history, newest first. */
export function historyView(s: CalcState): HistoryItem[] {
  const sel = s.app.kind === "home" ? s.app.selected : null;
  return s.history
    .map((h, line) => ({ line, entry: readableRow(h.entry), result: readableRow(h.result), toggled: !!h.toggled, selected: sel?.line === line }))
    .reverse();
}

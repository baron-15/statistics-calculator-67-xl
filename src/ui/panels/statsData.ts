/**
 * Data for the Statistics & data block, shaped from the calculator state with the engine's own math
 * (oneVarStats / twoVarStats, formatPlain) so every number agrees with the LCD:
 * - the three lists, their formulas and the data editor's cursor;
 * - the stat setup and the last results (StatVars), with a note when the lists changed afterwards;
 * - chart data: the five-number summary and a histogram (1-Var), or the points and the regression
 *   line (2-Var), from the lists as they are now.
 */
import { isCalcError } from "../../engine/errors";
import type { CalcState } from "../../engine";
import { SYMS, type SymId } from "../../engine/expr";
import { oneVarStats, twoVarStats, type Modes, type StatResults } from "../../engine/math";
import { linearReadable, MINUS, numberText, plainText } from "./text";

export const LIST_NAMES = ["L1", "L2", "L3"] as const;

export const listName = (i: number): string => LIST_NAMES[i] ?? `L${i + 1}`;

export interface ListColumn {
  name: (typeof LIST_NAMES)[number];
  /** each element as the data editor's author line shows it (12 characters) */
  values: string[];
  /** the formula as typed (`9/5×L1+32`), or null for a plain data list */
  formula: string | null;
}

export interface ListsView {
  columns: ListColumn[];
  /** rows to show: the longest list */
  rows: number;
  /** the data editor's cursor, while it is open */
  cursor: { col: number; row: number } | null;
}

export function listsView(s: CalcState): ListsView {
  const columns = LIST_NAMES.map((name, i): ListColumn => {
    const f = s.apps.formulas[i];
    return {
      name,
      values: (s.apps.lists[i] ?? []).map((v) => plainText(v, s.modes, 12)),
      formula: f ? linearReadable(f) : null,
    };
  });
  const app = s.app.kind === "error" ? s.app.back : s.app;
  const editing = app.kind === "data" ? app : app.kind === "menu" && app.back.kind === "data" ? app.back : null;
  return {
    columns,
    rows: Math.max(0, ...columns.map((c) => c.values.length)),
    cursor: editing ? { col: editing.col, row: editing.row } : null,
  };
}

// ------------------------------------------------------------------------------------------------
// setup and results

export type StatSetup = { kind: "1-Var"; data: number; freq: number | null } | { kind: "2-Var"; x: number; y: number };

/** The lists named by a results title: `1-Var:L1,One`, `1-Var:L1,L2`, `2-Var:L1,L2`. */
export function parseStatTitle(title: string): StatSetup | null {
  const one = /^1-Var:L([123]),(?:One|L([123]))$/.exec(title);
  if (one) return { kind: "1-Var", data: Number(one[1]) - 1, freq: one[2] ? Number(one[2]) - 1 : null };
  const two = /^2-Var:L([123]),L([123])$/.exec(title);
  if (two) return { kind: "2-Var", x: Number(two[1]) - 1, y: Number(two[2]) - 1 };
  return null;
}

export function setupText(setup: StatSetup): string {
  return setup.kind === "1-Var"
    ? `1-Var · data ${listName(setup.data)} · frequency ${setup.freq === null ? "one" : listName(setup.freq)}`
    : `2-Var · x ${listName(setup.x)} · y ${listName(setup.y)}`;
}

/** The setup the block charts: the open wizard's, else the last calculation's, else the stored 1-Var setup. */
export function chartSetup(s: CalcState): StatSetup {
  const st = s.apps.statSetup;
  const app = s.app.kind === "error" ? s.app.back : s.app;
  if (app.kind === "statWizard") {
    return app.vars === 1 ? { kind: "1-Var", data: st.data, freq: st.freq < 0 ? null : st.freq } : { kind: "2-Var", x: st.x, y: st.y };
  }
  const last = s.apps.stat ? parseStatTitle(s.apps.stat.title) : null;
  return last ?? { kind: "1-Var", data: st.data, freq: st.freq < 0 ? null : st.freq };
}

export interface ResultItem {
  key: SymId;
  /** the StatVars name: n, x̄, Sx, σx, Σx² … */
  label: string;
  value: number | null;
  /** the value as text (StatVars field of 11 characters) */
  text: string;
  /** index in the StatVars menu */
  index: number;
}

export interface ResultsView {
  kind: "1-Var" | "2-Var";
  title: string;
  setup: StatSetup | null;
  items: ResultItem[];
  /** the StatVars menu item under the cursor, while that menu is open */
  selected: number | null;
  /** the lists changed after the calculation: the results no longer match them */
  stale: boolean;
  /** 2-Var: y = ax + b */
  regression: { a: number; b: number; r: number | null; text: string } | null;
}

const listRe = (s: CalcState, i: number): number[] => (s.apps.lists[i] ?? []).map((v) => v.re);

/** Compute the stats of a setup from the current lists. Throws CalcError like the calculator. */
export function computeStats(s: CalcState, setup: StatSetup): StatResults {
  if (setup.kind === "1-Var") {
    return oneVarStats(listRe(s, setup.data), setup.freq === null ? null : listRe(s, setup.freq));
  }
  return twoVarStats(listRe(s, setup.x), listRe(s, setup.y), null);
}

export function regressionText(a: number, b: number, modes: Modes): string {
  const bText = numberText(Math.abs(b), modes);
  return `y = ${numberText(a, modes)}x ${b < 0 ? MINUS : "+"} ${bText}`;
}

export function resultsView(s: CalcState): ResultsView | null {
  const st = s.apps.stat;
  if (!st) return null;
  const setup = parseStatTitle(st.title);
  let stale = true;
  if (setup) {
    try {
      const now = computeStats(s, setup);
      stale = now.items.length !== st.items.length || now.items.some((it, i) => it.value !== st.items[i]?.value);
    } catch {
      stale = true;
    }
  }
  const items = st.items
    .map((it, index): ResultItem => ({ key: it.key, label: SYMS[it.key], value: it.value, text: numberText(it.value, s.modes), index }))
    .filter((it) => it.key !== "stat_xprime" && it.key !== "stat_yprime");
  const get = (k: SymId) => st.items.find((it) => it.key === k)?.value ?? null;
  const a = get("stat_a");
  const b = get("stat_b");
  const app = s.app;
  return {
    kind: st.kind,
    title: st.title,
    setup,
    items,
    selected: app.kind === "menu" && app.id === "statVars" ? app.item : null,
    stale,
    regression: st.kind === "2-Var" && a !== null && b !== null ? { a, b, r: get("stat_r"), text: regressionText(a, b, s.modes) } : null,
  };
}

// ------------------------------------------------------------------------------------------------
// charts

export interface BoxSummary {
  min: number;
  q1: number;
  med: number;
  q3: number;
  max: number;
  mean: number;
  n: number;
}

export interface HistogramBin {
  lo: number;
  hi: number;
  /** the total frequency of the values in [lo, hi) (the last bin includes hi) */
  count: number;
}

export type ChartData =
  | { kind: "1-Var"; list: string; box: BoxSummary; bins: HistogramBin[]; values: { x: number; f: number }[] }
  | { kind: "2-Var"; xList: string; yList: string; points: { x: number; y: number }[]; line: { a: number; b: number } | null }
  | { kind: "message"; text: string };

const ERROR_TEXT: Record<string, string> = {
  STAT: "Not enough data",
  "DIVIDE BY 0": "Needs at least two values",
  "DIM MISMATCH": "The frequency list has a different length",
  "FRQ DOMAIN": "Frequencies must be 0–99",
};

function itemValue(r: StatResults, key: SymId): number {
  return r.items.find((it) => it.key === key)?.value ?? Number.NaN;
}

/** Chart data for the block: from the current lists, with the engine's statistics. */
export function chartData(s: CalcState, setup: StatSetup = chartSetup(s)): ChartData {
  if (setup.kind === "1-Var") {
    const data = listRe(s, setup.data);
    const freq = setup.freq === null ? null : listRe(s, setup.freq);
    const list = listName(setup.data);
    if (data.length === 0) return { kind: "message", text: `${list} is empty. Press data and type some values.` };
    let r: StatResults;
    try {
      r = oneVarStats(data, freq);
    } catch (e) {
      return { kind: "message", text: `${list}: ${isCalcError(e) ? (ERROR_TEXT[e.kind] ?? e.kind) : "cannot chart these values"}.` };
    }
    const values = data.map((x, i) => ({ x, f: freq ? (freq[i] ?? 0) : 1 })).filter((v) => v.f > 0);
    const box: BoxSummary = {
      min: itemValue(r, "stat_minX"),
      q1: itemValue(r, "stat_Q1"),
      med: itemValue(r, "stat_Med"),
      q3: itemValue(r, "stat_Q3"),
      max: itemValue(r, "stat_maxX"),
      mean: itemValue(r, "stat_xbar"),
      n: itemValue(r, "stat_n"),
    };
    return { kind: "1-Var", list, box, bins: histogram(values), values };
  }
  const xs = listRe(s, setup.x);
  const ys = listRe(s, setup.y);
  const xList = listName(setup.x);
  const yList = listName(setup.y);
  if (xs.length === 0 || ys.length === 0) return { kind: "message", text: `Type x values in ${xList} and y values in ${yList}.` };
  if (xs.length !== ys.length) return { kind: "message", text: `${xList} has ${xs.length} values and ${yList} has ${ys.length}: they must match.` };
  const points = xs.map((x, i) => ({ x, y: ys[i]! }));
  let line: { a: number; b: number } | null = null;
  try {
    const r = twoVarStats(xs, ys, null);
    line = { a: itemValue(r, "stat_a"), b: itemValue(r, "stat_b") };
  } catch {
    line = null; // one point, or all x equal: no regression line
  }
  return { kind: "2-Var", xList, yList, points, line };
}

/** The "nice" step (1, 2 or 5 × 10ᵏ) nearest to `raw`. */
export function niceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

/**
 * Histogram bins for weighted values. Integers spanning at most 20 get one bin per integer;
 * otherwise about Sturges' number of bins (log₂ n + 1, 1–12) with a nice width.
 */
export function histogram(values: { x: number; f: number }[]): HistogramBin[] {
  const vs = values.filter((v) => v.f > 0 && Number.isFinite(v.x));
  if (vs.length === 0) return [];
  const min = Math.min(...vs.map((v) => v.x));
  const max = Math.max(...vs.map((v) => v.x));
  const n = vs.reduce((t, v) => t + v.f, 0);
  let width: number;
  let start: number;
  if (vs.every((v) => Number.isInteger(v.x)) && max - min <= 20) {
    width = 1;
    start = min - 0.5;
  } else if (max === min) {
    width = 1;
    start = min - 0.5;
  } else {
    const k = Math.min(12, Math.max(1, Math.ceil(Math.log2(n) + 1)));
    width = niceStep((max - min) / k);
    start = Math.floor(min / width) * width;
  }
  const count = Math.max(1, Math.ceil((max - start) / width - 1e-9));
  const bins: HistogramBin[] = Array.from({ length: count }, (_, i) => ({ lo: start + i * width, hi: start + (i + 1) * width, count: 0 }));
  for (const v of vs) {
    const i = Math.min(count - 1, Math.max(0, Math.floor((v.x - start) / width + 1e-9)));
    bins[i]!.count += v.f;
  }
  return bins;
}

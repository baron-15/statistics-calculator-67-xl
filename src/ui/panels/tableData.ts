/**
 * Data for the Function table block, from the engine's own table code (autoX, tableY, xText) so the
 * cells read exactly like the LCD's:
 * - the function, live while the y= editor is open (the block previews it as you type);
 * - Start / Step / Auto or Ask-x, with the setup screen's field and typed text while it is open;
 * - a longer table than the LCD's three rows: Auto starts at the LCD's top row, Ask-x lists every x;
 * - a plot of f(x) over the table's x range, sampled with the engine, broken at gaps and asymptotes.
 */
import type { CalcState } from "../../engine";
import { autoX, tableY, xText } from "../../engine/apps/table";
import type { Value } from "../../engine/math";
import { linearReadable, plainText, readableNumber, readableRow } from "./text";

export const TABLE_ROWS = 12;
/** plot samples across the x range */
export const PLOT_SAMPLES = 121;

export interface TableRowView {
  index: number;
  x: number;
  xText: string;
  y: number | null;
  yText: string;
  /** one of the three rows the LCD shows */
  onLcd: boolean;
  /** the LCD's selected row */
  selected: boolean;
}

export interface TableSettingsView {
  start: string;
  step: string;
  ask: boolean;
  /** the setup screen's field under the cursor (0 Start, 1 Step, 2 Auto/Ask-x, 3 OK) while it is open */
  field: number | null;
}

export interface PlotData {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  /** the sampled curve, split where it is undefined or jumps off the chart */
  segments: { x: number; y: number }[][];
  /** the table rows that have a y value */
  points: { x: number; y: number }[];
}

export interface TableBlockView {
  /** the function as readable text, "" when none is stored */
  func: string;
  /** the y= editor is open: `func` and the values follow the entry being typed */
  live: boolean;
  settings: TableSettingsView;
  rows: TableRowView[];
  plot: PlotData | null;
}

/** The state whose stored function is the one shown: the y= entry while it is being typed. */
function withLiveFunction(s: CalcState): { st: CalcState; live: boolean } {
  if (s.app.kind !== "tableFunc") return { st: s, live: false };
  return { st: { ...s, apps: { ...s.apps, table: { ...s.apps.table, func: s.app.editor.row } } }, live: true };
}

function settingsView(s: CalcState): TableSettingsView {
  const t = s.apps.table;
  const app = s.app.kind === "error" ? s.app.back : s.app;
  if (app.kind === "tableSetup") {
    return {
      start: readableNumber(linearReadable(app.start.row)),
      step: readableNumber(linearReadable(app.step.row)),
      ask: app.field === 2 ? app.choice === 1 : app.ask,
      field: app.field,
    };
  }
  return { start: plainText(t.start, s.modes, 11), step: plainText(t.step, s.modes, 11), ask: t.ask, field: null };
}

export function tableBlockView(s: CalcState, count = TABLE_ROWS, samples = PLOT_SAMPLES): TableBlockView {
  const { st, live } = withLiveFunction(s);
  const t = st.apps.table;
  const app = s.app.kind === "error" ? s.app.back : s.app;
  const viewing = app.kind === "tableView" ? app : null;
  const hasFunc = t.func.length > 0;

  const indexes: number[] = t.ask
    ? t.xs.map((_, i) => i)
    : Array.from({ length: count }, (_, i) => (viewing ? viewing.first : 0) + i);
  const rows = indexes.map((index): TableRowView => {
    const x: Value = t.ask ? t.xs[index]! : autoX(t, index);
    const v = hasFunc ? tableY(st, x) : null;
    return {
      index,
      x: x.re,
      xText: readableNumber(xText(x, st, 11)),
      y: v ? v.re : null,
      yText: v ? plainText(v, st.modes, 11) : hasFunc ? "Error" : "",
      onLcd: !!viewing && index >= viewing.first && index <= viewing.first + 2,
      selected: !!viewing && index === viewing.first + viewing.sel,
    };
  });

  return {
    func: hasFunc ? readableRow(t.func) : "",
    live,
    settings: settingsView(s),
    rows,
    plot: hasFunc ? plotData(st, rows, samples) : null,
  };
}

/** f(x) at a decimal x with the engine (null where it is undefined). */
function sample(s: CalcState, x: number): number | null {
  const v = tableY(s, { re: x });
  return v && Number.isFinite(v.re) ? v.re : null;
}

export function plotData(s: CalcState, rows: readonly TableRowView[], samples = PLOT_SAMPLES): PlotData | null {
  const xs = rows.map((r) => r.x).filter(Number.isFinite);
  if (xs.length === 0) return null;
  let xMin = Math.min(...xs);
  let xMax = Math.max(...xs);
  if (xMin === xMax) {
    xMin -= 1;
    xMax += 1;
  }
  const points = rows.filter((r) => r.y !== null && Number.isFinite(r.y)).map((r) => ({ x: r.x, y: r.y as number }));
  const curve = Array.from({ length: samples }, (_, i) => {
    const x = xMin + ((xMax - xMin) * i) / (samples - 1);
    return { x, y: sample(s, x) };
  });

  // The y range follows the table's values; the curve may widen it (a peak between two rows) but an
  // asymptote may not blow it up.
  const ys = points.map((p) => p.y);
  const finite = curve.flatMap((p) => (p.y === null ? [] : [p.y]));
  if (ys.length === 0 && finite.length === 0) return null;
  let lo = ys.length ? Math.min(...ys) : Math.min(...finite);
  let hi = ys.length ? Math.max(...ys) : Math.max(...finite);
  const span0 = hi - lo || Math.max(1, Math.abs(hi));
  for (const y of finite) {
    if (y >= lo - 2 * span0 && y <= hi + 2 * span0) {
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
  }
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.08;
  const yMin = lo - pad;
  const yMax = hi + pad;
  const height = yMax - yMin;

  const segments: { x: number; y: number }[][] = [];
  let seg: { x: number; y: number }[] = [];
  let prev: number | null = null;
  for (const p of curve) {
    const off = p.y === null || p.y < yMin - height || p.y > yMax + height;
    const jump = p.y !== null && prev !== null && Math.abs(p.y - prev) > 2 * height;
    if (off || jump) {
      if (seg.length > 1) segments.push(seg);
      seg = [];
    }
    if (!off && p.y !== null) seg.push({ x: p.x, y: p.y });
    prev = off ? null : p.y;
  }
  if (seg.length > 1) segments.push(seg);
  return { xMin, xMax, yMin, yMax, segments, points };
}
